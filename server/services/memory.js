import 'dotenv/config';
import { HindsightClient } from '@vectorize-io/hindsight-client';

// Initialize the Hindsight connection using your API key
export const hs = new HindsightClient({
  baseUrl: 'https://api.hindsight.vectorize.io',
  apiKey: process.env.HINDSIGHT_API_KEY,
});

// We create a specific "bank" (like a folder) for our infrastructure memories
export const BANK = 'opsrecall-infra';