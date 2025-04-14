/**
 * ModelEyes Demonstration Script
 *
 * This script demonstrates how to use ModelEyes in a real-world scenario,
 * showing the benefits of structured UI representation over screenshots.
 */

// Import the MCP components
const { createWebClient, createOpenAIServer } = require('../dist'); // Import ModelEyes components

// Sample user queries to demonstrate
const sampleQueries = [
  "Click the submit button",
  "Fill in the name field with 'John Doe'",
  "Select 'United States' from the country dropdown",
  "Check the subscribe checkbox",
  "Clear the form"
];

// Sample UI elements for comparison
const sampleScreenshotSize = 1024 * 768 * 4; // Approx 3MB for a screenshot (1024x768 RGBA)

/**
 * Demonstrate the MCP with structured UI representation
 */
async function demonstrateMCP() {
  console.log("=".repeat(80));
  console.log("MODELEYES DEMONSTRATION");
  console.log("=".repeat(80));
  console.log("\nInitializing MCP components...");
  
  try {
    // Initialize the client and server
    const client = await createWebClient();
    console.log("✓ Web client initialized");
    
    const server = await createOpenAIServer("demo-api-key");
    console.log("✓ OpenAI server initialized");
    
    // Capture the initial UI state
    console.log("\nCapturing UI state...");
    const initialState = await client.captureState();
    
    // Calculate the size of the structured representation
    const structuredSize = JSON.stringify(initialState).length;
    
    console.log(`✓ Captured UI state with ${Object.keys(initialState.elements).length} elements`);
    console.log(`✓ Structured representation size: ${formatBytes(structuredSize)}`);
    console.log(`✓ Equivalent screenshot size: ${formatBytes(sampleScreenshotSize)}`);
    console.log(`✓ Size reduction: ${((1 - structuredSize / sampleScreenshotSize) * 100).toFixed(2)}%`);
    
    // Process the initial state on the server
    server.processInitialState(initialState);
    console.log("✓ Processed initial state on server");
    
    // Subscribe to state changes
    client.subscribeToStateChanges((update) => {
      console.log(`✓ Received state update with ${update.added ? Object.keys(update.added).length : 0} added, ${update.modified ? Object.keys(update.modified).length : 0} modified, and ${update.removed ? update.removed.length : 0} removed elements`);
      server.processStateUpdate(update);
    });
    
    // Prepare context for the model
    console.log("\nPreparing context for AI model...");
    const context = server.prepareContextForModel();
    console.log(`✓ Prepared context with ${context.tokenCount} tokens`);
    
    // Demonstrate processing user queries
    console.log("\nDemonstrating query processing:");
    
    for (const query of sampleQueries) {
      console.log(`\nUser query: "${query}"`);
      
      // Simulate model output based on the query
      const modelOutput = simulateModelOutput(query);
      console.log(`AI response: ${modelOutput}`);
      
      // Generate an action based on the model output
      const action = server.generateAction(modelOutput);
      console.log(`Generated action: ${action.type} on element ${action.targetId} ${action.data ? `with data "${action.data}"` : ''}`);
      
      // Execute the action (simulated)
      console.log("Executing action...");
      const result = { success: true };
      
      if (result.success) {
        console.log("✓ Action executed successfully");
      } else {
        console.error(`✗ Action execution failed: ${result.error}`);
      }
    }
    
    // Clean up
    client.dispose();
    server.dispose();
    
    console.log("\n" + "=".repeat(80));
    console.log("DEMONSTRATION COMPLETED SUCCESSFULLY");
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("Error in demonstration:", error);
  }
}

/**
 * Simulate model output based on a user query
 * @param {string} query User query
 * @returns {string} Simulated model output
 */
function simulateModelOutput(query) {
  if (query.includes("submit")) {
    return '{"action": "click", "targetId": "submit-1"}';
  } else if (query.includes("name")) {
    return '{"action": "type", "targetId": "name-1", "data": "John Doe"}';
  } else if (query.includes("country")) {
    return '{"action": "click", "targetId": "country-1"}';
  } else if (query.includes("subscribe") || query.includes("check")) {
    return '{"action": "click", "targetId": "subscribe-1"}';
  } else if (query.includes("clear") || query.includes("reset")) {
    return '{"action": "click", "targetId": "reset-1"}';
  }
  
  return '{"action": "click", "targetId": "submit-1"}';
}

/**
 * Format bytes to a human-readable string
 * @param {number} bytes Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the demonstration if this script is executed directly
if (require.main === module) {
  demonstrateMCP().catch(console.error);
}

module.exports = { demonstrateMCP }; // Export the ModelEyes demonstration function