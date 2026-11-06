import 'dotenv/config';
import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is missing. Add it to server/.env (create a key in the Groq console).');
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Models are tried in order. Set GROQ_MODELS="primary,backup" in .env to override.
const MODELS = (process.env.GROQ_MODELS || process.env.GROQ_MODEL || 'openai/gpt-oss-120b,openai/gpt-oss-20b')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const MAX_MEMORY_CHARS = 1500;

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

  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `NEW ERROR LOG:\n${errorLog}\n\nINFRASTRUCTURE MEMORIES:\n${memoryBlock}` },
  ];

  let lastError;
  for (const model of MODELS) {
    try {
      const res = await groq.chat.completions.create({ model, temperature: 0.2, messages });

      const text = (res.choices?.[0]?.message?.content ?? '')
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .trim();
      if (!text) throw new Error('Empty response from model.');

      console.log(`Resolution generated with ${model}`);
      return text;
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} failed (${err?.status ?? ''} ${err?.message}). Trying next...`);
      if (err?.status === 401) break; // bad API key: other models will fail too
    }
  }

  console.error('All Groq models failed:', lastError?.message || lastError);
  throw new Error('Failed to generate resolution from LLM.');
}