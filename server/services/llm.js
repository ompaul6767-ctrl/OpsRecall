import 'dotenv/config';
import Groq from 'groq-sdk';

// Initialize Groq with the key from your .env file
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// The System Prompt strictly controls how the AI behaves. 
// It prevents hallucinations by forcing it to rely on the Hindsight memories.
const SYSTEM = `You are OpsRecall, an incident-response assistant for ONE company's infrastructure.
You are given a new error log and MEMORIES of past incidents from this company.

Rules:
- For anything specific to this company's servers, use ONLY the memories.
- If a memory matches, explicitly state which past incident it matches and reuse its fix.
- If no memory is relevant, say "No similar past incident found in memory" and provide standard, generic debugging steps labeled as GENERIC.
- Never invent server names, commands, or infrastructure details that are not explicitly present in the memories.

Output Format:
1) Likely Root Cause
2) Step-by-Step Fix
3) Matched Past Incident (if any)`;

export async function generateResolution(errorLog, memories) {
  // Format the Hindsight memories into a readable block for the LLM
  const memoryBlock = memories.length 
    ? memories.map((m, i) => `[Memory ${i + 1}]: ${m}`).join('\n\n') 
    : 'NONE';

  try {
    const res = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL,
      temperature: 0.2, // Low temperature ensures consistent, factual responses
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `NEW ERROR LOG:\n${errorLog}\n\nINFRASTRUCTURE MEMORIES:\n${memoryBlock}` },
      ],
    });
    
    // Some open-source models output reasoning inside <think> tags. This strips it out for a clean UI.
    return res.choices[0].message.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  } catch (error) {
    console.error("Groq LLM Error:", error);
    throw new Error("Failed to generate resolution from LLM.");
  }
}