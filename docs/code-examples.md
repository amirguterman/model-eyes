# ModelEyes Code Examples

This page provides practical code examples for common ModelEyes use cases.

## Basic Web Client Example

```typescript
import { createWebClient, createOpenAIServer } from '@amirguterman/model-eyes';

async function captureWebPage() {
  // Create and initialize a web client
  const client = await createWebClient();
  
  // Capture the current UI state
  const state = await client.captureState();
  
  console.log(`Captured ${Object.keys(state.elements).length} elements`);
  console.log(`Page title: ${state.title}`);
  
  // Clean up resources
  client.dispose();
  
  return state;
}

captureWebPage().catch(console.error);
```

## Filtering Elements

```typescript
import { createWebClient } from '@amirguterman/model-eyes';

async function captureFilteredElements() {
  // Create client with filtering options
  const client = await createWebClient({
    // Exclude elements by CSS selector
    excludeSelectors: [
      '.ad-container', 
      '#cookie-notice',
      'script',
      'style',
      'noscript',
      'meta',
      'link'
    ],
    
    // Only include visible elements
    includeInvisible: false,
    
    // Limit depth to reduce hierarchy complexity
    maxDepth: 8,
    
    // Only include specific attributes
    includeAttributes: ['id', 'class', 'role', 'aria-*', 'data-testid']
  });
  
  // Capture the filtered UI state
  const state = await client.captureState();
  
  console.log(`Captured ${Object.keys(state.elements).length} filtered elements`);
  
  // Clean up resources
  client.dispose();
  
  return state;
}

captureFilteredElements().catch(console.error);
```

## Monitoring UI Changes

```typescript
import { createWebClient } from '@amirguterman/model-eyes';

async function monitorUIChanges() {
  // Create and initialize a web client
  const client = await createWebClient();
  
  // Capture initial state
  const initialState = await client.captureState();
  console.log(`Initial state: ${Object.keys(initialState.elements).length} elements`);
  
  // Subscribe to state changes
  const subscription = client.subscribeToStateChanges((update) => {
    console.log('UI state updated:');
    console.log(`- Added: ${Object.keys(update.added).length} elements`);
    console.log(`- Modified: ${Object.keys(update.modified).length} elements`);
    console.log(`- Removed: ${update.removed.length} elements`);
  });
  
  // After some time or event, unsubscribe
  setTimeout(() => {
    subscription.unsubscribe();
    client.dispose();
    console.log('Stopped monitoring UI changes');
  }, 60000); // Monitor for 1 minute
}

monitorUIChanges().catch(console.error);
```

## Interacting with UI Elements

```typescript
import { createWebClient } from '@amirguterman/model-eyes';

async function interactWithUI() {
  // Create and initialize a web client
  const client = await createWebClient();
  
  // Capture the current UI state
  const state = await client.captureState();
  
  // Find a search input element
  const searchInput = Object.values(state.elements).find(
    element => element.type === 'input' && 
               (element.attributes?.type === 'search' || 
                element.attributes?.placeholder?.toLowerCase().includes('search'))
  );
  
  if (searchInput) {
    console.log(`Found search input: ${searchInput.id}`);
    
    // Type text into the search input
    await client.executeAction({
      type: 'type',
      elementId: searchInput.id,
      text: 'ModelEyes example'
    });
    
    // Find a search button
    const searchButton = Object.values(state.elements).find(
      element => (element.type === 'button' || element.type === 'input') && 
                 (element.attributes?.type === 'submit' ||
                  (element.text && element.text.toLowerCase().includes('search')))
    );
    
    if (searchButton) {
      console.log(`Found search button: ${searchButton.id}`);
      
      // Click the search button
      await client.executeAction({
        type: 'click',
        elementId: searchButton.id
      });
      
      // Wait for results to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Capture the updated state
      const updatedState = await client.captureState();
      console.log(`Search results: ${Object.keys(updatedState.elements).length} elements`);
    }
  }
  
  // Clean up resources
  client.dispose();
}

interactWithUI().catch(console.error);
```

## Working with OpenAI Models

