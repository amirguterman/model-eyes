# ModelEyes Visualization Tools

This directory contains tools for visualizing and debugging ModelEyes UI states and differential updates.

## UI Visualizer

The UI Visualizer is a browser-based tool that allows you to:

- Load and visualize UI states
- Apply differential updates
- Explore the element hierarchy
- Inspect element properties
- Visualize different aspects of the UI (interactable elements, hierarchy, etc.)

### Usage

1. Open `ui-visualizer.html` in a web browser
2. Click "Load State" to load a UI state JSON file
3. Explore the UI elements in the tree view on the left
4. Click on elements to see their details
5. Use the view mode dropdown to change visualization options
6. Click "Load Update" to apply a differential update to the current state

## Sample Data Generator

The `generate-sample-data.js` script generates sample UI state and update files for testing the visualization tool.

### Usage

```bash
# Navigate to the visualization tools directory
cd tools/visualization

# Run the script
node generate-sample-data.js
```

This will create a `sample-data` directory containing:
- `sample-state.json`: A sample UI state
- `sample-update.json`: A sample differential update

You can then load these files in the UI Visualizer to see how they work.

## Integration with ModelEyes

You can use these visualization tools to debug your ModelEyes implementation by:

1. Capturing UI states from your application
2. Saving them as JSON files
3. Loading them in the UI Visualizer

### Example: Capturing and Visualizing a UI State

```javascript
import { createWebClient } from '@amirguterman/model-eyes';
import fs from 'fs';

async function captureAndVisualizeUI() {
  // Create a web client
  const client = await createWebClient();
  
  // Capture the UI state
  const state = await client.captureState();
  
  // Save the state to a file
  fs.writeFileSync('ui-state.json', JSON.stringify(state, null, 2));
  
  console.log('UI state saved to ui-state.json');
  console.log('Open tools/visualization/ui-visualizer.html to visualize it');
  
  // Clean up
  client.dispose();
}

captureAndVisualizeUI().catch(console.error);
```

### Example: Capturing Differential Updates

```javascript
import { createWebClient } from '@amirguterman/model-eyes';
import fs from 'fs';

async function captureDifferentialUpdates() {
  // Create a web client
  const client = await createWebClient();
  
  // Capture the initial UI state
  const initialState = await client.captureState();
  fs.writeFileSync('initial-state.json', JSON.stringify(initialState, null, 2));
  
  // Subscribe to state changes
  client.subscribeToStateChanges((update) => {
    // Save the update to a file
    fs.writeFileSync('ui-update.json', JSON.stringify(update, null, 2));
    console.log('UI update saved to ui-update.json');
  });
  
  console.log('Monitoring for UI changes...');
  console.log('Open tools/visualization/ui-visualizer.html to visualize the state and updates');
  
  // Keep the script running to capture updates
  // In a real application, you would integrate this with your application lifecycle
}

captureDifferentialUpdates().catch(console.error);
```

## Troubleshooting

If you encounter issues with the visualization tools:

- Make sure your UI state and update files are valid JSON
- Check that the UI state has the expected structure (elements, viewport, etc.)
- For large UI states, consider filtering out less important elements before visualization
- If the visualization is slow, try reducing the number of elements in your UI state

## Future Enhancements

Planned enhancements for the visualization tools include:

- Real-time visualization of UI changes
- Improved rendering of complex UI hierarchies
- Support for visualizing element styles
- Comparison view for before/after states
- Integration with browser developer tools