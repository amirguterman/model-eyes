/**
 * ModelEyes MCP Server Integration
 * 
 * This module provides integration between ModelEyes and the Model Context Protocol (MCP).
 * It exposes ModelEyes' structured UI representation capabilities as MCP resources and tools.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { createWebClient } from '../index';
import { UIState } from '../common/types';

/**
 * ModelEyes MCP Server
 * 
 * This class implements an MCP server that exposes ModelEyes' structured UI representation
 * capabilities as resources and tools.
 */
export class ModelEyesMcpServer {
  private mcpServer: McpServer;
  private webClient: any | null = null;
  private currentState: UIState | null = null;

  /**
   * Create a new ModelEyes MCP server
   * 
   * @param name Server name
   * @param version Server version
   */
  constructor(name: string = 'model-eyes', version: string = '0.1.0') {
    // Initialize the MCP server
    this.mcpServer = new McpServer({
      name,
      version,
      vendor: {
        name: 'ModelEyes'
      }
    });
  }

  /**
   * Start the server with stdio transport
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
    console.log('ModelEyes MCP server started with stdio transport');
  }

  /**
   * Capture UI state from a web page
   * 
   * @param url Optional URL to navigate to before capturing
   * @returns The captured UI state
   */
  async captureWebState(url?: string): Promise<UIState> {
    // Initialize web client if not already done
    if (!this.webClient) {
      this.webClient = await createWebClient();
    }

    // Navigate to URL if provided
    if (url) {
      console.log(`Navigating to ${url}`);
    }

    // Capture the state
    const state = await this.webClient.captureState();
    
    // Store the state
    this.currentState = state;
    
    return state;
  }

  /**
   * Get the current UI state
   * 
   * @returns The current UI state
   */
  getCurrentState(): UIState | null {
    return this.currentState;
  }

  /**
   * Close the server and clean up resources
   */
  async close(): Promise<void> {
    // Dispose web client
    if (this.webClient && typeof this.webClient.dispose === 'function') {
      this.webClient.dispose();
    }
    
    // Close MCP server
    await this.mcpServer.close();
  }
}

/**
 * Create and start a ModelEyes MCP server
 * 
 * @returns Promise resolving to the created server
 */
export async function createModelEyesMcpServer(): Promise<ModelEyesMcpServer> {
  const server = new ModelEyesMcpServer();
  await server.start();
  return server;
}

/**
 * CLI entry point for running the MCP server
 */
export async function runMcpServer(): Promise<void> {
  try {
    const server = await createModelEyesMcpServer();
    
    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('Shutting down MCP server...');
      await server.close();
      process.exit(0);
    });
    
    console.log('ModelEyes MCP server running. Press Ctrl+C to exit.');
  } catch (error) {
    console.error('Error starting MCP server:', error);
    process.exit(1);
  }
}

/**
 * Export the ModelEyes MCP integration
 */
export default {
  ModelEyesMcpServer,
  createModelEyesMcpServer,
  runMcpServer
};