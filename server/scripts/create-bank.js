
import 'dotenv/config';
import { hs, BANK } from '../services/memory.js';

async function createBank() {
  try {
    const result = await hs.createBank(BANK, {
      name: 'OpsRecall Infrastructure',
    });

    console.log('Memory Bank created successfully!');
    console.log('Bank ID:', BANK);
    console.log(result);
  } catch (error) {
    console.error('Bank creation failed:', error.message);
    process.exitCode = 1;
  }
}

createBank();
