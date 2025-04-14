/**
 * Core data types for the ModelEyes Model Context Protocol (MCP)
 *
 * This module defines the fundamental data structures and interfaces used throughout
 * the ModelEyes library. These types represent UI elements, states, messages, and
 * configuration options that form the foundation of the structured UI representation.
 *
 * The types defined here are shared between client and server components, ensuring
 * consistent data structures throughout the communication pipeline.
 *
 * @packageDocumentation
 */

/**
 * Represents a UI element with its properties and relationships
 *
 * This interface defines the structure for representing any UI element, whether from
 * a web page (DOM element) or a desktop application (UI Automation element).
 * It captures essential properties like type, text content, position, and relationships
 * to other elements.
 */
export interface UIElement {
  /** Unique identifier for the element */
  id: string;
  
  /** Element type (HTML tag name, control type, etc.) */
  type: string;
  
  /** Text content of the element (optional) */
  text?: string;
  
  /** Key-value pairs of element attributes */
  attributes?: Record<string, any>;
  
  /** Spatial information (coordinates and size) */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  /** Boolean indicating if the element can be interacted with */
  interactable?: boolean;
  
  /** Boolean indicating if the element is visible */
  visible?: boolean;
  
  /** Array of child element IDs */
  children?: string[];
  
  /** ID of the parent element */
  parent?: string;
  
  /** Z-index or stacking order */
  zIndex?: number;
  
  /** Key-value pairs of relevant CSS styles */
  styles?: Record<string, string>;
}

/**
 * Represents the complete UI state of an application
 *
 * This interface defines the structure for representing the entire UI state
 * of an application at a specific point in time. It includes information about
 * the platform, application, viewport dimensions, and all UI elements.
 *
 * The UI state serves as the primary data structure for capturing and transmitting
 * information about user interfaces between client and server components.
 */
export interface UIState {
  /** Timestamp of when the state was captured */
  timestamp: number;
  
  /** Platform identifier (web, windows, macos, linux) */
  platform: 'web' | 'windows' | 'macos' | 'linux';
  
  /** Application identifier */
  application: string;
  
  /** Current window/page title */
  title: string;
  
  /** URL for web applications */
  url?: string;
  
  /** Viewport dimensions */
  viewport: {
    width: number;
    height: number;
  };
  
  /** Map of elements by their IDs */
  elements: Record<string, UIElement>;
  
  /** ID of the element that has focus */
  focus?: string;
  
  /** ID of the element that is being hovered */
  hover?: string;
  
  /** Version identifier for state tracking */
  version: string;
}

/**
 * Represents incremental changes to the UI state
 *
 * Instead of transmitting the entire UI state on every update, this interface
 * defines a structure for representing only the changes that occurred since
 * the previous state. This includes added, modified, and removed elements.
 *
 * Differential updates significantly reduce the amount of data transmitted
 * between client and server components, improving performance and reducing
 * token usage when interacting with AI models.
 */
export interface DifferentialUpdate {
  /** Timestamp of when the update was captured */
  timestamp: number;
  
  /** New elements added to the UI */
  added?: Record<string, UIElement>;
  
  /** Existing elements that were modified */
  modified?: Record<string, Partial<UIElement>>;
  
  /** IDs of elements that were removed */
  removed?: string[];
  
  /** ID of the element that has focus */
  focus?: string | null;
  
  /** ID of the element that is being hovered */
  hover?: string | null;
  
  /** Base version this update applies to */
  baseVersion: string;
  
  /** New version after applying this update */
  version: string;
}

/**
 * Types of messages that can be sent from client to server
 */
export type ClientToServerMessageType = 'initialState' | 'stateUpdate' | 'event';

/**
 * Types of messages that can be sent from server to client
 */
export type ServerToClientMessageType = 'actionRequest' | 'queryRequest' | 'response' | 'error';

/**
 * Base interface for all messages
 */
export interface Message {
  type: ClientToServerMessageType | ServerToClientMessageType;
  payload: any;
}

/**
 * Message containing the initial UI state
 */
export interface InitialStateMessage extends Message {
  type: 'initialState';
  payload: UIState;
}

/**
 * Message containing a differential update to the UI state
 */
