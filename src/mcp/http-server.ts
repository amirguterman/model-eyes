/**
 * ModelEyes MCP HTTP Server
 * 
 * This module provides an HTTP server that can receive UI state data from the Chrome extension
 * and expose it through the Model Context Protocol (MCP).
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { UIState, DifferentialUpdate } from '../common/types';

/**
 * ModelEyes MCP HTTP Server
 * 
 * This class implements an HTTP server that can receive UI state data from the Chrome extension
 * and expose it through the Model Context Protocol (MCP).
 */
export class ModelEyesHttpServer {
  private expressApp: express.Application;
  private server: any;
  private currentState: UIState | null = null;
  private stateHistory: UIState[] = [];
  private maxHistoryStates = 10;
  private port: number;

  /**
   * Create a new ModelEyes HTTP server
   * 
   * @param port HTTP port to listen on
   * @param name Server name
   * @param version Server version
   */
  constructor(port: number = 3000, name: string = 'model-eyes', version: string = '0.1.0') {
    this.port = port;

    // Initialize Express app
    this.expressApp = express();
    this.expressApp.use(express.json({ limit: '50mb' }));
    this.expressApp.use(cors());

    // Set up routes
    this.setupRoutes();
  }

  /**
   * Set up Express routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.expressApp.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok' });
    });

    // Endpoint to receive UI state from Chrome extension
    this.expressApp.post('/api/ui-state', (req: Request, res: Response) => {
      try {
        const uiState = req.body as UIState;
        
        // Validate the UI state
        if (!uiState || !uiState.elements) {
          throw new Error('Invalid UI state');
        }
        
        // Store the UI state
        this.updateCurrentState(uiState);
        
        // Return success response
        res.status(200).json({
          success: true,
          message: `Received UI state with ${Object.keys(uiState.elements).length} elements`,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error processing UI state:', error);
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Endpoint to execute an action on a UI element
    this.expressApp.post('/api/execute-action', (req: Request, res: Response) => {
      try {
        const { actionType, elementId, data } = req.body;
        
        // Validate the action
        if (!actionType || !elementId) {
          throw new Error('Invalid action');
        }
        
        // Check if we have a current state
        if (!this.currentState) {
          throw new Error('No UI state available');
        }
        
        // Check if the element exists
        if (!this.currentState.elements[elementId]) {
          throw new Error(`Element with ID ${elementId} not found`);
        }
        
        // Return success response (in a real implementation, this would actually execute the action)
        res.status(200).json({
          success: true,
          message: `Action ${actionType} executed on element ${elementId}`,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error executing action:', error);
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Endpoint to get the current UI state
    this.expressApp.get('/api/ui-state', (req: Request, res: Response) => {
      if (!this.currentState) {
        res.status(404).json({
          success: false,
          error: 'No UI state available'
        });
        return;
      }
      
      res.status(200).json(this.currentState);
    });

    // Endpoint to find elements by criteria
    this.expressApp.post('/api/find-elements', (req: Request, res: Response) => {
      try {
        const { type, text, interactable, limit = 10 } = req.body;
        
        // Check if we have a current state
        if (!this.currentState) {
          throw new Error('No UI state available');
        }
        
        // Find matching elements
        const matches = Object.entries(this.currentState.elements)
          .filter(([_, element]) => {
            // Match type if specified
            if (type && element.type !== type) {
              return false;
            }
            
            // Match text if specified
            if (text && (!element.text || !element.text.includes(text))) {
              return false;
            }
            
            // Match interactable if specified
            if (interactable !== undefined && element.interactable !== interactable) {
              return false;
            }
            
            return true;
          })
          .map(([id, element]) => ({
            id,
            type: element.type,
            text: element.text,
            interactable: element.interactable,
            bounds: element.bounds
          }))
          .slice(0, limit);
        
        res.status(200).json({
          success: true,
          elements: matches,
          count: matches.length
        });
      } catch (error) {
        console.error('Error finding elements:', error);
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Serve static files for the demo UI
    this.expressApp.use(express.static('public'));
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    // Start the HTTP server
    this.server = this.expressApp.listen(this.port, () => {
      console.log(`ModelEyes HTTP server listening on port ${this.port}`);
    });

    console.log(`ModelEyes HTTP server started on port ${this.port}`);
  }

  /**
   * Update the current state and maintain history
   * 
   * @param state New UI state
   */
  private updateCurrentState(state: UIState): void {
    // Add current state to history if it exists
    if (this.currentState) {
      this.stateHistory.unshift(this.currentState);
      
      // Limit history size
      if (this.stateHistory.length > this.maxHistoryStates) {
        this.stateHistory.pop();
      }
    }
    
    // Update current state
    this.currentState = state;
  }

  /**
   * Process a differential update
   * 
   * @param update Differential update to apply
   */
  processUpdate(update: DifferentialUpdate): void {
    if (!this.currentState) {
      throw new Error('No current state available');
    }

    // Verify that the update applies to the current state
    if (update.baseVersion !== this.currentState.version) {
      throw new Error(
        `Update base version ${update.baseVersion} does not match current state version ${this.currentState.version}`
      );
    }

    // Create a deep copy of the current state
    const newState: UIState = JSON.parse(JSON.stringify(this.currentState));
    
    // Apply the update
    
    // Add new elements
    if (update.added) {
      for (const [id, element] of Object.entries(update.added)) {
        newState.elements[id] = element;
      }
    }
    
    // Modify existing elements
    if (update.modified) {
      for (const [id, changes] of Object.entries(update.modified)) {
        if (newState.elements[id]) {
          Object.assign(newState.elements[id], changes);
        }
      }
    }
    
    // Remove elements
    if (update.removed) {
      for (const id of update.removed) {
        delete newState.elements[id];
      }
    }
    
    // Update focus and hover
    if (update.focus !== undefined) {
      newState.focus = update.focus || undefined;
    }
    
    if (update.hover !== undefined) {
      newState.hover = update.hover || undefined;
    }
    
    // Update version and timestamp
    newState.version = update.version;
    newState.timestamp = update.timestamp;
    
    // Update the current state
    this.updateCurrentState(newState);
  }

  /**
   * Close the server and clean up resources
   */
  async close(): Promise<void> {
    // Close the HTTP server
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server.close(() => {
          resolve();
        });
      });
    }
    
  }
}

/**
 * Create and start a ModelEyes HTTP server
 * 
 * @param port HTTP port to listen on
 * @returns Promise resolving to the created server
 */
export async function createModelEyesHttpServer(port: number = 3000): Promise<ModelEyesHttpServer> {
  const server = new ModelEyesHttpServer(port);
  await server.start();
  return server;
}

/**
 * CLI entry point for running the HTTP server
 */
export async function runHttpServer(): Promise<void> {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    const server = await createModelEyesHttpServer(port);
    
    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('Shutting down HTTP server...');
      await server.close();
      process.exit(0);
    });
    
    console.log(`ModelEyes HTTP server running on port ${port}. Press Ctrl+C to exit.`);
  } catch (error) {
    console.error('Error starting HTTP server:', error);
    process.exit(1);
  }
}

/**
 * Export the ModelEyes HTTP server
 */
export default {
  ModelEyesHttpServer,
  createModelEyesHttpServer,
  runHttpServer
};