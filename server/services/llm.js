import 'dotenv/config';
import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is missing. Add it to server/.env (create a key in the Groq console).');
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL || 'qwen/qwen3-32b';

// Keep each memory short so the prompt stays fast and within limits.
const MAX_MEMORY_CHARS = 1500;

// The system prompt controls behavior. It forces the model to ground
// infrastructure-specific claims in Hindsight memories and not invent details.
const SYSTEM = `You are OpsRecall, an incident-response assistant for ONE company's infrastructure.
You are given a new error log and MEMORIES of past incidents from this company.

Rules:
- For anything specific to this company's servers, use ONLY the memories.
- If a memory matches, explicitly state which past incident it matches and reuse its fix.
- If no memory is relevant, say "No similar past incident found in memory" and provide standard, generic debugging steps labeled as GENERIC.
- Never invent server names, commands, or infrastructure details that are not explicitly present in the memories.
- Be concise and use numbered steps.

Output Format:
1) Likely Root Cause
2) Step-by-Step Fix
3) Matched Past Incident (if any)`;

export async function generateResolution(errorLog, memories = []) {
  const memoryBlock = memories.length
    ? memories.map((m, i) => `[Memory ${i + 1}]: ${String(m).slice(0, MAX_MEMORY_CHARS)}`).join('\n\n')
    : 'NONE';

  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.2, // low temperature = consistent, factual answers
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `NEW ERROR LOG:\n${errorLog}\n\nINFRASTRUCTURE MEMORIES:\n${memoryBlock}`,
        },
      ],
    });

    // Some open models emit reasoning inside <think> tags; strip it for a clean UI.
    const text = (res.choices?.[0]?.message?.content ?? '')
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .trim();

    if (!text) throw new Error('Model returned an empty response.');
    return text;
  } catch (error) {
    console.error('Groq LLM Error:', error?.message || error);
    throw new Error('Failed to generate resolution from LLM.');
  }
}