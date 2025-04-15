#!/usr/bin/env node

/**
 * ModelEyes HTTP Server CLI
 * 
 * This script provides a command-line interface for running the ModelEyes HTTP server.
 */

import { runHttpServer } from './http-server';

// Run the HTTP server
runHttpServer().catch(error => {
  console.error('Error running HTTP server:', error);
  process.exit(1);
});