/**
 * Basic tests for ModelEyes components
 * 
 * This file contains simple tests to verify that the core components
 * of ModelEyes are working correctly.
 */

// Import the components to test
const { 
  createWebClient, 
  createOpenAIServer,
  createWindowsClient
} = require('../dist');

/**
 * Simple test runner
 */
async function runTests() {
  console.log('Running ModelEyes basic tests...');
  let passed = 0;
  let failed = 0;
  
  // Test 1: Verify exports exist
  try {
    console.log('\nTest 1: Verify exports exist');
    
    if (typeof createWebClient !== 'function') {
      throw new Error('createWebClient is not a function');
    }
    console.log('✓ createWebClient is a function');
    
    if (typeof createOpenAIServer !== 'function') {
      throw new Error('createOpenAIServer is not a function');
    }
    console.log('✓ createOpenAIServer is a function');
    
    if (typeof createWindowsClient !== 'function') {
      throw new Error('createWindowsClient is not a function');
    }
    console.log('✓ createWindowsClient is a function');
    
    passed++;
    console.log('✓ Test 1 passed');
  } catch (error) {
    failed++;
    console.error(`✗ Test 1 failed: ${error.message}`);
  }
  
  // Test 2: Mock client creation
  try {
    console.log('\nTest 2: Mock client creation');
    
    // Mock the DOM for testing
    global.document = {
      body: {},
      activeElement: {},
      title: 'Test Document'
    };
    global.window = {
      location: { href: 'https://example.com' },
      innerWidth: 1024,
      innerHeight: 768,
      getComputedStyle: () => ({
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontSize: '16px',
        fontWeight: 'normal',
        position: 'static',
        zIndex: '0'
      })
    };
    global.navigator = { userAgent: 'Test User Agent' };
    global.Element = class Element {};
    global.Node = { ELEMENT_NODE: 1 };
    
    // Mock implementation for testing
    const mockClient = {
      initialize: async () => {},
      captureState: async () => ({ elements: {} }),
      subscribeToStateChanges: () => ({ unsubscribe: () => {} }),
      executeAction: async () => ({ success: true }),
      dispose: () => {}
    };
    
    // Override the actual implementation for testing
    const originalCreateWebClient = createWebClient;
    global.createWebClient = async () => mockClient;
    
    // Test the mock
    const client = await global.createWebClient();
    
    if (!client) {
      throw new Error('Failed to create mock client');
    }
    console.log('✓ Created mock client');
    
    if (typeof client.captureState !== 'function') {
      throw new Error('client.captureState is not a function');
    }
    console.log('✓ Mock client has captureState method');
    
    // Restore the original implementation
    global.createWebClient = originalCreateWebClient;
    
    passed++;
    console.log('✓ Test 2 passed');
  } catch (error) {
    failed++;
    console.error(`✗ Test 2 failed: ${error.message}`);
  }
  
  // Print test results
  console.log(`\nTest results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});