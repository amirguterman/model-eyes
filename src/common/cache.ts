/**
 * Caching utilities for ModelEyes
 * 
 * This module provides caching mechanisms to improve performance
 * by avoiding redundant processing and reducing data size.
 */

import { UIState, UIElement, DifferentialUpdate } from './types';

/**
 * LRU (Least Recently Used) Cache implementation
 * 
 * This cache automatically evicts the least recently used items
 * when it reaches its capacity.
 */
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;
  private usage: Map<K, number>;
  private accessCounter: number = 0;
  
  /**
   * Create a new LRU cache
   * @param capacity Maximum number of items to store
   */
  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map<K, V>();
    this.usage = new Map<K, number>();
  }
  
  /**
   * Get an item from the cache
   * @param key Key to look up
   * @returns Value or undefined if not found
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    
    // Update usage
    this.usage.set(key, ++this.accessCounter);
    
    return this.cache.get(key);
  }
  
  /**
   * Set an item in the cache
   * @param key Key to store
   * @param value Value to store
   */
  set(key: K, value: V): void {
    // If at capacity and adding a new item, evict the least recently used
    if (this.cache.size >= this.capacity && !this.cache.has(key)) {
      const lruKey = this.findLRUKey();
      if (lruKey) {
        this.cache.delete(lruKey);
        this.usage.delete(lruKey);
      }
    }
    
    // Add/update the item
    this.cache.set(key, value);
    this.usage.set(key, ++this.accessCounter);
  }
  
  /**
   * Check if the cache contains a key
   * @param key Key to check
   * @returns Whether the key exists in the cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }
  
  /**
   * Remove an item from the cache
   * @param key Key to remove
   * @returns Whether the item was removed
   */
  delete(key: K): boolean {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.usage.delete(key);
      return true;
    }
    return false;
  }
  
  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.usage.clear();
    this.accessCounter = 0;
  }
  
  /**
   * Get the number of items in the cache
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Find the least recently used key
   * @returns The least recently used key or undefined if cache is empty
   */
  private findLRUKey(): K | undefined {
    let lruKey: K | undefined = undefined;
    let lruCount = Infinity;
    
    for (const [key, count] of this.usage.entries()) {
      if (count < lruCount) {
        lruCount = count;
        lruKey = key;
      }
    }
    
    return lruKey;
  }
}

/**
 * UI State Cache for storing and retrieving UI states
 * 
 * This cache stores UI states and provides methods for retrieving
 * states by version or timestamp.
 */
export class UIStateCache {
  private stateCache: LRUCache<string, UIState>;
  private versionToTimestamp: Map<string, number>;
  
  /**
   * Create a new UI state cache
   * @param capacity Maximum number of states to store
   */
  constructor(capacity: number = 10) {
    this.stateCache = new LRUCache<string, UIState>(capacity);
    this.versionToTimestamp = new Map<string, number>();
  }
  
  /**
   * Add a state to the cache
   * @param state UI state to cache
   */
  addState(state: UIState): void {
    const key = this.getStateKey(state);
    this.stateCache.set(key, state);
    this.versionToTimestamp.set(state.version, state.timestamp);
  }
  
  /**
   * Get a state by version
   * @param version Version to look up
   * @returns UI state or undefined if not found
   */
  getStateByVersion(version: string): UIState | undefined {
    const timestamp = this.versionToTimestamp.get(version);
    if (timestamp === undefined) {
      return undefined;
    }
    
    return this.stateCache.get(this.getStateKeyFromParts(timestamp, version));
  }
  
  /**
   * Get the most recent state
   * @returns Most recent UI state or undefined if cache is empty
   */
  getMostRecentState(): UIState | undefined {
    let mostRecentTimestamp = 0;
    let mostRecentVersion = '';
    
    for (const [version, timestamp] of this.versionToTimestamp.entries()) {
      if (timestamp > mostRecentTimestamp) {
        mostRecentTimestamp = timestamp;
        mostRecentVersion = version;
      }
    }
    
    if (mostRecentVersion) {
      return this.getStateByVersion(mostRecentVersion);
    }
    
    return undefined;
  }
  
  /**
   * Apply a differential update to a cached state
   * @param baseVersion Base version to apply the update to
   * @param update Differential update to apply
   * @returns Updated UI state or undefined if base version not found
   */
  applyUpdate(baseVersion: string, update: DifferentialUpdate): UIState | undefined {
    const baseState = this.getStateByVersion(baseVersion);
    if (!baseState) {
      return undefined;
    }
    
    // Create a deep copy of the base state
    const newState: UIState = JSON.parse(JSON.stringify(baseState));
    
    // Update timestamp and version
    newState.timestamp = update.timestamp;
    newState.version = update.version;
    
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
    
    // Add the updated state to the cache
    this.addState(newState);
    
    return newState;
  }
  
  /**
   * Clear the cache
   */
  clear(): void {
    this.stateCache.clear();
    this.versionToTimestamp.clear();
  }
  
  /**
   * Get the number of states in the cache
   */
  size(): number {
    return this.stateCache.size();
  }
  
  /**
   * Get a unique key for a state
   * @param state UI state
   * @returns Unique key
   */
  private getStateKey(state: UIState): string {
    return this.getStateKeyFromParts(state.timestamp, state.version);
  }
  
  /**
   * Get a unique key from timestamp and version
   * @param timestamp Timestamp
   * @param version Version
   * @returns Unique key
   */
  private getStateKeyFromParts(timestamp: number, version: string): string {
    return `${timestamp}-${version}`;
  }
}

/**
 * Element Cache for storing and retrieving UI elements
 * 
 * This cache stores UI elements and provides methods for retrieving
 * elements by ID or other criteria.
 */
export class ElementCache {
  private elementCache: LRUCache<string, UIElement>;
  
  /**
   * Create a new element cache
   * @param capacity Maximum number of elements to store
   */
  constructor(capacity: number = 1000) {
    this.elementCache = new LRUCache<string, UIElement>(capacity);
  }
  
  /**
   * Add an element to the cache
   * @param element UI element to cache
   */
  addElement(element: UIElement): void {
    this.elementCache.set(element.id, element);
  }
  
  /**
   * Get an element by ID
   * @param id Element ID to look up
   * @returns UI element or undefined if not found
   */
  getElementById(id: string): UIElement | undefined {
    return this.elementCache.get(id);
  }
  
  /**
   * Add multiple elements to the cache
   * @param elements UI elements to cache
   */
  addElements(elements: Record<string, UIElement>): void {
    for (const [id, element] of Object.entries(elements)) {
      this.addElement(element);
    }
  }
  
  /**
   * Remove an element from the cache
   * @param id Element ID to remove
   * @returns Whether the element was removed
   */
  removeElement(id: string): boolean {
    return this.elementCache.delete(id);
  }
  
  /**
   * Clear the cache
   */
  clear(): void {
    this.elementCache.clear();
  }
  
  /**
   * Get the number of elements in the cache
   */
  size(): number {
    return this.elementCache.size();
  }
}