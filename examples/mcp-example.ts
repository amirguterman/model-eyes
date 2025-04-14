/**
 * ModelEyes MCP Server Example
 * 
 * This example demonstrates how to use the ModelEyes MCP server to:
 * 1. Capture UI state from a web page
 * 2. Access the UI state through the MCP protocol
 */

import { createModelEyesMcpServer } from '../src/mcp/ui-server';
import { UIState } from '../src/common/types';

// Mock UI state for demonstration purposes
const mockUIState: UIState = {
  timestamp: Date.now(),
  platform: 'web',
  application: 'Example Browser',
  title: 'Example Domain',
  url: 'https://example.com',
  viewport: {
    width: 1024,
    height: 768
  },
  elements: {
    'body': {
      id: 'body',
      type: 'body',
      bounds: {
        x: 0,
        y: 0,
        width: 1024,
        height: 768
      },
      interactable: false,
      visible: true,
      children: ['header', 'main', 'footer']
    },
    'header': {
      id: 'header',
      type: 'div',
      bounds: {
        x: 0,
        y: 0,
        width: 1024,
        height: 80
      },
      interactable: false,
      visible: true,
      parent: 'body',
      children: ['logo', 'nav']
    },
    'logo': {
      id: 'logo',
      type: 'img',
      text: '',
      bounds: {
        x: 20,
        y: 20,
        width: 100,
        height: 40
      },
      interactable: true,
      visible: true,
      parent: 'header'
    },
    'nav': {
      id: 'nav',
      type: 'nav',
      bounds: {
        x: 200,
        y: 20,
        width: 600,
        height: 40
      },
      interactable: false,
      visible: true,
      parent: 'header',
      children: ['nav-home', 'nav-about', 'nav-contact']
    },
    'nav-home': {
      id: 'nav-home',
      type: 'a',
      text: 'Home',
      bounds: {
        x: 200,
        y: 20,
        width: 100,
        height: 40
      },
      interactable: true,
      visible: true,
      parent: 'nav'
    },
    'nav-about': {
      id: 'nav-about',
      type: 'a',
      text: 'About',
      bounds: {
        x: 300,
        y: 20,
        width: 100,
        height: 40
      },
      interactable: true,
      visible: true,
      parent: 'nav'
    },
    'nav-contact': {
      id: 'nav-contact',
      type: 'a',
      text: 'Contact',
      bounds: {
        x: 400,
        y: 20,
        width: 100,
        height: 40
      },
      interactable: true,
      visible: true,
      parent: 'nav'
    },
    'main': {
      id: 'main',
      type: 'main',
      text: 'This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.',
      bounds: {
        x: 0,
        y: 80,
        width: 1024,
        height: 600
      },
      interactable: false,
      visible: true,
      parent: 'body'
    },
    'footer': {
      id: 'footer',
      type: 'footer',
      text: '© Example Domain',
      bounds: {
        x: 0,
        y: 680,
        width: 1024,
        height: 88
      },
      interactable: false,
      visible: true,
      parent: 'body'
    }
  },
  version: '1.0'
};

async function runExample() {
  console.log('Starting ModelEyes MCP server example...');
  
  // Create and start the MCP server
  const server = await createModelEyesMcpServer();
  console.log('MCP server started');
  
  try {
    // Instead of capturing from a real web page, we'll use our mock state
    console.log('Using mock UI state for example.com...');
    
    // Manually set the current state in the server
    server['currentState'] = mockUIState;
    
    console.log(`Mock UI state has ${Object.keys(mockUIState.elements).length} elements`);
    console.log(`Page title: ${mockUIState.title}`);
    console.log(`Viewport size: ${mockUIState.viewport.width}x${mockUIState.viewport.height}`);
    
    // Get some statistics about the elements
    const interactableElements = Object.values(mockUIState.elements).filter(element => element.interactable);
    console.log(`Interactable elements: ${interactableElements.length}`);
    
    // Print some example elements
    console.log('\nExample elements:');
    Object.entries(mockUIState.elements).slice(0, 3).forEach(([id, element]) => {
      console.log(`- ${id}: ${element.type}${element.text ? ` (${element.text.substring(0, 30)}${element.text.length > 30 ? '...' : ''})` : ''}`);
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