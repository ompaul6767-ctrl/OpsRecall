import assert from 'node:assert/strict';
import test from 'node:test';

import { BandClient } from '@band-ai/rest-client';
import { FernRestAdapter, RestFacade } from '@band-ai/sdk/rest';
import { createBandNotifier } from './band.js';

const incidentId = '665f1234567890abcdef1234';

function createLogger() {
  const calls = [];

  return {
    calls,
    warn: (...args) => calls.push(['warn', ...args]),
    error: (...args) => calls.push(['error', ...args]),
  };
}

test('posts only safe analysis metadata to the configured room', async () => {
  const calls = [];
  const logger = createLogger();
  const notifier = createBandNotifier({
    env: {
      BAND_AGENT_API_KEY: 'test-only-key',
      BAND_ROOM_ID: 'test-only-room',
    },
    createRestFacade: (apiKey) => {
      assert.equal(apiKey, 'test-only-key');

      return {
        createChatMessage: async (...args) => {
          calls.push(args);
          return { success: true };
        },
      };
    },
    logger,
  });

  const sent = await notifier.notifyIncidentAnalyzed({
    incidentId,
    status: 'Investigating',
    memoryEnabled: true,
    memoriesRecalledCount: 2,
    rawErrorLog: 'password=hunter2',
    generatedResolution: 'api_key=do-not-send',
  });

  assert.equal(sent, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'test-only-room');
  assert.deepEqual(calls[0][1].mentions, [
  {
    handle: "sujalkhandre93",
    kind: "mention",
    name: "Sujal Khandre",
  },
]);
  assert.equal('messageType' in calls[0][1], false);
  assert.equal('metadata' in calls[0][1], false);
  assert.match(calls[0][1].content, new RegExp(incidentId));
  assert.match(calls[0][1].content, /2 past incident\(s\) recalled/);
  assert.doesNotMatch(calls[0][1].content, /hunter2|do-not-send|password|api_key/i);
  assert.deepEqual(logger.calls, []);
});

test('posts a closure status without root cause or engineer feedback', async () => {
  const calls = [];
  const notifier = createBandNotifier({
    env: {
      BAND_AGENT_API_KEY: 'test-only-key',
      BAND_ROOM_ID: 'test-only-room',
    },
    createRestFacade: () => ({
      createChatMessage: async (...args) => {
        calls.push(args);
        return { success: true };
      },
    }),
    logger: createLogger(),
  });

  const sent = await notifier.notifyIncidentResolved({
    incidentId,
    memoryRetained: true,
    rootCause: 'password=hunter2',
    engineerFeedback: 'api_key=do-not-send',
  });

  assert.equal(sent, true);
  assert.deepEqual(calls[0][1].mentions, [
  {
    handle: "sujalkhandre93",
    kind: "mention",
    name: "Sujal Khandre",
  },
]);
  assert.equal('messageType' in calls[0][1], false);
  assert.equal('metadata' in calls[0][1], false);
  assert.match(calls[0][1].content, /incident resolved/i);
  assert.match(calls[0][1].content, /Hindsight retention: confirmed/);
  assert.doesNotMatch(calls[0][1].content, /hunter2|do-not-send|password|api_key/i);
});

test('Band SDK 422 body is classified safely and remains best-effort', async () => {
  const logger = createLogger();
  const responseBody = {
    message:
      'Messages must include at least one @mention. Alice Example alice@example.test token=private-value',
    apiKey: 'private-value',
    headers: { authorization: 'Bearer private-value' },
  };
  let sdkError;
  const notifier = createBandNotifier({
    env: {
      BAND_AGENT_API_KEY: 'test-only-key',
      BAND_ROOM_ID: 'test-only-room',
    },
    createRestFacade: () => {
      const client = new BandClient({
        apiKey: 'test-only-key',
        baseUrl: 'https://band.invalid',
        maxRetries: 0,
        fetch: async () =>
          new Response(JSON.stringify(responseBody), {
            status: 422,
            headers: { 'content-type': 'application/json' },
          }),
      });
      const facade = new RestFacade({
        api: new FernRestAdapter(client),
      });

      return {
        createChatMessage: async (...args) => {
          try {
            return await facade.createChatMessage(...args);
          } catch (error) {
            sdkError = error;
            throw error;
          }
        },
      };
    },
    logger,
  });

  const sent = await notifier.notifyIncidentResolved({
    incidentId,
    memoryRetained: false,
  });

  assert.equal(sent, false);
  assert.equal(sdkError.name, 'UnprocessableEntityError');
  assert.equal(sdkError.statusCode, 422);
  assert.deepEqual(sdkError.body, responseBody);
  assert.equal('response' in sdkError, false);
  assert.ok(sdkError.rawResponse);
  assert.equal(logger.calls.length, 1);
  assert.match(logger.calls[0][1], /Band notification failed \(HTTP 422(?:;|\))/);
  assert.match(logger.calls[0][1], /"classification":"mention_required"/);
  assert.doesNotMatch(
    JSON.stringify(logger.calls),
    /Alice Example|alice@example\.test|private-value|Bearer|authorization|apiKey/
  );
});

test('skips notifications when Band configuration is missing', async () => {
  const logger = createLogger();
  let facadeCreated = false;
  const notifier = createBandNotifier({
    env: {},
    createRestFacade: () => {
      facadeCreated = true;
      throw new Error('should not be called');
    },
    logger,
  });

  const sent = await notifier.notifyIncidentAnalyzed({
    incidentId,
    status: 'Investigating',
    memoryEnabled: false,
  });

  assert.equal(sent, false);
  assert.equal(facadeCreated, false);
  assert.equal(logger.calls.length, 1);
  assert.match(logger.calls[0][1], /BAND_AGENT_API_KEY and BAND_ROOM_ID/);
});

test('Band SDK serializes the exact supported chat-message request', async () => {
  const calls = [];
  const roomId = '123e4567-e89b-12d3-a456-426614174000';
  const content = 'OpsRecall analysis completed.';
  const client = new BandClient({
    apiKey: 'test-only-key',
    baseUrl: 'https://band.invalid',
    maxRetries: 0,
    fetch: async (url, init) => {
      calls.push({
        method: init.method,
        path: new URL(String(url)).pathname,
        body: JSON.parse(init.body),
      });

      return new Response(
        JSON.stringify({
          data: {
            id: 'test-message-id',
            recipients: [],
            success: true,
          },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    },
  });
  const facade = new RestFacade({
    api: new FernRestAdapter(client),
  });

  const result = await facade.createChatMessage(
    roomId,
    {
      content,
      mentions: [
  {
    handle: "sujalkhandre93",
    kind: "mention",
    name: "Sujal Khandre",
  },
],
    }
  );

  assert.equal(result.success, true);
  assert.deepEqual(calls, [
    {
      method: 'POST',
      path: `/api/v1/agent/chats/${roomId}/messages`,
      body: {
        message: {
          content,
          mentions: [
  {
    handle: "sujalkhandre93",
    kind: "mention",
    name: "Sujal Khandre",
  },
],
        },
      },
    },
  ]);
});
