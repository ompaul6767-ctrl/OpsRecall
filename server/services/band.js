async function createBandRestFacade(apiKey) {
  const [{ BandClient }, { FernRestAdapter, RestFacade }] =
    await Promise.all([
      import('@band-ai/rest-client'),
      import('@band-ai/sdk/rest'),
    ]);
  const client = new BandClient({ apiKey });
  const api = new FernRestAdapter(client);

  return new RestFacade({ api });
}

function normalizeIncidentId(incidentId) {
  const value = String(incidentId ?? '').trim();

  return /^[a-f\d]{24}$/i.test(value)
    ? value.toLowerCase()
    : null;
}

function normalizeStatus(status) {
  const allowedStatuses = new Set([
    'Open',
    'Investigating',
    'Resolved',
    'Comparison only',
  ]);

  return allowedStatuses.has(status)
    ? status
    : 'Investigating';
}

function normalizeMemoryCount(count) {
  return Number.isSafeInteger(count) && count >= 0
    ? count
    : 0;
}

const SAFE_VALIDATION_FIELDS = new Set([
  'message',
  'content',
  'mentions',
  'attachment_ids',
  'id',
  'handle',
  'kind',
  'name',
  'message_type',
  'metadata',
  'source',
  'event',
  'incidentId',
  'chat_id',
  'room_id',
]);

function sanitizeValidationPath(value) {
  const parts = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split('.')
      : [];

  if (
    parts.length === 0 ||
    parts.length > 8 ||
    !parts.every((part) =>
      (typeof part === 'string' && SAFE_VALIDATION_FIELDS.has(part)) ||
      (Number.isSafeInteger(part) && part >= 0 && part <= 999)
    )
  ) {
    return null;
  }

  return parts.join('.');
}

function sanitizeBandErrorBody(value, depth = 0) {
  if (depth > 4) {
    return undefined;
  }

  if (typeof value === 'string') {
    if (value.length > 32768) {
      return undefined;
    }

    try {
      value = JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  if (Array.isArray(value)) {
    const items = value
      .slice(0, 8)
      .map((item) => sanitizeBandErrorBody(item, depth + 1))
      .filter((item) => item !== undefined);

    return items.length > 0 ? items : undefined;
  }

  if (value === null || typeof value !== 'object') {
    return undefined;
  }

  const sanitized = {};

  for (const [key, entry] of Object.entries(value).slice(0, 24)) {
    if (key === 'field' || key === 'path') {
      const path = sanitizeValidationPath(entry);

      if (path) {
        sanitized[key] = path;
      }

      continue;
    }

    if (
      (key === 'status' || key === 'status_code') &&
      Number.isSafeInteger(entry) &&
      entry >= 100 &&
      entry <= 599
    ) {
      sanitized[key] = entry;
      continue;
    }

    if (['error', 'errors', 'issues', 'details', 'violations'].includes(key)) {
      const nested = sanitizeBandErrorBody(entry, depth + 1);

      if (nested !== undefined) {
        sanitized[key] = nested;
      }
    }
  }

  return Object.keys(sanitized).length > 0
    ? sanitized
    : undefined;
}

function collectBandErrorText(value, depth = 0) {
  if (depth > 4) {
    return '';
  }

  if (typeof value === 'string') {
    return value.slice(0, 4096);
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 8)
      .map((item) => collectBandErrorText(item, depth + 1))
      .join(' ');
  }

  if (value === null || typeof value !== 'object') {
    return '';
  }

  return Object.entries(value)
    .filter(([key]) =>
      [
        'error',
        'errors',
        'issues',
        'details',
        'violations',
        'message',
        'detail',
        'description',
        'title',
        'reason',
      ].includes(key)
    )
    .map(([, entry]) => collectBandErrorText(entry, depth + 1))
    .join(' ')
    .slice(0, 8192);
}

function classifyBandErrorBody(value) {
  const text = collectBandErrorText(value).toLowerCase();

  if (
    /\bmention(?:s)?\b/.test(text) &&
    /at least one|required|must include|missing/.test(text)
  ) {
    return 'mention_required';
  }

  return value === undefined || value === null
    ? 'body_unavailable'
    : 'validation_rejected';
}

export function createBandNotifier({
  env = process.env,
  createRestFacade = createBandRestFacade,
  logger = console,
} = {}) {
  let restFacade;
  let cachedApiKey;
  let missingConfigWarned = false;

  async function sendMessage(content) {
    const apiKey =
      typeof env.BAND_AGENT_API_KEY === 'string'
        ? env.BAND_AGENT_API_KEY.trim()
        : '';
    const roomId =
      typeof env.BAND_ROOM_ID === 'string'
        ? env.BAND_ROOM_ID.trim()
        : '';

    if (!apiKey || !roomId) {
      if (!missingConfigWarned) {
        logger.warn(
          'Band notifications are disabled; configure BAND_AGENT_API_KEY and BAND_ROOM_ID to enable them.'
        );
        missingConfigWarned = true;
      }

      return false;
    }

    try {
      if (!restFacade || cachedApiKey !== apiKey) {
        restFacade = await createRestFacade(apiKey);
        cachedApiKey = apiKey;
      }

     const result = await restFacade.createChatMessage(
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
      if (result?.ok === false || result?.success === false) {
        logger.warn('Band did not accept an OpsRecall notification.');
        return false;
      }

      return true;
    } catch (error) {
      const errorStatus = Number.isInteger(error?.statusCode)
        ? error.statusCode
        : null;
      const status =
        errorStatus !== null
          ? `HTTP ${errorStatus}`
          : 'request error';
      const safeBody = errorStatus === 422
        ? sanitizeBandErrorBody(error?.body)
        : undefined;
      const details = errorStatus === 422
        ? `; sanitized response=${JSON.stringify({
          classification: classifyBandErrorBody(error?.body),
          ...(safeBody ? { fields: safeBody } : {}),
        })}`
        : '';

      logger.error(`Band notification failed (${status}${details}).`);
      return false;
    }
  }

  return {
    notifyIncidentAnalyzed({
      incidentId,
      status,
      memoryEnabled,
      memoriesRecalledCount,
    } = {}) {
      const id = normalizeIncidentId(incidentId);

      if (!id) {
        return Promise.resolve(false);
      }

      const recallSummary = memoryEnabled === true
        ? `${normalizeMemoryCount(memoriesRecalledCount)} past incident(s) recalled from Hindsight`
        : 'Hindsight memory was disabled';

      return sendMessage(
        [
          'OpsRecall analysis completed.',
          `Incident ID: ${id}`,
          `Status: ${normalizeStatus(status)}`,
          recallSummary,
          'Review the incident in OpsRecall for analysis details.',
        ].join('\n')
      );
    },

    notifyIncidentResolved({
      incidentId,
      memoryRetained,
    } = {}) {
      const id = normalizeIncidentId(incidentId);

      if (!id) {
        return Promise.resolve(false);
      }

      return sendMessage(
        [
          'OpsRecall incident resolved.',
          `Incident ID: ${id}`,
          `Hindsight retention: ${memoryRetained === true ? 'confirmed' : 'not confirmed'}`,
          'Verified resolution details are stored in OpsRecall.',
        ].join('\n')
      );
    },
  };
}

const bandNotifier = createBandNotifier();

export const notifyIncidentAnalyzed =
  bandNotifier.notifyIncidentAnalyzed;

export const notifyIncidentResolved =
  bandNotifier.notifyIncidentResolved;
