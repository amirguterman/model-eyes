# ModelEyes

[![GitHub Package](https://img.shields.io/github/package-json/v/amirguterman/model-eyes)](https://github.com/amirguterman/model-eyes/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

ModelEyes is a Model Context Protocol (MCP) implementation that replaces traditional screenshot-based UI representation with a structured, efficient approach leveraging DOM parsing, HWND access, and UI element extraction.

## Project Overview

The MCP serves as a bridge between AI models and desktop/web environments, providing:

- Dramatic reduction in context size compared to screenshots (95% reduction target)
- Improved responsiveness in AI interactions with UIs
- Semantically rich information about UI states
- Support for web applications and Windows desktop applications

## Key Features

### Core Features

- **Structured UI Representation**: Captures UI elements with their properties and relationships
- **Differential Updates**: Efficiently tracks UI changes with sophisticated diffing algorithms
- **Caching Mechanism**: Improves performance by avoiding redundant processing
- **Element Filtering & Prioritization**: Focuses on the most relevant UI elements
- **iframe Support**: Captures elements within iframes in web applications
- **Token Optimization**: Advanced token management for AI model integration

## Installation

### Quick Setup

For a quick setup and run, use one of the provided scripts:

**Unix/Linux/macOS:**
```bash
# Clone the repository
git clone https://github.com/yourusername/model-eyes.git
cd model-eyes

# Make the script executable
chmod +x setup-and-run.sh

# Run the setup script
./setup-and-run.sh
```

**Windows:**
```bash
# Clone the repository
git clone https://github.com/yourusername/model-eyes.git
cd model-eyes

# Run the setup script
setup-and-run.bat
```

### Manual Setup

If you prefer to run commands manually:

```bash
# Clone the repository
git clone https://github.com/yourusername/model-eyes.git
cd model-eyes

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Web Client

```typescript
import { createWebClient, createOpenAIServer } from 'model-eyes';

// Initialize the client and server
async function initializeMCP() {
  // Create a web client
  const client = await createWebClient();
  
  // Create an OpenAI server
  const server = await createOpenAIServer('your-api-key-here');
  
  // Capture the initial UI state
  const initialState = await client.captureState();
  
  // Process the initial state on the server
  server.processInitialState(initialState);
  
  // Subscribe to state changes
  client.subscribeToStateChanges((update) => {
    server.processStateUpdate(update);
  });
  
  // Prepare context for the model
  const context = server.prepareContextForModel();
  
  // Use the context with your AI model
  console.log(`Prepared context with ${context.tokenCount} tokens`);
  
  // Generate an action based on model output
  const modelOutput = '{"action": "click", "targetId": "button-submit"}';
  const action = server.generateAction(modelOutput);
  
  // Execute the action
  const result = await client.executeAction(action.type, action.targetId, action.data);
  
  if (result.success) {
    console.log('Action executed successfully');
  } else {
    console.error(`Action execution failed: ${result.error}`);
  }
}

initializeMCP().catch(console.error);
```

### Windows Desktop Client

```typescript
import { createWindowsClient, createOpenAIServer } from 'model-eyes';

// Initialize the client and server
async function initializeMCP() {
  // Create a Windows client
  const client = await createWindowsClient();
  
  // Create an OpenAI server
  const server = await createOpenAIServer('your-api-key-here');
  
  // Capture the initial UI state
  const initialState = await client.captureState();
  
  // Process the initial state on the server
  server.processInitialState(initialState);
  
  // Rest of the code is similar to the web client example
}
```

## Core Components

### Client-Side Components

- **Web Implementation**: DOM traversal and element extraction
- **Desktop Implementation**: Windows UI Automation framework integration
- **Common Processing**: Caching, differential updates, filtering, and compression

### Server-Side Components

- **Data Processing**: Deserialization, hierarchy reconstruction, and validation
- **Model Integration**: Context management and token optimization
- **Action Generation**: Translating model outputs to precise element references

## MCP Integration

ModelEyes can be used as an MCP (Model Context Protocol) server, allowing AI models to access UI state through a standardized protocol:

```typescript
// Create and start an MCP server
const server = await createModelEyesMcpServer();

// Capture UI state from a web page
const state = await server.captureWebState('https://example.com');

// Access the UI state through MCP resources
// In an MCP client:
const uiState = await mcpClient.readResource('ui-state://current');
```

### Running as an MCP Server

You can run ModelEyes as a standalone MCP server:

```bash
# Start the MCP server with stdio transport
npm run start:mcp-server

# Or run the example script
npm run start:mcp-example
```

### Available MCP Resources

- `ui-state://current` - Current UI state
- `ui-state://history/0` - Most recent historical UI state
- `ui-state://compressed` - Compressed current UI state
- `ui-state://filtered` - Filtered UI state with only interactable elements

### Browser Extension

A Chrome extension is available for capturing UI states directly from web pages:

![ModelEyes Chrome Extension](docs/images/chrome-extension.png)

The extension allows you to:
- Capture UI states from any web page
- Send them directly to a ModelEyes MCP server
- Choose between different capture modes (full page, viewport, element)
- Configure server settings

To install the extension in development mode:

1. Navigate to `chrome://extensions/` in Chrome
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extensions/chrome` directory

For more details, see the [extension README](extensions/chrome/README.md).

### Available MCP Tools

- `captureWebState` - Capture UI state from a web page
- `captureWindowsState` - Capture UI state from a Windows desktop application
- `executeAction` - Execute an action on a UI element
- `findElements` - Find UI elements matching specific criteria

## Project Structure

```
mcp-structured-ui/
├── docs/                 # Documentation and protocol specification
├── src/                  # Source code
│   ├── client/           # Client-side components
│   │   ├── web/          # Web browser implementation
│   │   └── desktop/      # Desktop application implementation
│   ├── server/           # Server-side components
│   └── common/           # Shared code and utilities
├── examples/             # Example implementations and usage
└── tests/                # Test cases and benchmarks
```

## Performance Targets

- 95% reduction in data size compared to screenshot-based approaches
- Client-side processing completed within 100ms
- Differential updates processed within 50ms
- End-to-end latency reduced by 70% compared to screenshot methods
- High accuracy in element detection and interaction targeting

## Performance Optimizations

ModelEyes includes several optimizations to maximize performance and minimize token usage:

### Differential Updates

Instead of sending the entire UI state on every update, ModelEyes computes the difference between states and sends only the changes:

```typescript
// Only the changes are transmitted
const update = {
  added: { "new-button-1": { /* element properties */ } },
  modified: { "text-field-1": { text: "Updated text" } },
  removed: ["old-element-1"]
};
```

### Element Filtering

Configure which elements to include based on relevance:

```typescript
const client = await createWebClient({
  filtering: {
    maxElements: 100,
    prioritizeInteractable: true,
    excludeTypes: ['script', 'style', 'meta'],
    includeTypes: ['button', 'input', 'a']
  }
});
```

### Caching

Efficient caching reduces processing overhead:

```typescript
// State and element caching is handled automatically
const state1 = await client.captureState();
// Later updates use caching for better performance
client.subscribeToStateChanges((update) => {
  // Cached elements are reused when possible
});
```

### Token Management

Sophisticated token estimation and management for AI models:

```typescript
// Prepare context with token optimization
const context = server.prepareContextForModel({
  maxTokens: 4000,
  includeFullElementDetails: false
});

// Check token usage statistics
const stats = server.getTokenUsageStats();
console.log(`Average tokens: ${stats.average}, Max: ${stats.max}`);
```

## Examples

Check out the `examples` directory for complete usage examples:

- `web-example.html` - Example of using the MCP in a web application
- `web-example.ts` - TypeScript code for the web example

## Documentation

For detailed documentation, see:

- [Protocol Specification](docs/protocol-specification.md) - Detailed specification of the MCP protocol
- API Documentation (coming soon)

## Roadmap

1. **Enhance Windows Desktop Integration**
   - Complete the Windows UI Automation integration
   - Improve element detection and interaction

2. **Future Platform Support**
   - Add macOS Accessibility API support
   - Develop Linux AT-SPI2 connector

3. **Advanced Features**
   - Semantic enrichment using local ML models
   - Optimize differential update algorithms
   - Develop fallback mechanisms for complex UIs
   - Improve browser extension with additional features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.