import { Action, ContextOptions, DifferentialUpdate, MCPServerConfig, ModelContext, UIState } from '../common/types';
import { BaseMCPServer } from './base-server';

/**
 * Configuration options specific to OpenAI models
 */
export interface OpenAIServerConfig extends MCPServerConfig {
  modelProvider: {
    name: 'openai';
    apiKey: string;
    options?: {
      model: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
}

/**
 * MCP server implementation for OpenAI models
 */
export class OpenAIMCPServer extends BaseMCPServer {
  /** OpenAI API key */
  private apiKey: string | null = null;
  
  /** OpenAI model to use */
  private model = 'gpt-4';
  
  /** Temperature for model generation */
  private temperature = 0.7;
  
  /** Maximum tokens for model generation */
  private maxTokens = 1000;
  
  /**
   * Initialize the model provider
   */
  protected async initializeModelProvider(): Promise<void> {
    if (!this.config) {
      throw new Error('Server not initialized');
    }
    
    const config = this.config as OpenAIServerConfig;
    
    if (config.modelProvider.name !== 'openai') {
      throw new Error('Invalid model provider');
    }
    
    this.apiKey = config.modelProvider.apiKey;
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key not provided');
    }
    
    // Apply model options
    if (config.modelProvider.options) {
      if (config.modelProvider.options.model) {
        this.model = config.modelProvider.options.model;
      }
      
      if (config.modelProvider.options.temperature !== undefined) {
        this.temperature = config.modelProvider.options.temperature;
      }
      
      if (config.modelProvider.options.maxTokens !== undefined) {
        this.maxTokens = config.modelProvider.options.maxTokens;
      }
    }
    
    // Validate API key (could make a test request here)
    console.log(`Initialized OpenAI server with model ${this.model}`);
  }
  
  /**
   * Prepare context for consumption by a model with OpenAI-specific optimizations
   * @param options Context preparation options
   * @returns Context prepared for the model
   */
  override prepareContextForModel(options?: ContextOptions): ModelContext {
    // Get base context from parent class
    const baseContext = super.prepareContextForModel(options);
    
    // Apply OpenAI-specific optimizations
    const maxTokens = options?.maxTokens ?? this.maxTokens;
    
    // If the context is too large, simplify it further
    if (baseContext.tokenCount > maxTokens) {
      // Simplify by removing less important elements
      const simplifiedContext = this.simplifyContextForTokenLimit(baseContext, maxTokens);
      return simplifiedContext;
    }
    
    return baseContext;
  }
  
  /**
   * Simplify context to fit within token limit
   * @param context Context to simplify
   * @param maxTokens Maximum tokens allowed
   * @returns Simplified context
   */
  private simplifyContextForTokenLimit(context: ModelContext, maxTokens: number): ModelContext {
    // Create a copy of the context
    const simplifiedContext: ModelContext = {
      ...context,
      uiState: { ...context.uiState }
    };
    
    // Get the elements
    const elements = simplifiedContext.uiState.elements;
    
    // Sort elements by importance (interactable elements are more important)
    const sortedElementIds = Object.keys(elements).sort((a, b) => {
      const elementA = elements[a];
      const elementB = elements[b];
      
      // Interactable elements are more important
      if (elementA.interactable && !elementB.interactable) {
        return -1;
      }
      
      if (!elementA.interactable && elementB.interactable) {
        return 1;
      }
      
      // Elements with text are more important
      if (elementA.text && !elementB.text) {
        return -1;
      }
      
      if (!elementA.text && elementB.text) {
        return 1;
      }
      
      return 0;
    });
    
    // Remove elements until we're under the token limit
    const newElements: Record<string, any> = {};
    let currentTokenCount = context.tokenCount;
    
    for (const id of sortedElementIds) {
      const element = elements[id];
      
      // Estimate the token count for this element
      const elementJson = JSON.stringify(element);
      const elementTokens = Math.ceil(elementJson.length / 4);
      
      // If adding this element would exceed the token limit, skip it
      if (currentTokenCount - elementTokens < maxTokens) {
        newElements[id] = element;
        currentTokenCount -= elementTokens;
      }
    }
    
    // Update the elements in the context
    simplifiedContext.uiState.elements = newElements;
    
    // Update the token count
    simplifiedContext.tokenCount = this.estimateTokenCount(simplifiedContext.uiState);
    
    return simplifiedContext;
  }
  
  /**
   * Estimate the token count for a value
   * @param value Value to estimate token count for
   * @returns Estimated token count
   */
  protected override estimateTokenCount(value: any): number {
    // Convert the value to a string
    const json = JSON.stringify(value);
    
    // Estimate token count (roughly 4 characters per token)
    return Math.ceil(json.length / 4);
  }
  
  /**
   * Generate an action based on model output
   * @param modelOutput Output from the model
   * @returns Generated action
   */
  generateAction(modelOutput: string): Action {
    if (!this.currentState) {
      throw new Error('No current state available');
    }
    
    // Parse the model output to extract action information
    // This is a simplified implementation that expects a specific format
    // In a real implementation, this would be more robust
    
    try {
      // Try to parse as JSON
      const parsedOutput = JSON.parse(modelOutput);
      
      if (
        parsedOutput &&
        typeof parsedOutput === 'object' &&
        'action' in parsedOutput &&
        'targetId' in parsedOutput
      ) {
        return {
          type: parsedOutput.action,
          targetId: parsedOutput.targetId,
          data: parsedOutput.data
        };
      }
    } catch (error) {
      // Not valid JSON, try to parse using regex
    }
    
    // Fallback: Try to extract action using regex
    const actionMatch = modelOutput.match(/action:\s*(\w+)/i);
    const targetMatch = modelOutput.match(/target(?:Id)?:\s*([a-zA-Z0-9-_]+)/i);
    const dataMatch = modelOutput.match(/data:\s*(\{.*\})/i);
    
    if (actionMatch && targetMatch) {
      const action: Action = {
        type: actionMatch[1].toLowerCase() as any,
        targetId: targetMatch[1]
      };
      
      if (dataMatch) {
        try {
          action.data = JSON.parse(dataMatch[1]);
        } catch (error) {
          // Invalid JSON data, ignore
        }
      }
      
      return action;
    }
    
    // If we couldn't parse the output, return a default action
    return {
      type: 'click',
      targetId: this.findBestTargetElement(),
      data: null
    };
  }
  
  /**
   * Find the best target element based on the current state
   * @returns ID of the best target element
   */
  private findBestTargetElement(): string {
    if (!this.currentState) {
      throw new Error('No current state available');
    }
    
    // Look for a submit button or similar element
    for (const [id, element] of Object.entries(this.currentState.elements)) {
      if (
        element.interactable &&
        element.type === 'button' &&
        element.text &&
        /submit|continue|next|ok|yes/i.test(element.text)
      ) {
        return id;
      }
    }
    
    // Look for any button
    for (const [id, element] of Object.entries(this.currentState.elements)) {
      if (element.interactable && element.type === 'button') {
        return id;
      }
    }
    
    // Look for any interactable element
    for (const [id, element] of Object.entries(this.currentState.elements)) {
      if (element.interactable) {
        return id;
      }
    }
    
    // Fallback to the first element
    const firstId = Object.keys(this.currentState.elements)[0];
    return firstId || 'unknown';
  }
  
  /**
   * Clean up model provider resources
   */
  protected disposeModelProvider(): void {
    // No specific cleanup needed for OpenAI
    this.apiKey = null;
  }
  
  /**
   * Make a request to the OpenAI API
   * @param prompt Prompt to send to the API
   * @returns Response from the API
   */
  async makeOpenAIRequest(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not provided');
    }
    
    // This is a placeholder for the actual API request
    // In a real implementation, this would use the OpenAI API
    console.log(`Making OpenAI request with model ${this.model}`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);
    
    // Simulate a response
    return `{
      "action": "click",
      "targetId": "button-submit",
      "data": null
    }`;
  }
}