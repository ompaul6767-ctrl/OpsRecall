import 'dotenv/config';
import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  throw new Error(
    'GROQ_API_KEY is missing. Add it to server/.env'
  );
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Models are tried in order.
const MODELS = (
  process.env.GROQ_MODELS ||
  process.env.GROQ_MODEL ||
  'openai/gpt-oss-120b,openai/gpt-oss-20b'
)
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean);

const MAX_MEMORY_CHARS = 1500;

const SYSTEM = `You are OpsRecall, an incident-response assistant for one company's infrastructure.

You receive:
1. A new error log.
2. Relevant memories retrieved from the company's past incidents.

Rules:
- Use the provided memories only for company-specific infrastructure facts.
- Do not invent server names, services, commands, root causes, or infrastructure details.
- A memory is relevant only when its error type, service, or symptoms match the new incident.
- If a memory is relevant, identify the matching past incident and explain which previous resolution may help.
- Treat past resolutions as suggestions, not guaranteed fixes.
- If memories are unrelated, do not claim that a match was found.
- If no memory is relevant, say exactly: "No similar past incident found in memory."
- When no memory is relevant, provide standard debugging suggestions and label them GENERIC.
- Be concise and use numbered steps.

Output Format:
1) Likely Root Cause
2) Step-by-Step Fix
3) Matched Past Incident (if any)`;

function formatMemory(memory, index) {
  // Support both old string memories and new object memories.
  if (typeof memory === 'string') {
    return `[Memory ${index + 1}]\n${memory.slice(
      0,
      MAX_MEMORY_CHARS
    )}`;
  }

  if (!memory || typeof memory !== 'object') {
    return '';
  }

  const text =
    typeof memory.text === 'string'
      ? memory.text
      : typeof memory.resolutionSteps === 'string'
        ? memory.resolutionSteps
        : '';

  if (!text.trim()) {
    return '';
  }

  const metadata =
    memory.metadata &&
    typeof memory.metadata === 'object'
      ? JSON.stringify(memory.metadata)
      : '';

  const score =
    typeof memory.score === 'number'
      ? memory.score
      : null;

  return [
    `[Memory ${index + 1}]`,
    `Memory ID: ${memory.id || 'Not available'}`,
    metadata ? `Metadata: ${metadata}` : '',
    score !== null ? `Relevance score: ${score}` : '',
    `Content: ${text.slice(0, MAX_MEMORY_CHARS)}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function generateResolution(
  errorLog,
  memories = []
) {
  const formattedMemories = memories
    .map((memory, index) =>
      formatMemory(memory, index)
    )
    .filter(Boolean);

  const memoryBlock = formattedMemories.length
    ? formattedMemories.join('\n\n')
    : 'NONE';

  const messages = [
    {
      role: 'system',
      content: SYSTEM,
    },
    {
      role: 'user',
      content: `NEW ERROR LOG:
${errorLog}

INFRASTRUCTURE MEMORIES:
${memoryBlock}

Analyze the error carefully. Only report a matched past incident when the supplied memory actually supports the match.`,
    },
  ];

  let lastError;

  for (const model of MODELS) {
    try {
      const response =
        await groq.chat.completions.create({
          model,
          temperature: 0.2,
          messages,
        });

      const text = (
        response.choices?.[0]?.message?.content ?? ''
      )
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .trim();

      if (!text) {
        throw new Error('Empty response from model.');
      }

      console.log(`Resolution generated with ${model}`);

      return text;
    } catch (error) {
      lastError = error;

      console.warn(
        `Model ${model} failed (${error?.status ?? ''} ${error?.message}). Trying next...`
      );

      if (error?.status === 401) {
        break;
      }
    }
  }

  console.error(
    'All Groq models failed:',
    lastError?.message || lastError
  );

  throw new Error(
    'Failed to generate resolution from LLM.'
  );
}