```typescript
import { createWebClient, createOpenAIServer } from '@amirguterman/model-eyes';

async function useWithOpenAI() {
  // Create and initialize a web client
  const client = await createWebClient();
  
  // Create and initialize an OpenAI server
  const server = await createOpenAIServer(
    'your-api-key-here',
    { model: 'gpt-4' }
  );
  
  // Capture the current UI state
  const state = await client.captureState();
  
  // Process the state on the server
  server.processInitialState(state);
  
  // Prepare context for the model
  const context = server.prepareContextForModel({
    maxTokens: 4000,
    simplifyElements: true
  });
  
  console.log(`Context prepared: ${context.tokenCount} tokens`);
  
  // Generate an action based on user instruction
  const action = await server.generateAction(
    "Find the login button and click it"
  );
  
  console.log(`Generated action: ${action.type} on element ${action.elementId}`);
  
  // Execute the generated action
  const result = await client.executeAction(action);
  console.log(`Action executed: ${result.success}`);
  
  // Clean up resources
  client.dispose();
  server.dispose();
}

useWithOpenAI().catch(console.error);
```

## Windows Desktop Application Example

```typescript
import { createWindowsClient, createOpenAIServer } from '@amirguterman/model-eyes';

async function captureWindowsApp() {
  // Create and initialize a Windows client
  const client = await createWindowsClient({
    windowTitle: 'Notepad'  // Target Notepad window
  });
  
  // Capture the current UI state
  const state = await client.captureState();
  
  console.log(`Captured ${Object.keys(state.elements).length} elements from Notepad`);
  
  // Find the text area
  const textArea = Object.values(state.elements).find(
    element => element.type === 'edit' || element.type === 'document'
  );
  
  if (textArea) {
    console.log(`Found text area: ${textArea.id}`);
    
    // Type text into the text area
    await client.executeAction({
      type: 'type',
      elementId: textArea.id,
      text: 'Hello from ModelEyes!'
    });
    
    // Find the File menu
    const fileMenu = Object.values(state.elements).find(
      element => element.type === 'menuitem' && 
                 element.text && 
                 element.text.toLowerCase().includes('file')
    );
    
    if (fileMenu) {
      console.log(`Found File menu: ${fileMenu.id}`);
      
      // Click the File menu
      await client.executeAction({
        type: 'click',
        elementId: fileMenu.id
      });
    }
  }
  
  // Clean up resources
  client.dispose();
}

captureWindowsApp().catch(console.error);
```

## Error Handling

```typescript
import { createWebClient } from '@amirguterman/model-eyes';

async function handleErrors() {
  let client;
  
  try {
    // Create and initialize a web client
    client = await createWebClient();
    
    // Capture the current UI state
    const state = await client.captureState();
    
    // Try to interact with a non-existent element
    try {
      await client.executeAction({
        type: 'click',
        elementId: 'non-existent-element'
      });
    } catch (actionError) {
      console.error('Action error:', actionError.message);
      
      // Find a valid button to click instead
      const fallbackButton = Object.values(state.elements).find(
        element => element.type === 'button' && element.interactable
      );
      
      if (fallbackButton) {
        console.log(`Found fallback button: ${fallbackButton.id}`);
        
        await client.executeAction({
          type: 'click',
          elementId: fallbackButton.id
        });
      }
    }
  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    // Always clean up resources
    if (client) {
      client.dispose();
    }
  }
}

handleErrors().catch(console.error);
```

## Performance Optimization

```typescript
import { createWebClient, createOpenAIServer } from '@amirguterman/model-eyes';

async function optimizePerformance() {
  // Create client with performance optimizations
  const client = await createWebClient({
    // Exclude less important elements
    excludeSelectors: [
      'script', 'style', 'noscript', 'meta', 'link',
      '.ad-container', '.footer', '.sidebar', '.navigation'
    ],
    
    // Limit depth to reduce hierarchy complexity
    maxDepth: 6,
    
    // Only include specific attributes
    includeAttributes: ['id', 'class', 'role', 'aria-*'],
    
    // Don't capture styles (reduces size)
    captureStyles: false,
    
    // Exclude invisible elements
    includeInvisible: false,
    
    // Use a longer update interval for subscriptions
    updateInterval: 1000
  });
  
  // Create server with performance optimizations
  const server = await createOpenAIServer('your-api-key-here', {
    // Use a smaller model for faster responses
    model: 'gpt-3.5-turbo',
    
    // Limit token usage
    maxTokens: 2000,
    
    // Simplify elements for context
    simplifyElements: true,
    
    // Exclude styles from context
    includeStyles: false
  });
  
  // Capture initial state
  console.time('captureState');
  const state = await client.captureState();
  console.timeEnd('captureState');
  
  // Process state on server
  console.time('processState');
  server.processInitialState(state);
  console.timeEnd('processState');
  
  // Prepare context
  console.time('prepareContext');
  const context = server.prepareContextForModel();
  console.timeEnd('prepareContext');
  
  console.log(`Optimized context: ${context.tokenCount} tokens`);
  
  // Clean up resources
  client.dispose();
  server.dispose();
}

optimizePerformance().catch(console.error);