/**
 * Optimization utilities for ModelEyes
 * 
 * This module provides utilities for optimizing data transmission and storage
 * in the ModelEyes library, including compression, diffing, and filtering algorithms.
 */

import { UIElement, UIState, DifferentialUpdate } from './types';

/**
 * Computes a hash for a UI element to quickly detect changes
 * 
 * @param element The UI element to hash
 * @returns A string hash representing the element's content
 */
export function hashElement(element: UIElement): string {
  // Create a simplified representation of the element for hashing
  const hashObj = {
    type: element.type,
    text: element.text || '',
    bounds: element.bounds,
    interactable: element.interactable || false,
    visible: element.visible !== false, // Default to true if not specified
    attributes: element.attributes || {}
  };
  
  // Convert to string and hash
  return hashString(JSON.stringify(hashObj));
}

/**
 * Simple string hashing function
 * 
 * @param str String to hash
 * @returns Hash string
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Computes the difference between two UI states
 * 
 * This function implements an efficient diffing algorithm that identifies
 * added, modified, and removed elements between two UI states.
 * 
 * @param oldState Previous UI state
 * @param newState Current UI state
 * @returns Differential update containing only the changes
 */
export function computeDiff(oldState: UIState, newState: UIState): DifferentialUpdate {
  const added: Record<string, UIElement> = {};
  const modified: Record<string, Partial<UIElement>> = {};
  const removed: string[] = [];
  
  // Track element hashes for quick comparison
  const oldHashes: Record<string, string> = {};
  const newHashes: Record<string, string> = {};
  
  // Compute hashes for old state
  for (const [id, element] of Object.entries(oldState.elements)) {
    oldHashes[id] = hashElement(element);
  }
  
  // Compute hashes for new state and identify added/modified elements
  for (const [id, element] of Object.entries(newState.elements)) {
    newHashes[id] = hashElement(element);
    
    if (!oldState.elements[id]) {
      // Element is new
      added[id] = element;
    } else if (oldHashes[id] !== newHashes[id]) {
      // Element was modified
      const changes = computeElementChanges(oldState.elements[id], element);
      if (Object.keys(changes).length > 0) {
        modified[id] = changes;
      }
    }
  }
  
  // Identify removed elements
  for (const id of Object.keys(oldState.elements)) {
    if (!newState.elements[id]) {
      removed.push(id);
    }
  }
  
  // Create the differential update
  const update: DifferentialUpdate = {
    timestamp: newState.timestamp,
    baseVersion: oldState.version,
    version: newState.version
  };
  
  // Only include properties that have changes
  if (Object.keys(added).length > 0) {
    update.added = added;
  }
  
  if (Object.keys(modified).length > 0) {
    update.modified = modified;
  }
  
  if (removed.length > 0) {
    update.removed = removed;
  }
  
  // Include focus and hover only if they changed
  if (oldState.focus !== newState.focus) {
    update.focus = newState.focus || null;
  }
  
  if (oldState.hover !== newState.hover) {
    update.hover = newState.hover || null;
  }
  
  return update;
}

/**
 * Computes the changes between two UI elements
 * 
 * This function identifies which properties of an element have changed
 * and returns only those properties.
 * 
 * @param oldElement Previous version of the element
 * @param newElement Current version of the element
 * @returns Partial element containing only the changed properties
 */
function computeElementChanges(oldElement: UIElement, newElement: UIElement): Partial<UIElement> {
  const changes: Partial<UIElement> = {};
  
  // Check text content
  if (oldElement.text !== newElement.text) {
    changes.text = newElement.text;
  }
  
  // Check bounds
  if (!boundsEqual(oldElement.bounds, newElement.bounds)) {
    changes.bounds = newElement.bounds;
  }
  
  // Check interactable state
  if (oldElement.interactable !== newElement.interactable) {
    changes.interactable = newElement.interactable;
  }
  
  // Check visibility
  if (oldElement.visible !== newElement.visible) {
    changes.visible = newElement.visible;
  }
  
  // Check attributes
  if (!attributesEqual(oldElement.attributes, newElement.attributes)) {
    changes.attributes = newElement.attributes;
  }
  
  // Check styles
  if (!stylesEqual(oldElement.styles, newElement.styles)) {
    changes.styles = newElement.styles;
  }
  
  // Check children
  if (!arraysEqual(oldElement.children, newElement.children)) {
    changes.children = newElement.children;
  }
  
  return changes;
}

/**
 * Checks if two bounds objects are equal
 */
function boundsEqual(a?: { x: number; y: number; width: number; height: number }, 
                    b?: { x: number; y: number; width: number; height: number }): boolean {
  if (!a || !b) return a === b;
  
  return a.x === b.x && 
         a.y === b.y && 
         a.width === b.width && 
         a.height === b.height;
}

