# Model Context Protocol (MCP) Specification for Structured UI Representation

## 1. Introduction

This document specifies the Model Context Protocol (MCP) for structured UI representation, designed to replace traditional screenshot-based approaches with a more efficient and semantically rich format.

### 1.1 Purpose

The protocol enables AI models to interact with user interfaces by providing structured information about UI elements, their properties, relationships, and states, without requiring the transmission of full screenshots.

### 1.2 Scope

This specification covers:
- Data formats for representing UI elements and states
- Communication protocols between client and server components
- APIs for integration with different platforms and models
- Mechanisms for differential updates and state tracking

## 2. Core Data Formats

### 2.1 Element Representation

Each UI element is represented as a JSON object with the following properties:

```json
{
  "id": "unique-element-id",
  "type": "button|input|div|...",
  "text": "Element text content",
  "attributes": {
    "class": "btn primary",
    "disabled": false,
    "aria-label": "Submit form"
  },
  "bounds": {
    "x": 100,
    "y": 200,
    "width": 150,
    "height": 40
  },
  "interactable": true,
  "visible": true,
  "children": ["child-id-1", "child-id-2"],
  "parent": "parent-id",
  "zIndex": 1,
  "styles": {
    "backgroundColor": "#ffffff",
    "color": "#000000",
    "fontSize": "16px"
  }
}
```

#### 2.1.1 Required Properties

- `id`: Unique identifier for the element
- `type`: Element type (HTML tag name, control type, etc.)
- `bounds`: Spatial information (coordinates and size)

#### 2.1.2 Optional Properties

- `text`: Text content of the element
- `attributes`: Key-value pairs of element attributes
- `interactable`: Boolean indicating if the element can be interacted with
- `visible`: Boolean indicating if the element is visible
- `children`: Array of child element IDs
- `parent`: ID of the parent element
- `zIndex`: Z-index or stacking order
- `styles`: Key-value pairs of relevant CSS styles

### 2.2 UI State Representation

The complete UI state is represented as a JSON object:

```json
{
  "timestamp": 1650000000000,
  "platform": "web|windows|macos|linux",
  "application": "Chrome|Excel|...",
  "title": "Current window/page title",
  "url": "https://example.com/page",
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "elements": {
    "element-id-1": { /* element properties */ },
    "element-id-2": { /* element properties */ }
  },
  "focus": "element-id-1",
  "hover": "element-id-2",
  "version": "1.0"
}
```

### 2.3 Differential Updates

To minimize data transmission, changes to the UI state can be represented as differential updates:

```json
{
  "timestamp": 1650000001000,
  "added": {
    "new-element-id": { /* element properties */ }
  },
  "modified": {
    "element-id-1": {
      "text": "Updated text",
      "attributes": {
        "disabled": true
      }
    }
  },
  "removed": ["element-id-2"],
  "focus": "new-element-id",
  "hover": null,
  "baseVersion": "1.0",
  "version": "1.1"
}
```

## 3. Communication Protocol

### 3.1 Client-to-Server Messages

#### 3.1.1 Initial State

```json
{
  "type": "initialState",
  "payload": {
    /* UI state representation */
  }
}
```

#### 3.1.2 State Update

```json
{
  "type": "stateUpdate",
  "payload": {
    /* Differential update */
  }
}
```

#### 3.1.3 Event Notification

```json
{
  "type": "event",
  "payload": {
    "eventType": "click|input|scroll|...",
    "targetId": "element-id",
    "data": {
      /* Event-specific data */
    }
  }
}
```

### 3.2 Server-to-Client Messages

#### 3.2.1 Action Request

```json
{
  "type": "actionRequest",
  "payload": {
    "actionType": "click|type|scroll|...",
    "targetId": "element-id",
    "data": {
      /* Action-specific data */
    }
  }
}
```

#### 3.2.2 Query Request

```json
{
  "type": "queryRequest",
  "payload": {
    "queryType": "elementState|elementSearch|...",
    "parameters": {
      /* Query-specific parameters */
    }
  }
}
```

#### 3.2.3 Response

```json
{
  "type": "response",
  "payload": {
    "requestId": "original-request-id",
    "status": "success|error",
    "data": {
      /* Response data */
    }
  }
}
```

## 4. Platform-Specific Implementations

### 4.1 Web Browser Implementation

#### 4.1.1 DOM Traversal

The client-side component traverses the DOM tree, extracting elements and their properties. The traversal algorithm:

1. Starts from the document root or a specified container
2. Processes each node and its attributes
3. Recursively processes child nodes
4. Applies filtering rules to exclude irrelevant elements
5. Assigns unique IDs to each element

