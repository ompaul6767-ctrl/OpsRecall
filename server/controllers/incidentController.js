import mongoose from 'mongoose';
import { hs, BANK } from '../services/memory.js';
import { generateResolution } from '../services/llm.js';
import Incident from '../models/Incident.js';

const MAX_LOG_CHARS = 4000; // cap stored/sent log size
const RECALL_QUERY_CHARS = 2000; // cap the text sent to Hindsight as the search query
const TOP_K = 3; // how many memories to inject into the prompt

/**
 * POST /api/incident/analyze
 * body: { errorLog: string, useMemory?: boolean }
 * returns: { incidentId, resolution, memories, memoryEnabled, memoryError }
 */
export async function analyze(req, res) {
  try {
    const { errorLog, useMemory = true } = req.body ?? {};

    if (typeof errorLog !== 'string' || !errorLog.trim()) {
      return res.status(400).json({ error: 'errorLog is required.' });
    }

    const log = errorLog.trim().slice(0, MAX_LOG_CHARS);
    const memoryEnabled = useMemory !== false && useMemory !== 'false';

    let memories = [];
    let memoryError = false;

    // 1. RECALL: fetch similar past incidents from Hindsight (if the switch is ON).
    //    If Hindsight fails, keep going without memory instead of failing the request.
    if (memoryEnabled) {
      try {
        const recall = await hs.recall(BANK, log.slice(0, RECALL_QUERY_CHARS));
        memories = (recall?.results ?? [])
          .slice(0, TOP_K)
          .map((r) => r.text)
          .filter(Boolean);
      } catch (err) {
        memoryError = true;
        console.error('Hindsight recall failed, continuing without memory:', err?.message || err);
      }
    }

    // 2. GENERATE: pass the error + recalled memories to the Groq LLM.
    let resolution;
    try {
      resolution = await generateResolution(log, memories);
    } catch (err) {
      return res
        .status(502)
        .json({ error: 'The AI model could not generate a resolution. Please try again.' });
    }

    // 3. SAVE: store the incident in MongoDB.
    const incident = await Incident.create({
      rawErrorLog: log,
      generatedResolution: resolution,
      status: 'Investigating',
    });

    return res.json({
      incidentId: incident._id,
      resolution,
      memories, // array of strings -> show in the "Memories Recalled" panel
      memoryEnabled,
      memoryError, // true if Hindsight was unreachable (UI can show a warning)
    });
  } catch (err) {
    console.error('Analyze Error:', err);
    return res.status(500).json({ error: 'Failed to analyze incident.' });
  }
}

/**
 * POST /api/incident/resolve
 * body: { incidentId: string, engineerFeedback: string }
 * returns: { success, retained, alreadyResolved?, message }
 */
export async function resolve(req, res) {
  try {
    const { incidentId, engineerFeedback } = req.body ?? {};

    if (!mongoose.isValidObjectId(incidentId)) {
      return res.status(400).json({ error: 'A valid incidentId is required.' });
    }
    if (typeof engineerFeedback !== 'string' || !engineerFeedback.trim()) {
      return res.status(400).json({ error: 'engineerFeedback is required.' });
    }

    const existing = await Incident.findById(incidentId);
    if (!existing) return res.status(404).json({ error: 'Incident not found.' });

    // Avoid retaining the same incident twice (would create duplicate memories).
    if (existing.status === 'Resolved') {
      return res.json({
        success: true,
        retained: false,
        alreadyResolved: true,
        message: 'Incident was already resolved.',
      });
    }

    const feedback = engineerFeedback.trim();

    // 1. UPDATE: mark as Resolved in MongoDB.
    existing.status = 'Resolved';
    existing.engineerFeedback = feedback;
    await existing.save();

    // 2. RETAIN: store the error + the human fix in Hindsight so the agent learns it.
    //    async:false waits until the memory is processed, so an immediate re-analyze can recall it.
    let retained = true;
    try {
      const memoryPayload = `Incident: ${existing.rawErrorLog}\nResolution by Engineer: ${feedback}`;
      await hs.retain(BANK, memoryPayload, {
        context: 'resolved incident',
        metadata: { type: 'resolved_incident', incidentId: String(existing._id) },
        async: false,
      });
    } catch (err) {
      retained = false;
      console.error('Hindsight retain failed:', err?.message || err);
    }

    return res.json({
      success: true,
      retained,
      message: retained
        ? 'Incident resolved and retained in memory.'
        : 'Incident resolved, but saving to memory failed.',
    });
  } catch (err) {
    console.error('Resolve Error:', err);
    return res.status(500).json({ error: 'Failed to resolve incident.' });
  }
}