import { WebMCPClient } from '../src/client/web/web-client';
import { OpenAIMCPServer } from '../src/server/openai-server';
import { Action, DifferentialUpdate, UIState } from '../src/common/types';

/**
 * Example demonstrating the use of MCP with a web client and OpenAI server
 */
async function runWebExample() {
  try {
    // Initialize the client
    const client = new WebMCPClient();
    await client.initialize({
      platform: 'web',
      filtering: {
        maxDepth: 20,
        excludeSelector: 'script, style, meta, link, head',
        includeInvisible: false
      },
      optimization: {
        compress: true,
        useDifferentialUpdates: true
      }
    });
    
    console.log('Client initialized');
    
    // Initialize the server
    const server = new OpenAIMCPServer();
    await server.initialize({
      modelProvider: {
        name: 'openai',
        apiKey: 'your-api-key-here', // Replace with your actual API key
        options: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000
        }
      },
      contextManagement: {
        maxHistoryStates: 5,
        includeFullElementDetails: false
      }
    });
    
    console.log('Server initialized');
    
    // Capture the initial state
    const initialState = await client.captureState();
    console.log(`Captured initial state with ${Object.keys(initialState.elements).length} elements`);
    
    // Process the initial state on the server
    server.processInitialState(initialState);
    
    // Subscribe to state changes
    client.subscribeToStateChanges((update: DifferentialUpdate) => {
      console.log(`Received state update with ${update.added ? Object.keys(update.added).length : 0} added elements, ${update.modified ? Object.keys(update.modified).length : 0} modified elements, and ${update.removed ? update.removed.length : 0} removed elements`);
      
      // Process the update on the server
      server.processStateUpdate(update);
    });
    
    // Prepare context for the model
    const context = server.prepareContextForModel({
      maxTokens: 2000,
      includeInvisible: false,
      includeFullElementDetails: false
    });
    
    console.log(`Prepared context for model with ${context.tokenCount} tokens`);
    
    // Simulate model output
    const modelOutput = `{
      "action": "click",
      "targetId": "button-submit",
      "data": null
    }`;
    
    // Generate an action based on the model output
    const action = server.generateAction(modelOutput);
    
    console.log(`Generated action: ${action.type} on element ${action.targetId}`);
    
    // Execute the action
    const result = await client.executeAction(action.type, action.targetId, action.data);
    
    if (result.success) {
      console.log('Action executed successfully');
    } else {
      console.error(`Action execution failed: ${result.error}`);
    }
    
    // Clean up
    client.dispose();
    server.dispose();
    
    console.log('Example completed');
  } catch (error) {
    console.error('Error in example:', error);
  }
}

/**
 * Example demonstrating how to use MCP in a real web application
 */
class MCPWebIntegration {
  private client: WebMCPClient;
  private server: OpenAIMCPServer;
  
  /**
   * Initialize the MCP integration
   */
  async initialize() {
    // Initialize the client
    this.client = new WebMCPClient();
    await this.client.initialize({
      platform: 'web',
      filtering: {
        maxDepth: 30,
        excludeSelector: 'script, style, meta, link, head',
        includeInvisible: false
      },
      optimization: {
        compress: true,
        useDifferentialUpdates: true
      }
    });
    
    // Initialize the server
    this.server = new OpenAIMCPServer();
    await this.server.initialize({
      modelProvider: {
        name: 'openai',
        apiKey: 'your-api-key-here', // Replace with your actual API key
        options: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000
        }
      },
      contextManagement: {
        maxHistoryStates: 10,
        includeFullElementDetails: false
      }
    });
    
    // Capture the initial state
    const initialState = await this.client.captureState();
    this.server.processInitialState(initialState);
    
    // Subscribe to state changes
    this.client.subscribeToStateChanges((update: DifferentialUpdate) => {
      this.server.processStateUpdate(update);
    });
  }
  
  /**
   * Process a user query and generate an action
   * @param query User query
   * @returns Generated action
   */
  async processQuery(query: string): Promise<Action> {
    // Prepare context for the model
    const context = this.server.prepareContextForModel();
    
    // Create a prompt for the model
    const prompt = `
User Query: ${query}

Current UI State:
${JSON.stringify(context.uiState, null, 2)}

Based on the user query and the current UI state, what action should be taken?
Respond with a JSON object containing:
- action: The type of action to take (click, type, scroll, focus, hover)
- targetId: The ID of the element to act on
- data: Any additional data needed for the action (e.g., text to type)

Example response:
{
  "action": "click",
  "targetId": "button-submit",
  "data": null
}
`;
    
    // Make a request to the OpenAI API
    const modelOutput = await this.server.makeOpenAIRequest(prompt);
    
    // Generate an action based on the model output
    const action = this.server.generateAction(modelOutput);
    
    return action;
  }
  
  /**
   * Execute an action
   * @param action Action to execute
   * @returns Result of the action
   */
  async executeAction(action: Action) {
    return this.client.executeAction(action.type, action.targetId, action.data);
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    this.client.dispose();
    this.server.dispose();
  }
}

// Example usage in a web application
async function integrationExample() {
  const integration = new MCPWebIntegration();
  await integration.initialize();
  
  // Process a user query
  const action = await integration.processQuery('Click the submit button');
  
  // Execute the action
  const result = await integration.executeAction(action);
  
  if (result.success) {
    console.log('Action executed successfully');
  } else {
    console.error(`Action execution failed: ${result.error}`);
  }
  
  // Clean up
  integration.dispose();
}

// Run the example when the script is executed
if (typeof window !== 'undefined') {
  // In a browser environment
  window.addEventListener('DOMContentLoaded', () => {
    // Uncomment one of these to run the example
    // runWebExample();
    // integrationExample();
    
    console.log('MCP examples loaded. Uncomment an example function to run it.');
  });
} else {
  // In a Node.js environment
  console.log('This example is designed to run in a browser environment.');
}