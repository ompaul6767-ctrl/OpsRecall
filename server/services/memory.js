
import 'dotenv/config';
import { HindsightClient } from '@vectorize-io/hindsight-client';

// Validate API key
if (!process.env.HINDSIGHT_API_KEY) {
  throw new Error(
    'HINDSIGHT_API_KEY is missing. Check server/.env'
  );
}

// Hindsight Cloud connection
export const hs = new HindsightClient({
  baseUrl:
    process.env.HINDSIGHT_BASE_URL ||
    'https://api.hindsight.vectorize.io',

  apiKey: process.env.HINDSIGHT_API_KEY,
});

// Memory bank
export const BANK =
  process.env.HINDSIGHT_BANK_ID || 'opsrecall-infra';

// Save memory
export async function saveMemory(content) {
  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new Error('Memory content cannot be empty');
  }

  return await hs.retain(BANK, content.trim());
}

// Retrieve memory
export async function recallMemory(query) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new Error('Search query cannot be empty');
  }

  const result = await hs.recall(BANK, query.trim());

  return result.results || [];
}
