/**
 * ModelEyes: Model Context Protocol (MCP) with Structured UI Representation
 *
 * This library provides a protocol for representing UI elements in a structured format,
 * enabling AI models to interact with user interfaces without requiring screenshots.
 */

// Import specific types first to avoid reference errors
import { WebMCPClient } from './client/web/web-client';
import { WindowsMCPClient } from './client/desktop/windows-client';
import { OpenAIMCPServer, OpenAIServerConfig } from './server/openai-server';

// Export common types
export * from './common/types';

// Export client implementations
export { IMCPClient, BaseMCPClient } from './client/base-client';
export { WebMCPClient } from './client/web/web-client';
export { WindowsMCPClient } from './client/desktop/windows-client';

// Export server implementations
export { IMCPServer, BaseMCPServer } from './server/base-server';
export { OpenAIMCPServer, OpenAIServerConfig } from './server/openai-server';

/**
 * Create a web client with default configuration
 * @returns Initialized web client
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
 * Create an OpenAI server with the provided API key
 * @param apiKey OpenAI API key
 * @param model OpenAI model to use
 * @returns Initialized OpenAI server
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
 * Library version
 */
export const VERSION = '0.1.0'; // ModelEyes version