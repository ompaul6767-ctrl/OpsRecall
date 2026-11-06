import 'dotenv/config';
import { HindsightClient } from '@vectorize-io/hindsight-client';

// Fail fast with a clear message instead of a confusing 401 later.
if (!process.env.HINDSIGHT_API_KEY) {
  throw new Error(
    'HINDSIGHT_API_KEY is missing. Add it to server/.env (create a key from the Connect page in Hindsight Cloud).'
  );
}

// Hindsight Cloud connection (memory layer)
export const hs = new HindsightClient({
  baseUrl: process.env.HINDSIGHT_BASE_URL || 'https://api.hindsight.vectorize.io',
  apiKey: process.env.HINDSIGHT_API_KEY,
});

// One "bank" = one isolated memory store. All infrastructure memories live here.
export const BANK = process.env.HINDSIGHT_BANK_ID || 'opsrecall-infra';