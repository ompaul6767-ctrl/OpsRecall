
import {
  saveMemory,
  recallMemory
} from '../services/memory.js';

async function testMemory() {
  try {
    console.log('Saving memory...');

    const saved = await saveMemory(
      'OpsRecall monitors infrastructure incidents and helps resolve server issues.'
    );

    console.log('Memory saved successfully!');
    console.log(saved);

    console.log('\nRetrieving memory...');

    const memories = await recallMemory(
      'What does OpsRecall do?'
    );

    console.log('Retrieved memories:');
    console.log(JSON.stringify(memories, null, 2));

  } catch (error) {
    console.error('Memory test failed:', error);
  }
}

testMemory();
