import mongoose from 'mongoose';
import { hs, BANK } from '../services/memory.js';
import { generateResolution } from '../services/llm.js';
import Incident from '../models/Incident.js';

const MAX_LOG_CHARS = 4000;
const RECALL_QUERY_CHARS = 2000;
const TOP_K = 3;

// Normalize text for exact duplicate detection.
function normalizeMemory(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Extract an incident date from memory text.
function extractDate(text = '') {
  const match = text.match(
    /\b(20\d{2}-\d{2}-\d{2})\b/
  );

  return match ? match[1] : null;
}

// Identify common error categories.
function getErrorFamily(text = '') {
  const value = text.toLowerCase();

  if (/\b502\b|bad gateway/.test(value)) {
    return '502';
  }

  if (/\b503\b|service unavailable/.test(value)) {
    return '503';
  }

  if (/\b504\b|gateway timeout/.test(value)) {
    return '504';
  }

  if (/upstream timeout|upstream timed out/.test(value)) {
    return 'upstream-timeout';
  }

  if (/outofmemory|oomkilled|out of memory/.test(value)) {
    return 'oom';
  }

  if (/connection refused/.test(value)) {
    return 'connection-refused';
  }

  // Check Redis first, including "Redis connection timeout".
  if (/redis.{0,30}(?:timeout|timed out)|(?:timeout|timed out).{0,30}redis/.test(value)) {
    return 'redis-timeout';
  }

  if (/connection timeout|server selection timed out/.test(value)) {
    return 'connection-timeout';
  }

  return null;
}

// Build a conservative fingerprint.
// Only group memories when service, error family and date are known.
function getMemoryFingerprint(item) {
  const text = item.text || '';
  const metadata = item.metadata || {};
  const entities = Array.isArray(item.entities)
    ? item.entities
    : [];

  const service =
    metadata.service ||
    entities.find((entity) =>
      /service|api|backend|database/i.test(entity)
    ) ||
    text.match(
      /\b(?:service|where)\s*:\s*([a-z0-9_-]+)/i
    )?.[1] ||
    null;

  const errorFamily = getErrorFamily(text);
  const date = extractDate(text);

  if (!service || !errorFamily || !date) {
    return null;
  }

  return [
    String(service).toLowerCase(),
    errorFamily,
    date,
  ].join('|');
}

// Convert Hindsight result into a consistent object.
function formatMemory(item) {
  const metadata = item.metadata || {};
  const scores = item.scores || {};

  const text = item.text.trim();

  const parsedDate =
    item.occurred_start ||
    item.mentioned_at ||
    null;

  const date = parsedDate
    ? new Date(parsedDate)
    : null;

  return {
    id: item.id || null,
    text,
    documentId: item.document_id || null,
    metadata,
    score:
      typeof scores.final === 'number'
        ? scores.final
        : null,
    semanticScore:
      typeof scores.semantic === 'number'
        ? scores.semantic
        : null,
    title:
      text.split('\n')[0]?.slice(0, 100) ||
      'Past Incident',
    date:
      date && !Number.isNaN(date.getTime())
        ? date
        : null,
    service: metadata.service || null,
    rootCause: metadata.rootCause || null,
  };
}

// Remove duplicates and low-relevance memories.
function deduplicateMemories(results, errorLog = '') {
  const seenText = new Set();
  const seenDocuments = new Set();
  const seenFingerprints = new Set();

  const unique = [];

  const queryFamily = getErrorFamily(errorLog);

  for (const item of results) {
    if (
      !item ||
      typeof item.text !== 'string' ||
      !item.text.trim()
    ) {
      continue;
    }

    const scores = item.scores || {};

    // Semantic relevance threshold.
    if (
      typeof scores.semantic === 'number' &&
      scores.semantic < 0.70
    ) {
      continue;
    }

    // Match error families when the query has a known family.
    if (queryFamily) {
      const memoryFamily = getErrorFamily(item.text);

      if (memoryFamily !== queryFamily) {
        continue;
      }
    }

    const normalized = normalizeMemory(item.text);

    if (!normalized || seenText.has(normalized)) {
      continue;
    }

    const documentId = item.document_id || null;

    if (
      documentId &&
      seenDocuments.has(documentId)
    ) {
      continue;
    }

    const fingerprint = getMemoryFingerprint(item);

    if (
      fingerprint &&
      seenFingerprints.has(fingerprint)
    ) {
      continue;
    }

    seenText.add(normalized);

    if (documentId) {
      seenDocuments.add(documentId);
    }

    if (fingerprint) {
      seenFingerprints.add(fingerprint);
    }

    unique.push(formatMemory(item));
  }

  return unique.slice(0, TOP_K);
}

/**
 * POST /api/incident/analyze
 * body: { errorLog, useMemory, saveIncident }
 */
export async function analyze(req, res) {
  const startTime = Date.now();

  try {
    const {
      errorLog,
      useMemory = true,
      saveIncident = true,
    } = req.body ?? {};

    if (
      typeof errorLog !== 'string' ||
      !errorLog.trim()
    ) {
      return res.status(400).json({
        error: 'errorLog is required.',
      });
    }

    const log = errorLog
      .trim()
      .slice(0, MAX_LOG_CHARS);

    const memoryEnabled =
      useMemory !== false &&
      useMemory !== 'false';

    const shouldSaveIncident =
      saveIncident !== false &&
      saveIncident !== 'false';

    let memories = [];
    let memoryError = false;

    // 1. RECALL
    if (memoryEnabled) {
      try {
        const recall = await hs.recall(
          BANK,
          log.slice(0, RECALL_QUERY_CHARS)
        );

       memories = deduplicateMemories(
          recall?.results ?? [],
          log
        );

        console.log(
          `Hindsight recalled ${recall?.results?.length ?? 0} results; ${memories.length} unique memories selected.`
        );
      } catch (err) {
        memoryError = true;

        console.error(
          'Hindsight recall failed:',
          err?.message || err
        );
      }
    }

    // 2. GENERATE AI RESOLUTION
    let resolution;

    try {
      resolution = await generateResolution(
        log,
        memories
      );
    } catch (err) {
      console.error(
        'AI generation failed:',
        err?.message || err
      );

      return res.status(502).json({
        error:
          'The AI model could not generate a resolution. Please try again.',
      });
    }

    // 3. CREATE MEMORY CARDS
    const memoriesRecalled = memories.map(
      (memory, index) => ({
        id: memory.id || `recalled-${index}`,
        title: memory.title,
        date: memory.date,
        service: memory.service,
        relevanceScore: memory.semanticScore,
        rootCause: memory.rootCause,
        resolutionSteps: memory.text,
        learned: false,
      })
    );

    // 4. SAVE INCIDENT ONLY WHEN REQUESTED
    let incident = null;

    if (shouldSaveIncident) {
      incident = await Incident.create({
        rawErrorLog: log,
        generatedResolution: resolution,
        useMemory: memoryEnabled,
        memoriesRecalledCount:
          memoriesRecalled.length,
        memoriesRecalled,
        memoryRetained: false,
        status: 'Investigating',
      });
    }

    return res.json({
      success: true,

      incidentId: incident
        ? String(incident._id)
        : null,

      savedToHistory: Boolean(incident),

      resolution,
      generatedResolution: resolution,

      memories,
      memoriesRecalled,

      memoryEnabled,
      useMemory: memoryEnabled,
      memoryError,

      status:
        incident?.status ?? 'Comparison only',

      latencyMs: Date.now() - startTime,
    });

  } catch (err) {
    console.error('Analyze Error:', err);

    return res.status(500).json({
      error: 'Failed to analyze incident.',
    });
  }
}

/**
 * POST /api/incident/resolve
 * body: { incidentId, engineerFeedback, rootCause }
 */
export async function resolve(req, res) {
  try {
    const {
      incidentId,
      engineerFeedback,
      rootCause = '',
    } = req.body ?? {};

    if (!mongoose.isValidObjectId(incidentId)) {
      return res.status(400).json({
        error: 'A valid incidentId is required.',
      });
    }

    if (
      typeof engineerFeedback !== 'string' ||
      !engineerFeedback.trim()
    ) {
      return res.status(400).json({
        error: 'engineerFeedback is required.',
      });
    }

    if (typeof rootCause !== 'string') {
      return res.status(400).json({
        error: 'rootCause must be a string.',
      });
    }

    const existing = await Incident.findById(
      incidentId
    );

    if (!existing) {
      return res.status(404).json({
        error: 'Incident not found.',
      });
    }

    // Prevent duplicate memory retention.
    if (existing.status === 'Resolved') {
      return res.json({
        success: true,
        retained: existing.memoryRetained === true,
        alreadyResolved: true,
        status: existing.status,
        incidentId: String(existing._id),
        message: 'Incident was already resolved.',
      });
    }

    const feedback = engineerFeedback.trim();
    const actualRootCause = rootCause.trim();

    // 1. UPDATE MONGODB
    existing.status = 'Resolved';
    existing.engineerFeedback = feedback;
    existing.rootCause = actualRootCause;

    await existing.save();

    // 2. RETAIN RESOLVED INCIDENT IN HINDSIGHT
    let retained = false;

    try {
      const memoryPayload = [
        `Incident: ${existing.rawErrorLog}`,
        `Root Cause: ${
          actualRootCause || 'Not provided'
        }`,
        `AI Suggested Resolution: ${
          existing.generatedResolution ||
          'Not available'
        }`,
        `Resolution by Engineer: ${feedback}`,
      ].join('\n');

      await hs.retain(
        BANK,
        memoryPayload,
        {
          context: 'resolved incident',
          metadata: {
            type: 'resolved_incident',
            incidentId: String(existing._id),
          },
          async: false,
        }
      );

      retained = true;
    } catch (err) {
      console.error(
        'Hindsight retain failed:',
        err?.message || err
      );
    }

    // 3. SAVE RETENTION RESULT
    existing.memoryRetained = retained;

    await existing.save();

    return res.json({
      success: true,
      retained,
      status: existing.status,
      incidentId: String(existing._id),
      message: retained
        ? 'Incident resolved and retained in memory.'
        : 'Incident resolved, but saving to memory failed.',
    });

  } catch (err) {
    console.error('Resolve Error:', err);

    return res.status(500).json({
      error: 'Failed to resolve incident.',
    });
  }
}