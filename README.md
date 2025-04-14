# Model Context Protocol (MCP) with Structured UI Representation

This project implements a Model Context Protocol (MCP) that replaces traditional screenshot-based UI representation with a structured, efficient approach leveraging DOM parsing, HWND access, and UI element extraction.

## Project Overview

The MCP serves as a bridge between AI models and desktop/web environments, providing:

- Dramatic reduction in context size compared to screenshots (95% reduction target)
- Improved responsiveness in AI interactions with UIs
- Semantically rich information about UI states
- Support for web applications and Windows desktop applications

## Installation

### Quick Setup

For a quick setup and run, use one of the provided scripts:

**Unix/Linux/macOS:**
```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-structured-ui.git
cd mcp-structured-ui

# Make the script executable
chmod +x setup-and-run.sh

# Run the setup script
./setup-and-run.sh
```

**Windows:**
```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-structured-ui.git
cd mcp-structured-ui

# Run the setup script
setup-and-run.bat
```

### Manual Setup

If you prefer to run commands manually:

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-structured-ui.git
cd mcp-structured-ui

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Web Client

```typescript
import { createWebClient, createOpenAIServer } from 'mcp-structured-ui';

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
import { createWindowsClient, createOpenAIServer } from 'mcp-structured-ui';

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.