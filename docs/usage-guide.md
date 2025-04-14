# ModelEyes Usage Guide

This guide provides more detailed examples and best practices for using ModelEyes in various scenarios.

## Table of Contents

- [Configuration Options](#configuration-options)
- [Advanced Web Client Usage](#advanced-web-client-usage)
- [Advanced Windows Client Usage](#advanced-windows-client-usage)
- [Working with OpenAI Models](#working-with-openai-models)
- [Performance Optimization](#performance-optimization)
- [Integration Patterns](#integration-patterns)

## Configuration Options

### Web Client Configuration

The web client can be configured with various options:

```typescript
import { createWebClient } from '@amirguterman/model-eyes';

const client = await createWebClient({
  // Only include visible elements
  includeInvisible: false,
  
  // Maximum depth of element hierarchy to capture
  maxDepth: 10,
  
  // Elements to exclude by CSS selector
  excludeSelectors: ['.ad-banner', '#cookie-notice'],
  
  // Attributes to include in element capture
  includeAttributes: ['id', 'class', 'role', 'aria-*'],
  
  // Capture CSS styles that affect layout and appearance
  captureStyles: true,
  
  // Update interval in milliseconds (for subscriptions)
  updateInterval: 500
});
```

### Windows Client Configuration

The Windows client has similar configuration options:

```typescript
import { createWindowsClient } from '@amirguterman/model-eyes';

const client = await createWindowsClient({
  // Target specific window by title (partial match)
  windowTitle: 'Notepad',
  
  // Target specific window by class
  windowClass: 'Notepad',
  
  // Only include visible elements
  includeInvisible: false,
  
  // Maximum depth of element hierarchy to capture
  maxDepth: 10,
  
  // Update interval in milliseconds (for subscriptions)
  updateInterval: 500
});
```

### Server Configuration

The server component can also be configured:

```typescript
import { createOpenAIServer } from '@amirguterman/model-eyes';

const server = await createOpenAIServer('your-api-key', {
  // OpenAI model to use
  model: 'gpt-4',
  
  // Maximum tokens to use in context
  maxTokens: 4000,
  
  // Include element hierarchy in context
  includeHierarchy: true,
  
  // Include element styles in context
  includeStyles: false,
  
  // Include invisible elements in context
  includeInvisible: false
});
```

## Advanced Web Client Usage

### Working with iframes

To capture elements within iframes:

```typescript
const client = await createWebClient({
  // Include iframe contents in capture
  captureIframes: true
});

// Capture state including iframe contents
const state = await client.captureState();
```

### Handling Dynamic Content

For single-page applications with dynamic content:

```typescript
// Subscribe to state changes with a debounce
const subscription = client.subscribeToStateChanges((update) => {
  console.log('UI updated');
  server.processStateUpdate(update);
}, { debounce: 300 });

// Later, unsubscribe when done
subscription.unsubscribe();
```

### Executing Actions

To interact with the UI:

```typescript
// Click a button by element ID
const result = await client.executeAction({
  type: 'click',
  elementId: 'submit-button'
});

// Type text into an input field
await client.executeAction({
  type: 'type',
  elementId: 'search-input',
  text: 'ModelEyes example'
});

// Scroll to an element
await client.executeAction({
  type: 'scroll',
  elementId: 'section-3'
});
```

## Advanced Windows Client Usage

### Handling Multiple Windows

To work with multiple windows:

```typescript
// List available windows
const windows = await client.listWindows();
console.log('Available windows:', windows);

// Switch to a different window
await client.switchToWindow(windows[2].handle);

// Capture the state of the new window
const state = await client.captureState();
```

### Working with Native Dialogs

Handling native dialogs:

```typescript
// Subscribe to dialog events
client.subscribeToDialogEvents((dialog) => {
  console.log(`Dialog appeared: ${dialog.title}`);
  
  // Automatically dismiss dialog
  client.dismissDialog(dialog.handle, true);
});
```

## Working with OpenAI Models

### Context Preparation

Preparing context for different models:

```typescript
// For GPT-3.5 Turbo (smaller context)
const context = server.prepareContextForModel({
  maxTokens: 2000,
  simplifyElements: true,
  excludeStyles: true
});

// For GPT-4 (larger context)
const detailedContext = server.prepareContextForModel({
  maxTokens: 8000,
  simplifyElements: false,
  includeHierarchy: true,
  includeStyles: true
});
```

### Action Generation

Generating actions based on user instructions:

```typescript
// Generate action based on user instruction
const action = await server.generateAction(
  "Click the submit button"
);

// Execute the generated action
const result = await client.executeAction(action);
console.log(`Action executed: ${result.success}`);
```

## Performance Optimization

### Reducing Capture Size

To reduce the size of captured UI states:

```typescript
const client = await createWebClient({
  // Exclude elements that are less relevant
  excludeSelectors: [
    '.ad-container',
    '.footer',
    '.sidebar',
    'script',
    'style',
    'noscript'
  ],
  
  // Limit depth to reduce hierarchy complexity
  maxDepth: 8,
  
  // Only include specific attributes
  includeAttributes: ['id', 'class', 'role', 'aria-*', 'data-testid'],
  
  // Exclude invisible elements
  includeInvisible: false
});
```

### Using Differential Updates

For efficient state tracking:

```typescript
// Initial state capture
const initialState = await client.captureState();
server.processInitialState(initialState);

// Subscribe to differential updates
client.subscribeToStateChanges((update) => {
  console.log(`Update: ${update.added.length} added, ${update.modified.length} modified, ${update.removed.length} removed`);
  server.processStateUpdate(update);
});
```

## Integration Patterns

### Integration with React Applications

```typescript
import React, { useEffect } from 'react';
import { createWebClient } from '@amirguterman/model-eyes';

function AIAssistantComponent() {
  useEffect(() => {
    let client;
    
    async function setupModelEyes() {
      client = await createWebClient();
      // Setup rest of ModelEyes integration
      // ...
    }
    
    setupModelEyes();
    
    // Cleanup on component unmount
    return () => {
      if (client) {
        client.dispose();
      }
    };
  }, []);
  
  return (
    <div className="ai-assistant">
      {/* Assistant UI */}
    </div>
  );
}
```

### Integration with Electron Applications

```typescript
import { app, BrowserWindow } from 'electron';
import { createWindowsClient } from '@amirguterman/model-eyes';

app.whenReady().then(async () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600
  });
  
  mainWindow.loadFile('index.html');
  
  // Wait for window to load
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create Windows client targeting the Electron window
  const client = await createWindowsClient({
    windowTitle: 'My Electron App'
  });
  
  // Use ModelEyes with the Electron app
  // ...
});
```

### Integration with Testing Frameworks

```typescript
import { test } from 'your-test-framework';
import { createWebClient } from '@amirguterman/model-eyes';

test('form submission works correctly', async () => {
  // Navigate to the page
  await page.goto('https://example.com/form');
  
  // Create ModelEyes client
  const client = await createWebClient();
  
  // Capture initial state
  const initialState = await client.captureState();
  
  // Fill out the form using ModelEyes
  await client.executeAction({
    type: 'type',
    elementId: 'name-input',
    text: 'John Doe'
  });
  
  await client.executeAction({
    type: 'click',
    elementId: 'submit-button'
  });
  
  // Capture final state
  const finalState = await client.captureState();
  
  // Assert that the success message is visible
  const successElement = Object.values(finalState.elements)
    .find(el => el.type === 'div' && el.attributes?.id === 'success-message');
  
  expect(successElement).toBeDefined();
  expect(successElement.visible).toBe(true);
  
  // Clean up
  client.dispose();
});
```

## Best Practices

1. **Always dispose clients and servers** when you're done with them to free up resources
2. **Use differential updates** for long-running sessions to reduce token usage
3. **Configure element filtering** to focus on relevant parts of the UI
4. **Handle errors gracefully**, especially for UI automation which can be unpredictable
5. **Test with different models** to find the optimal balance between context size and performance
6. **Consider privacy implications** when capturing UI states, especially with sensitive information