#### 4.1.2 Element Extraction

For each DOM element, the following information is extracted:
- Tag name (mapped to `type`)
- Text content
- Attributes
- Computed style properties
- Bounding rectangle
- Event listeners (when possible)
- ARIA properties for accessibility information

#### 4.1.3 Mutation Observation

DOM mutations are monitored using MutationObserver to generate differential updates:
- Added/removed nodes
- Changed attributes
- Text content changes

### 4.2 Desktop Implementation

#### 4.2.1 Windows UI Automation

For Windows applications, the client uses UI Automation (UIA) to:
1. Access the application window via HWND
2. Retrieve the automation element tree
3. Extract control types, names, and properties
4. Map the element hierarchy
5. Monitor property changes for updates

#### 4.2.2 macOS Accessibility API

For macOS applications, the client uses the Accessibility API to:
1. Access the application via its process ID
2. Retrieve the accessibility element tree
3. Extract element roles, attributes, and actions
4. Map the element hierarchy
5. Register for notifications to detect changes

#### 4.2.3 Linux AT-SPI2

For Linux applications, the client uses AT-SPI2 to:
1. Connect to the accessibility bus
2. Retrieve accessible objects
3. Extract roles, states, and properties
4. Map the hierarchy of accessible objects
5. Register for events to detect changes

## 5. Integration APIs

### 5.1 Client-Side API

```typescript
interface MCPClient {
  // Initialization
  initialize(config: MCPClientConfig): Promise<void>;
  
  // State management
  captureState(): Promise<UIState>;
  subscribeToStateChanges(callback: (update: DifferentialUpdate) => void): Subscription;
  
  // Action execution
  executeAction(action: Action): Promise<ActionResult>;
  
  // Cleanup
  dispose(): void;
}
```

### 5.2 Server-Side API

```typescript
interface MCPServer {
  // Initialization
  initialize(config: MCPServerConfig): Promise<void>;
  
  // State management
  processInitialState(state: UIState): void;
  processStateUpdate(update: DifferentialUpdate): void;
  
  // Model integration
  prepareContextForModel(options: ContextOptions): ModelContext;
  
  // Action generation
  generateAction(modelOutput: string): Action;
  
  // Cleanup
  dispose(): void;
}
```

## 6. Performance Considerations

### 6.1 Data Size Optimization

To achieve the target of 95% reduction in data size:
- Use short property names in the wire format
- Implement element filtering based on relevance
- Apply compression to the serialized data
- Use reference counting for repeated values
- Implement depth limits for deep hierarchies

### 6.2 Processing Efficiency

To meet the target processing times:
- Implement incremental processing for large DOM trees
- Use worker threads for CPU-intensive operations
- Apply caching for computed properties
- Implement priority-based processing for visible elements
- Use efficient data structures for element lookup

## 7. Security and Privacy

### 7.1 Data Minimization

The protocol implements data minimization by:
- Excluding sensitive content by default
- Providing configuration options for content filtering
- Supporting element anonymization for sensitive data

### 7.2 Secure Communication

All communication between client and server components should use:
- TLS encryption for data in transit
- Authentication mechanisms for server access
- Rate limiting to prevent abuse

## 8. Versioning and Compatibility

### 8.1 Protocol Versioning

The protocol uses semantic versioning:
- Major version changes for incompatible changes
- Minor version changes for backward-compatible additions
- Patch version changes for backward-compatible fixes

### 8.2 Backward Compatibility

To maintain compatibility with existing MCP implementations:
- Support for legacy message formats
- Graceful degradation when new features are unavailable
- Feature detection mechanisms

## 9. Error Handling

### 9.1 Error Types

The protocol defines the following error types:
- `ParseError`: Invalid message format
- `ValidationError`: Valid format but invalid content
- `TimeoutError`: Operation exceeded time limit
- `AccessError`: Permission denied for requested operation
- `UnsupportedError`: Requested feature not supported

### 9.2 Error Responses

Error responses follow the format:

```json
{
  "type": "error",
  "payload": {
    "code": "error-code",
    "message": "Human-readable error message",
    "details": {
      /* Error-specific details */
    }
  }
}
```

## 10. Future Extensions

The protocol is designed to be extensible for future enhancements:
- Support for 3D UI environments
- Integration with AR/VR interfaces
- Enhanced semantic understanding using local ML models
- Support for custom element types and properties

## Appendix A: Examples

[Examples of protocol usage in different scenarios]

## Appendix B: Reference Implementations

[Links to reference implementations for different platforms]