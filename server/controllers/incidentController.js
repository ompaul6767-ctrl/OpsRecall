import { hs, BANK } from '../services/memory.js';
import { generateResolution } from '../services/llm.js';
import Incident from '../models/Incident.js';

export async function analyze(req, res) {
  try {
    const { errorLog, useMemory = true } = req.body;
    let memories = [];

    // 1. RECALL: Fetch past memories from Hindsight if the switch is ON
    if (useMemory) {
      const recallResponse = await hs.recall(BANK, errorLog);
      if (recallResponse && recallResponse.results) {
        // Extract the text from the top 3 results to keep the prompt fast
        memories = recallResponse.results.slice(0, 3).map(r => r.text);
      }
    }

    // 2. GENERATE: Pass error and memories to the Groq LLM
    const resolution = await generateResolution(errorLog, memories);

    // 3. SAVE: Store the current incident state in MongoDB
    const incident = new Incident({
      rawErrorLog: errorLog,
      generatedResolution: resolution,
      status: 'Investigating'
    });
    await incident.save();

    res.json({ incidentId: incident._id, resolution, memories });
  } catch (err) {
    console.error("Analyze Error:", err);
    res.status(500).json({ error: 'Failed to analyze incident' });
  }
}

export async function resolve(req, res) {
  try {
    const { incidentId, engineerFeedback } = req.body;
    
    // 1. UPDATE: Mark the incident as Resolved in MongoDB
    const incident = await Incident.findByIdAndUpdate(
      incidentId, 
      { status: 'Resolved', engineerFeedback }, 
      { new: true }
    );

    if (!incident) return res.status(404).json({ error: "Incident not found" });

    // 2. RETAIN: Save the successful fix back to Hindsight so the AI learns
    const memoryPayload = `Incident: ${incident.rawErrorLog}\nResolution by Engineer: ${engineerFeedback}`;
    
    await hs.retain(BANK, memoryPayload, { 
      metadata: { type: 'resolved_incident', incidentId: incidentId.toString() } 
    });

    res.json({ success: true, message: "Incident resolved and retained in memory." });
  } catch (err) {
    console.error("Resolve Error:", err);
    res.status(500).json({ error: 'Failed to resolve incident' });
  }
}