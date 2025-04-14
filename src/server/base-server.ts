import {
  UIState,
  DifferentialUpdate,
  MCPServerConfig,
  ModelContext,
  ContextOptions,
  Action,
  ActionType
} from '../common/types';

/**
 * Interface for MCP server implementations
 */
export interface IMCPServer {
  /**
   * Initialize the server with the provided configuration
   * @param config Server configuration options
   */
  initialize(config: MCPServerConfig): Promise<void>;
  
  /**
   * Process the initial UI state
   * @param state Initial UI state
   */
  processInitialState(state: UIState): void;
  
  /**
   * Process a differential update to the UI state
   * @param update Differential update
   */
  processStateUpdate(update: DifferentialUpdate): void;
  
  /**
   * Prepare context for consumption by a model
   * @param options Context preparation options
   * @returns Context prepared for the model
   */
  prepareContextForModel(options?: ContextOptions): ModelContext;
  
  /**
   * Generate an action based on model output
   * @param modelOutput Output from the model
   * @returns Generated action
   */
  generateAction(modelOutput: string): Action;
  
  /**
   * Clean up resources used by the server
   */
  dispose(): void;
}

/**
 * Abstract base class for MCP server implementations
 */
export abstract class BaseMCPServer implements IMCPServer {
  /** Server configuration */
  protected config: MCPServerConfig | null = null;
  
  /** Current UI state */
  protected currentState: UIState | null = null;
  
  /** History of UI states */
  protected stateHistory: UIState[] = [];
  
  /**
   * Initialize the server with the provided configuration
   * @param config Server configuration options
   */
  async initialize(config: MCPServerConfig): Promise<void> {
    this.config = config;
    await this.initializeModelProvider();
  }
  
  /**
   * Initialize the model provider
   */
  protected abstract initializeModelProvider(): Promise<void>;
  
  /**
   * Process the initial UI state
   * @param state Initial UI state
   */
  processInitialState(state: UIState): void {
    this.currentState = state;
    
    // Add to history if enabled
    if (this.config?.contextManagement?.maxHistoryStates) {
      this.addStateToHistory(state);
    }
  }
  
  /**
   * Process a differential update to the UI state
   * @param update Differential update
   */
  processStateUpdate(update: DifferentialUpdate): void {
    if (!this.currentState) {
      throw new Error('No current state available');
    }
    
    // Verify that the update applies to the current state
    if (update.baseVersion !== this.currentState.version) {
      throw new Error(
        `Update base version ${update.baseVersion} does not match current state version ${this.currentState.version}`
      );
    }
    
    // Apply the update to create a new state
    const newState = this.applyUpdate(this.currentState, update);
    
    // Update the current state
    this.currentState = newState;
    
    // Add to history if enabled
    if (this.config?.contextManagement?.maxHistoryStates) {
      this.addStateToHistory(newState);
    }
  }
  
  /**
   * Apply a differential update to a UI state
   * @param state State to update
   * @param update Update to apply
   * @returns Updated state
   */
  private applyUpdate(state: UIState, update: DifferentialUpdate): UIState {
    // Create a deep copy of the state
    const newState: UIState = JSON.parse(JSON.stringify(state));
    
    // Update the version
    newState.version = update.version;
    
    // Update the timestamp
    newState.timestamp = update.timestamp;
    
    // Add new elements
    if (update.added) {
      for (const [id, element] of Object.entries(update.added)) {
        newState.elements[id] = element;
      }
    }
    
    // Modify existing elements
    if (update.modified) {
      for (const [id, changes] of Object.entries(update.modified)) {
        const element = newState.elements[id];
        if (element) {
          Object.assign(element, changes);
        }
      }
    }
    
    // Remove elements
    if (update.removed) {
      for (const id of update.removed) {
        delete newState.elements[id];
      }
    }
    
    // Update focus and hover
    if (update.focus !== undefined) {
      newState.focus = update.focus || undefined;
    }
    
    if (update.hover !== undefined) {
      newState.hover = update.hover || undefined;
    }
    
    return newState;
  }
  
  /**
   * Add a state to the history
   * @param state State to add
   */
  private addStateToHistory(state: UIState): void {
    this.stateHistory.push(state);
    
    // Limit the history size
    const maxHistoryStates = this.config?.contextManagement?.maxHistoryStates ?? 10;
    if (this.stateHistory.length > maxHistoryStates) {
      this.stateHistory.shift();
    }
  }
  
  /**
   * Prepare context for consumption by a model
   * @param options Context preparation options
   * @returns Context prepared for the model
   */
  prepareContextForModel(options?: ContextOptions): ModelContext {
    if (!this.currentState) {
      throw new Error('No current state available');
    }
    
    // Apply options
    const includeFullElementDetails = options?.includeFullElementDetails ?? 
      this.config?.contextManagement?.includeFullElementDetails ?? false;
    
    const includeInvisible = options?.includeInvisible ?? false;
    
    // Create a simplified representation of the UI state
    const simplifiedState = this.simplifyState(this.currentState, includeFullElementDetails, includeInvisible);
    
    // Estimate token count
    const tokenCount = this.estimateTokenCount(simplifiedState);
    
    return {
      uiState: simplifiedState,
      tokenCount,
      metadata: {
        timestamp: this.currentState.timestamp,
        platform: this.currentState.platform,
        application: this.currentState.application,
        title: this.currentState.title,
        url: this.currentState.url
      }
    };
  }
  
  /**
   * Simplify a UI state for model consumption
   * @param state State to simplify
   * @param includeFullElementDetails Whether to include full element details
   * @param includeInvisible Whether to include invisible elements
   * @returns Simplified state
   */
  private simplifyState(
    state: UIState,
    includeFullElementDetails: boolean,
    includeInvisible: boolean
  ): any {
    // Create a simplified representation of the state
    const simplified: any = {
      platform: state.platform,
      application: state.application,
      title: state.title,
      url: state.url,
      viewport: state.viewport,
      elements: {}
    };
    
    // Add focus and hover if available
    if (state.focus) {
      simplified.focus = state.focus;
    }
    
    if (state.hover) {
      simplified.hover = state.hover;
    }
    
    // Process elements
    for (const [id, element] of Object.entries(state.elements)) {
      // Skip invisible elements if not included
      if (!includeInvisible && element.visible === false) {
        continue;
      }
      
      if (includeFullElementDetails) {
        // Include all element details
        simplified.elements[id] = { ...element };
      } else {
        // Include only essential details
        simplified.elements[id] = {
          id: element.id,
          type: element.type,
          text: element.text,
          bounds: element.bounds,
          interactable: element.interactable,
          children: element.children,
          parent: element.parent
        };
      }
    }
    
    return simplified;
  }
  
  /**
   * Estimate the token count for a value
   * @param value Value to estimate token count for
   * @returns Estimated token count
   */
  protected estimateTokenCount(value: any): number {
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
  abstract generateAction(modelOutput: string): Action;
  
  /**
   * Clean up resources used by the server
   */
  dispose(): void {
    this.stateHistory = [];
    this.disposeModelProvider();
  }
  
  /**
   * Clean up model provider resources
   */
  protected abstract disposeModelProvider(): void;
}