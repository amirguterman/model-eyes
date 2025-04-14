/**
 * ModelEyes: Model Context Protocol (MCP) with Structured UI Representation
 *
 * This library provides a protocol for representing UI elements in a structured format,
 * enabling AI models to interact with user interfaces without requiring screenshots.
 *
 * ModelEyes dramatically reduces context size (by ~95%) compared to screenshot-based approaches
 * while providing semantically rich information about UI elements, their properties, and relationships.
 *
 * The library consists of:
 * - Client-side components for extracting UI structure from web and desktop applications
 * - Server-side components for processing UI data and integrating with AI models
 * - Common types and utilities shared between client and server
 *
 * @packageDocumentation
 */

// Import specific types first to avoid reference errors
import { WebMCPClient } from './client/web/web-client';
import { WindowsMCPClient } from './client/desktop/windows-client';
import { OpenAIMCPServer, OpenAIServerConfig } from './server/openai-server';
import { ModelEyesMcpServer } from './mcp/ui-server';

// Export common types
export * from './common/types';

// Export client implementations
export { IMCPClient, BaseMCPClient } from './client/base-client';
export { WebMCPClient } from './client/web/web-client';
export { WindowsMCPClient } from './client/desktop/windows-client';

// Export server implementations
export { IMCPServer, BaseMCPServer } from './server/base-server';
export { OpenAIMCPServer, OpenAIServerConfig } from './server/openai-server';
export { ModelEyesMcpServer, createModelEyesMcpServer, runMcpServer } from './mcp/ui-server';

/**
 * Creates and initializes a web client with sensible default configuration
 *
 * This function provides a convenient way to create a web client for extracting
 * UI structure from web applications. It configures the client with recommended
 * settings for most use cases.
 *
 * @example
 * ```typescript
 * // Create and initialize a web client
 * const client = await createWebClient();
 *
 * // Capture the current UI state
 * const state = await client.captureState();
 *
 * // Use the state with an AI model
 * console.log(`Captured ${Object.keys(state.elements).length} elements`);
 * ```
 *
 * @returns A Promise resolving to an initialized WebMCPClient instance
 */
export async function createWebClient(): Promise<WebMCPClient> {
  const client = new WebMCPClient();
  await client.initialize({
    platform: 'web',
    filtering: {
      maxDepth: 20,
      excludeSelector: 'script, style, meta, link, head',
      includeInvisible: false
    },
    optimization: {
      compress: true,
      useDifferentialUpdates: true
    }
  });
  
  return client;
}

/**
 * Creates and initializes an OpenAI server for processing UI states and generating actions
 *
 * This function provides a convenient way to create a server component that integrates
 * with OpenAI models. It handles the configuration and initialization process.
 *
 * @example
 * ```typescript
 * // Create and initialize an OpenAI server
 * const server = await createOpenAIServer('your-api-key-here', 'gpt-4');
 *
 * // Process a UI state
 * server.processInitialState(uiState);
 *
 * // Prepare context for the model
 * const context = server.prepareContextForModel();
 * ```
 *
 * @param apiKey - Your OpenAI API key for authentication
 * @param model - The OpenAI model to use (defaults to 'gpt-4')
 * @returns A Promise resolving to an initialized OpenAIServer instance
 */
export async function createOpenAIServer(
  apiKey: string,
  model = 'gpt-4'
): Promise<OpenAIMCPServer> {
  const server = new OpenAIMCPServer();
  await server.initialize({
    modelProvider: {
      name: 'openai',
      apiKey,
      options: {
        model,
        temperature: 0.7,
        maxTokens: 1000
      }
    },
    contextManagement: {
      maxHistoryStates: 5,
      includeFullElementDetails: false
    }
  });
  
  return server;
}

/**
 * Create a Windows desktop client with default configuration
 * @returns Initialized Windows client
 */
export async function createWindowsClient(): Promise<WindowsMCPClient> {
  const client = new WindowsMCPClient();
  await client.initialize({
    platform: 'windows',
    filtering: {
      maxDepth: 20,
      includeInvisible: false
    },
    optimization: {
      compress: true,
      useDifferentialUpdates: true
    }
  });
  
  return client;
}

/**
 * Current library version
 *
 * This constant represents the current version of the ModelEyes library.
 * It follows semantic versioning (major.minor.patch).
 */
export const VERSION = '0.1.0'; // ModelEyes version

/**
 * Creates and initializes an MCP server that exposes ModelEyes functionality
 *
 * This function provides a convenient way to create an MCP server that exposes
 * ModelEyes' structured UI representation capabilities through the Model Context Protocol.
 *
 * @example
 * ```typescript
 * // Create and start an MCP server
 * const server = await createModelEyesMcpServer();
 *
 * // Capture UI state from a web page
 * const state = await server.captureWebState('https://example.com');
 *
 * // Get the current UI state
 * const currentState = server.getCurrentState();
 * ```
 *
 * @returns A Promise resolving to an initialized ModelEyesMcpServer instance
 */