/**
 * Checks if two attribute objects are equal
 */
function attributesEqual(a?: Record<string, any>, b?: Record<string, any>): boolean {
  if (!a || !b) return a === b;
  
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  
  if (aKeys.length !== bKeys.length) return false;
  
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  
  return true;
}

/**
 * Checks if two style objects are equal
 */
function stylesEqual(a?: Record<string, string>, b?: Record<string, string>): boolean {
  if (!a || !b) return a === b;
  
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  
  if (aKeys.length !== bKeys.length) return false;
  
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  
  return true;
}

/**
 * Checks if two arrays are equal
 */
function arraysEqual<T>(a?: T[], b?: T[]): boolean {
  if (!a || !b) return a === b;
  
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  
  return true;
}

/**
 * Compresses a UI state to reduce its size
 * 
 * @param state UI state to compress
 * @returns Compressed UI state
 */
export function compressState(state: UIState): UIState {
  // Create a deep copy of the state
  const compressedState = JSON.parse(JSON.stringify(state)) as UIState;
  
  // Compress element properties
  for (const id in compressedState.elements) {
    const element = compressedState.elements[id];
    
    // Remove empty optional properties
    if (element.text === '') delete element.text;
    if (!element.attributes || Object.keys(element.attributes).length === 0) delete element.attributes;
    if (!element.styles || Object.keys(element.styles).length === 0) delete element.styles;
    if (!element.children || element.children.length === 0) delete element.children;
    
    // Default values can be omitted
    if (element.visible === true) delete element.visible;
    if (element.interactable === false) delete element.interactable;
    
    // Compress bounds to integers when possible
    if (element.bounds) {
      element.bounds.x = Math.round(element.bounds.x);
      element.bounds.y = Math.round(element.bounds.y);
      element.bounds.width = Math.round(element.bounds.width);
      element.bounds.height = Math.round(element.bounds.height);
    }
  }
  
  return compressedState;
}

/**
 * Filters UI elements based on relevance
 * 
 * @param state UI state to filter
 * @param options Filtering options
 * @returns Filtered UI state
 */
export function filterElements(
  state: UIState, 
  options: {
    maxElements?: number;
    prioritizeInteractable?: boolean;
    prioritizeVisible?: boolean;
    excludeTypes?: string[];
    includeTypes?: string[];
  }
): UIState {
  // Create a deep copy of the state
  const filteredState = JSON.parse(JSON.stringify(state)) as UIState;
  const elements = filteredState.elements;
  
  // Convert elements to array for sorting and filtering
  let elementArray = Object.entries(elements).map(([id, element]) => ({
    id,
    element,
    score: calculateElementScore(element, options)
  }));
  
  // Filter by type if specified
  if (options.excludeTypes && options.excludeTypes.length > 0) {
    elementArray = elementArray.filter(({ element }) => 
      !options.excludeTypes!.includes(element.type)
    );
  }
  
  if (options.includeTypes && options.includeTypes.length > 0) {
    elementArray = elementArray.filter(({ element }) => 
      options.includeTypes!.includes(element.type)
    );
  }
  
  // Sort by score (descending)
  elementArray.sort((a, b) => b.score - a.score);
  
  // Limit to max elements if specified
  if (options.maxElements && elementArray.length > options.maxElements) {
    elementArray = elementArray.slice(0, options.maxElements);
  }
  
  // Rebuild elements object
  filteredState.elements = {};
  for (const { id, element } of elementArray) {
    filteredState.elements[id] = element;
  }
  
  return filteredState;
}

/**
 * Calculates a relevance score for an element
 */
function calculateElementScore(
  element: UIElement, 
  options: {
    prioritizeInteractable?: boolean;
    prioritizeVisible?: boolean;
  }
): number {
  let score = 0;
  
  // Prioritize interactable elements
  if (options.prioritizeInteractable && element.interactable) {
    score += 100;
  }
  
  // Prioritize visible elements
  if (options.prioritizeVisible && element.visible !== false) {
    score += 50;
  }
  
  // Prioritize elements with text
  if (element.text && element.text.trim().length > 0) {
    score += 25;
  }
  
  // Prioritize elements with smaller depth (closer to root)
  const depth = getElementDepth(element);
  score += Math.max(0, 20 - depth * 2);
  
  return score;
}

/**
 * Estimates the depth of an element in the hierarchy
 */
function getElementDepth(element: UIElement): number {
  let depth = 0;
  let current = element;
  
  while (current.parent) {
    depth++;
    // We don't have the actual parent element here, so we can't continue
    // In a real implementation, we would follow the parent chain
    break;
  }
  
  return depth;
}