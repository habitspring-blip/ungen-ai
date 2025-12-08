// Simple test script to verify file processing works
const { AdvancedSummarizer } = require('./src/lib/summarization/summarizer.ts');

async function testFileProcessing() {
  console.log('Testing file processing...');

  try {
    const summarizer = new AdvancedSummarizer();

    // Test with a simple text file simulation
    const mockFile = {
      name: 'test.txt',
      type: 'text/plain',
      size: 100,
      arrayBuffer: async () => Buffer.from('This is a test document for processing.'),
      text: async () => 'This is a test document for processing.'
    };

    console.log('Processing mock file...');
    const result = await summarizer.processFile(mockFile, 'test-user-id');

    console.log('✅ File processing successful!');
    console.log('Result:', result);

  } catch (error) {
    console.error('❌ File processing failed:', error);
  }
}

testFileProcessing();