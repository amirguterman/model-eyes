/**
 * ModelEyes MCP Server Example
 * 
 * This example demonstrates how to use the ModelEyes MCP server to:
 * 1. Capture UI state from a web page
 * 2. Access the UI state through the MCP protocol
 */

import { createModelEyesMcpServer } from '../src/mcp/ui-server';

async function runExample() {
  console.log('Starting ModelEyes MCP server example...');
  
  // Create and start the MCP server
  const server = await createModelEyesMcpServer();
  console.log('MCP server started');
  
  try {
    // Capture UI state from a web page
    console.log('Capturing UI state from example.com...');
    const state = await server.captureWebState('https://example.com');
    
    console.log(`Captured UI state with ${Object.keys(state.elements).length} elements`);
    console.log(`Page title: ${state.title}`);
    console.log(`Viewport size: ${state.viewport.width}x${state.viewport.height}`);
    
    // Get some statistics about the elements
    const interactableElements = Object.values(state.elements).filter(element => element.interactable);
    console.log(`Interactable elements: ${interactableElements.length}`);
    
    // Print some example elements
    console.log('\nExample elements:');
    Object.entries(state.elements).slice(0, 3).forEach(([id, element]) => {
      console.log(`- ${element.type}${element.text ? ` (${element.text.substring(0, 30)}${element.text.length > 30 ? '...' : ''})` : ''}`);
    });
    
    console.log('\nMCP server is running. Press Ctrl+C to exit.');
    
    // Keep the process running
    await new Promise(() => {});
  } catch (error) {
    console.error('Error in MCP example:', error);
  } finally {
    // Clean up resources
    await server.close();
  }
}

// Run the example
runExample().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});