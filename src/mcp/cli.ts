#!/usr/bin/env node

/**
 * ModelEyes MCP Server CLI
 * 
 * This script provides a command-line interface for running the ModelEyes MCP server.
 */

import { runMcpServer } from './ui-server';

// Run the MCP server
runMcpServer().catch(error => {
  console.error('Error running MCP server:', error);
  process.exit(1);
});