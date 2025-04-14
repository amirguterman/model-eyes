# Getting Started with ModelEyes

This guide will help you get started with ModelEyes, a Model Context Protocol (MCP) implementation that provides structured UI representation for AI models.

## Installation

### npm

```bash
npm install @amirguterman/model-eyes
```

### GitHub Packages

To install from GitHub Packages, first create a `.npmrc` file in your project with:

```
@amirguterman:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Then install the package:

```bash
npm install @amirguterman/model-eyes
```

## Basic Usage

### Web Applications

Here's a simple example of using ModelEyes with a web application:

```typescript
import { createWebClient, createOpenAIServer } from '@amirguterman/model-eyes';

async function main() {
  // Create and initialize a web client
  const client = await createWebClient();
  
  // Create and initialize an OpenAI server
  const server = await createOpenAIServer('your-api-key-here');
  
  // Capture the current UI state
  const initialState = await client.captureState();
  console.log(`Captured ${Object.keys(initialState.elements).length} elements`);
  
  // Process the initial state on the server
  server.processInitialState(initialState);
  
  // Subscribe to state changes
  client.subscribeToStateChanges((update) => {
    console.log('UI state updated');
    server.processStateUpdate(update);
  });
  
  // Prepare context for the model
  const context = server.prepareContextForModel();
  console.log(`Context size: ${context.tokenCount} tokens`);
  
  // Use the context with your AI model
  // ...
  
  // Clean up resources when done
  client.dispose();
  server.dispose();
}

main().catch(console.error);
```

### Windows Desktop Applications

For Windows desktop applications:

```typescript
import { createWindowsClient, createOpenAIServer } from '@amirguterman/model-eyes';

async function main() {
  // Create and initialize a Windows client
  const client = await createWindowsClient();
  
  // Rest of the code is similar to the web example
  // ...
}

main().catch(console.error);
```

## Next Steps

- Check out the [Usage Guide](usage-guide.md) for more detailed examples
- See the [API Documentation](api/index.html) for complete reference
- Read the [Protocol Specification](protocol-specification.md) for details on the underlying protocol

## Troubleshooting

### Common Issues

#### Connection Errors

If you encounter connection errors with the Windows client, ensure that:
- You have the necessary permissions to access the application window
- The application is running and visible
- You're running your code with administrator privileges if needed

#### Token Limits

If you're hitting token limits with your AI model:
- Use the `maxTokens` option when preparing context
- Adjust filtering options to exclude less relevant elements
- Consider using differential updates instead of full state captures

## Getting Help

If you need help with ModelEyes, you can:
- Check the [GitHub Issues](https://github.com/amirguterman/model-eyes/issues)
- Submit a new issue if you've found a bug
- Contribute to the project by submitting a pull request