export interface StateUpdateMessage extends Message {
  type: 'stateUpdate';
  payload: DifferentialUpdate;
}

/**
 * Types of UI events that can be reported
 */
export type UIEventType = 'click' | 'input' | 'scroll' | 'focus' | 'blur' | 'hover';

/**
 * Message reporting a UI event
 */
export interface EventMessage extends Message {
  type: 'event';
  payload: {
    eventType: UIEventType;
    targetId: string;
    data?: any;
  };
}

/**
 * Types of actions that can be requested
 */
export type ActionType = 'click' | 'type' | 'scroll' | 'focus' | 'hover';

/**
 * Represents an action to be performed on a UI element
 */
export interface Action {
  /** Type of action to perform */
  type: ActionType;
  
  /** ID of the target element */
  targetId: string;
  
  /** Additional data for the action */
  data?: any;
}

/**
 * Message requesting an action to be performed
 */
export interface ActionRequestMessage extends Message {
  type: 'actionRequest';
  payload: {
    actionType: ActionType;
    targetId: string;
    data?: any;
  };
}

/**
 * Types of queries that can be requested
 */
export type QueryType = 'elementState' | 'elementSearch' | 'elementPath';

/**
 * Message requesting information about the UI
 */
export interface QueryRequestMessage extends Message {
  type: 'queryRequest';
  payload: {
    queryType: QueryType;
    parameters: any;
  };
}

/**
 * Message responding to a request
 */
export interface ResponseMessage extends Message {
  type: 'response';
  payload: {
    requestId: string;
    status: 'success' | 'error';
    data: any;
  };
}

/**
 * Error codes that can be reported
 */
export type ErrorCode = 'ParseError' | 'ValidationError' | 'TimeoutError' | 'AccessError' | 'UnsupportedError';

/**
 * Message reporting an error
 */
export interface ErrorMessage extends Message {
  type: 'error';
  payload: {
    code: ErrorCode;
    message: string;
    details?: any;
  };
}

/**
 * Configuration options for the MCP client
 */
export interface MCPClientConfig {
  /** Target platform */
  platform: 'web' | 'windows' | 'macos' | 'linux';
  
  /** Element filtering options */
  filtering?: {
    /** Maximum depth to traverse */
    maxDepth?: number;
    
    /** CSS selector for elements to exclude (web only) */
    excludeSelector?: string;
    
    /** Whether to include invisible elements */
    includeInvisible?: boolean;
  };
  
  /** Data optimization options */
  optimization?: {
    /** Whether to compress the data */
    compress?: boolean;
    
    /** Whether to use differential updates */
    useDifferentialUpdates?: boolean;
  };
}

/**
 * Configuration options for the MCP server
 */
export interface MCPServerConfig {
  /** Model provider configuration */
  modelProvider?: {
    /** Name of the model provider */
    name: string;
    
    /** API key for the model provider */
    apiKey?: string;
    
    /** Model-specific options */
    options?: Record<string, any>;
  };
  
  /** Context management options */
  contextManagement?: {
    /** Maximum number of states to keep in history */
    maxHistoryStates?: number;
    
    /** Whether to include full element details in context */
    includeFullElementDetails?: boolean;
  };
}

/**
 * Result of an action execution
 */
export interface ActionResult {
  /** Whether the action was successful */
  success: boolean;
  
  /** Error message if the action failed */
  error?: string;
  
  /** Additional data about the action result */
  data?: any;
}

/**
 * Options for preparing context for a model
 */
export interface ContextOptions {
  /** Maximum number of tokens to use */
  maxTokens?: number;
  
  /** Whether to include invisible elements */
  includeInvisible?: boolean;
  
  /** Whether to include full element details */
  includeFullElementDetails?: boolean;
}

/**
 * Context prepared for a model
 */
export interface ModelContext {
  /** Structured representation of the UI state */
  uiState: any;
  
  /** Estimated token count */
  tokenCount: number;
  
  /** Additional context information */
  metadata: Record<string, any>;
}

/**
 * Subscription to state changes
 */
export interface Subscription {
  /** Unsubscribe from state changes */
  unsubscribe: () => void;
}