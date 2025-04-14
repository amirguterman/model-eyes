import {
  UIState,
  DifferentialUpdate,
  MCPClientConfig,
  ActionResult,
  Subscription
} from '../common/types';

/**
 * Base interface for all MCP client implementations
 */
export interface IMCPClient {
  /**
   * Initialize the client with the provided configuration
   * @param config Client configuration options
   */
  initialize(config: MCPClientConfig): Promise<void>;
  
  /**
   * Capture the current UI state
   * @returns Promise resolving to the captured UI state
   */
  captureState(): Promise<UIState>;
  
  /**
   * Subscribe to UI state changes
   * @param callback Function to call when the state changes
   * @returns Subscription object for unsubscribing
   */
  subscribeToStateChanges(callback: (update: DifferentialUpdate) => void): Subscription;
  
  /**
   * Execute an action on a UI element
   * @param actionType Type of action to execute
   * @param targetId ID of the target element
   * @param data Additional data for the action
   * @returns Promise resolving to the result of the action
   */
  executeAction(actionType: string, targetId: string, data?: any): Promise<ActionResult>;
  
  /**
   * Clean up resources used by the client
   */
  dispose(): void;
}

/**
 * Abstract base class for MCP client implementations
 */
export abstract class BaseMCPClient implements IMCPClient {
  /** Client configuration */
  protected config: MCPClientConfig | null = null;
  
  /** Current UI state */
  protected currentState: UIState | null = null;
  
  /** Subscribers to state changes */
  protected subscribers: ((update: DifferentialUpdate) => void)[] = [];
  
  /** Last version identifier */
  protected lastVersion = '0';
  
  /**
   * Initialize the client with the provided configuration
   * @param config Client configuration options
   */
  async initialize(config: MCPClientConfig): Promise<void> {
    this.config = config;
    await this.initializePlatform();
  }
  
  /**
   * Platform-specific initialization
   */
  protected abstract initializePlatform(): Promise<void>;
  
  /**
   * Capture the current UI state
   * @returns Promise resolving to the captured UI state
   */
  async captureState(): Promise<UIState> {
    if (!this.config) {
      throw new Error('Client not initialized');
    }
    
    const state = await this.capturePlatformState();
    this.currentState = state;
    this.lastVersion = state.version;
    
    return state;
  }
  
  /**
   * Platform-specific state capture
   */
  protected abstract capturePlatformState(): Promise<UIState>;
  
  /**
   * Subscribe to UI state changes
   * @param callback Function to call when the state changes
   * @returns Subscription object for unsubscribing
   */
  subscribeToStateChanges(callback: (update: DifferentialUpdate) => void): Subscription {
    this.subscribers.push(callback);
    
    return {
      unsubscribe: () => {
        const index = this.subscribers.indexOf(callback);
        if (index !== -1) {
          this.subscribers.splice(index, 1);
        }
      }
    };
  }
  
  /**
   * Notify subscribers of a state update
   * @param update Differential update to notify about
   */
  protected notifySubscribers(update: DifferentialUpdate): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(update);
      } catch (error) {
        console.error('Error in subscriber:', error);
      }
    }
  }
  
  /**
   * Execute an action on a UI element
   * @param actionType Type of action to execute
   * @param targetId ID of the target element
   * @param data Additional data for the action
   * @returns Promise resolving to the result of the action
   */
  async executeAction(actionType: string, targetId: string, data?: any): Promise<ActionResult> {
    if (!this.config) {
      throw new Error('Client not initialized');
    }
    
    if (!this.currentState) {
      throw new Error('No current state available');
    }
    
    const element = this.currentState.elements[targetId];
    if (!element) {
      return {
        success: false,
        error: `Element with ID ${targetId} not found`
      };
    }
    
    return this.executePlatformAction(actionType, element, data);
  }
  
  /**
   * Platform-specific action execution
   */
  protected abstract executePlatformAction(
    actionType: string,
    element: any,
    data?: any
  ): Promise<ActionResult>;
  
  /**
   * Clean up resources used by the client
   */
  dispose(): void {
    this.subscribers = [];
    this.disposePlatformResources();
  }
  
  /**
   * Platform-specific resource cleanup
   */
  protected abstract disposePlatformResources(): void;
  
  /**
   * Generate a new version identifier
   * @returns New version identifier
   */
  protected generateVersion(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp}-${random}`;
  }
}