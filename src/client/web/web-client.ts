import {
  UIState,
  UIElement,
  DifferentialUpdate,
  ActionResult,
  MCPClientConfig
} from '../../common/types';
import { computeDiff, compressState, filterElements } from '../../common/optimization';
import { BaseMCPClient } from '../base-client';

/**
 * MCP client implementation for web browsers
 */
export class WebMCPClient extends BaseMCPClient {
  /** Root element to observe */
  private rootElement: Element | null = null;
  
  /** Mutation observer for tracking DOM changes */
  private mutationObserver: MutationObserver | null = null;
  
  /** Map of element IDs to DOM elements */
  private elementMap: Map<string, Element> = new Map();
  
  /** Counter for generating unique element IDs */
  private idCounter = 0;
  
  /** Previous state for differential updates */
  private previousState: UIState | null = null;
  
  /** Element hash cache for quick comparison */
  private elementHashCache: Map<string, string> = new Map();
  
  /**
   * Platform-specific initialization
   */
  protected async initializePlatform(): Promise<void> {
    if (!this.config) {
      throw new Error('Client not initialized');
    }
    
    // Use document.body as the default root element
    this.rootElement = document.body;
    
    // Initialize mutation observer
    this.initializeMutationObserver();
  }
  
  /**
   * Initialize the mutation observer to track DOM changes
   */
  private initializeMutationObserver(): void {
    if (!this.rootElement) {
      return;
    }
    
    this.mutationObserver = new MutationObserver((mutations) => {
      this.handleDomMutations(mutations);
    });
    
    this.mutationObserver.observe(this.rootElement, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true,
      attributeOldValue: true,
      characterDataOldValue: true
    });
  }
  
  /**
   * Handle DOM mutations and generate differential updates
   * @param mutations List of mutations that occurred
   */
  private handleDomMutations(mutations: MutationRecord[]): void {
    if (!this.currentState) {
      return;
    }
    
    // Capture a new state after the mutations
    this.capturePlatformState().then(newState => {
      // If we don't have a previous state, just update and notify
      if (!this.previousState) {
        this.previousState = this.currentState;
        this.currentState = newState;
        this.lastVersion = newState.version;
        return;
      }
      
      // Use the optimization utility to compute the diff
      const update = computeDiff(this.previousState, newState);
      
      // Only notify if there are actual changes
      if (
        (update.added && Object.keys(update.added).length > 0) ||
        (update.modified && Object.keys(update.modified).length > 0) ||
        (update.removed && update.removed.length > 0) ||
        update.focus !== undefined ||
        update.hover !== undefined
      ) {
        // Apply the update to the current state
        this.applyUpdate(update);
        
        // Notify subscribers
        this.notifySubscribers(update);
        
        // Update version tracking
        this.lastVersion = newState.version;
        this.previousState = this.currentState;
      }
    }).catch(error => {
      console.error('Error capturing state after mutations:', error);
    });
  }
  
  /**
   * Apply a differential update to the current state
   * @param update Update to apply
   */
  private applyUpdate(update: DifferentialUpdate): void {
    if (!this.currentState) {
      return;
    }
    
    // Add new elements
    if (update.added) {
      for (const [id, element] of Object.entries(update.added)) {
        this.currentState.elements[id] = element;
      }
    }
    
    // Modify existing elements
    if (update.modified) {
      for (const [id, changes] of Object.entries(update.modified)) {
        const element = this.currentState.elements[id];
        if (element) {
          Object.assign(element, changes);
        }
      }
    }
    
    // Remove elements
    if (update.removed) {
      for (const id of update.removed) {
        delete this.currentState.elements[id];
      }
    }
    
    // Update focus and hover
    if (update.focus !== undefined) {
      this.currentState.focus = update.focus || undefined;
    }
    
    if (update.hover !== undefined) {
      this.currentState.hover = update.hover || undefined;
    }
    
    // Update version
    this.currentState.version = update.version;
  }
  
  /**
   * Platform-specific state capture
   */
  protected async capturePlatformState(): Promise<UIState> {
    if (!this.rootElement) {
      throw new Error('Root element not available');
    }
    
    // Reset element map if needed
    if (this.config?.optimization?.resetElementMapOnCapture) {
      this.elementMap.clear();
      this.elementHashCache.clear();
    }
    
    // Process the DOM tree
    const elements: Record<string, UIElement> = {};
    this.processElementTree(this.rootElement, elements);
    
    // Get the active element
    const activeElement = document.activeElement;
    const focusId = activeElement ? this.getElementId(activeElement) : undefined;
    
    // Create the UI state
    const state: UIState = {
      timestamp: Date.now(),
      platform: 'web',
      application: navigator.userAgent,
      title: document.title,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      elements,
      focus: focusId,
      version: this.generateVersion()
    };
    
    // Apply filtering if configured
    if (this.config?.filtering) {
      const filterOptions = {
        maxElements: this.config.filtering.maxElements,
        prioritizeInteractable: this.config.filtering.prioritizeInteractable !== false,
        prioritizeVisible: this.config.filtering.prioritizeVisible !== false,
        excludeTypes: this.config.filtering.excludeTypes,
        includeTypes: this.config.filtering.includeTypes
      };
      
      const filteredState = filterElements(state, filterOptions);
      
      // Update the elements map to match filtered elements
      for (const id of Object.keys(state.elements)) {
        if (!filteredState.elements[id]) {
          this.elementMap.delete(id);
        }
      }
      
      state.elements = filteredState.elements;
    }
    
    // Apply compression if configured
    if (this.config?.optimization?.compress) {
      return compressState(state);
    }
    
    return state;
  }
  
  /**
   * Process an element tree and extract UI elements
   * @param element Root element to process
   * @param elements Map to store extracted elements
   * @param depth Current depth in the tree
   * @param parentId ID of the parent element
   */
  private processElementTree(
    element: Element,
    elements: Record<string, UIElement>,
    depth = 0,
    parentId?: string
  ): void {
    // Handle iframes
    if (element.tagName.toLowerCase() === 'iframe') {
      try {
        const iframe = element as HTMLIFrameElement;
        
        // Only process same-origin iframes
        if (this.isSameOrigin(iframe.src)) {
          const iframeDoc = iframe.contentDocument;
          if (iframeDoc && iframeDoc.body) {
            // Process the iframe's document
            const iframeElementData = this.processElement(element, parentId);
            if (iframeElementData) {
              elements[iframeElementData.id] = iframeElementData;
              
              // Process the iframe's content
              this.processElementTree(iframeDoc.body, elements, depth + 1, iframeElementData.id);
            }
            return;
          }
        }
      } catch (error) {
        // Cross-origin iframe access will throw an error
        console.warn('Could not access iframe content:', error);
      }
    }
    // Check depth limit
    const maxDepth = this.config?.filtering?.maxDepth ?? 50;
    if (depth > maxDepth) {
      return;
    }
    
    // Check exclusion selector
    const excludeSelector = this.config?.filtering?.excludeSelector;
    if (excludeSelector && element.matches(excludeSelector)) {
      return;
    }
    
    // Process the element
    const elementData = this.processElement(element, parentId);
    if (!elementData) {
      return;
    }
    
    // Add to the elements map
    elements[elementData.id] = elementData;
    
    // Process children
    const childIds: string[] = [];
    
    for (const child of Array.from(element.children)) {
      this.processElementTree(child, elements, depth + 1, elementData.id);
      
      const childId = this.getElementId(child);
      if (childId) {
        childIds.push(childId);
      }
    }
    
    // Update children array
    if (childIds.length > 0) {
      elementData.children = childIds;
    }
  }
  
  /**
   * Process a single element and extract its properties
   * @param element Element to process
   * @param parentId ID of the parent element
   * @returns Extracted UI element data
   */
  private processElement(element: Element, parentId?: string): UIElement | null {
    // Check if the element should be included
    const includeInvisible = this.config?.filtering?.includeInvisible ?? false;
    if (!includeInvisible) {
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return null;
      }
    }
    
    // Get or generate an ID for the element
    const id = this.getOrCreateElementId(element);
    
    // Get element bounds
    const bounds = element.getBoundingClientRect();
    
    // Extract attributes
    const attributes: Record<string, any> = {};
    for (const attr of Array.from(element.attributes)) {
      attributes[attr.name] = attr.value;
    }
    
    // Extract relevant styles
    const style = window.getComputedStyle(element);
    const styles: Record<string, string> = {
      backgroundColor: style.backgroundColor,
      color: style.color,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      display: style.display,
      visibility: style.visibility,
      position: style.position,
      zIndex: style.zIndex
    };
    
    // Check if the element is interactable
    const interactable = this.isElementInteractable(element);
    
    // Create the UI element
    const uiElement: UIElement = {
      id,
      type: element.tagName.toLowerCase(),
      text: element.textContent || undefined,
      attributes,
      bounds: {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height
      },
      interactable,
      visible: true,
      parent: parentId,
      styles
    };
    
    return uiElement;
  }
  
  /**
   * Get the ID of an element
   * @param element Element to get the ID for
   * @returns Element ID or undefined if not found
   */
  private getElementId(element: Element): string | undefined {
    for (const [id, el] of this.elementMap.entries()) {
      if (el === element) {
        return id;
      }
    }
    
    return undefined;
  }
  
  /**
   * Get or create an ID for an element
   * @param element Element to get or create an ID for
   * @returns Element ID
   */
  private getOrCreateElementId(element: Element): string {
    const existingId = this.getElementId(element);
    if (existingId) {
      return existingId;
    }
    
    // Use the element's ID attribute if available
    if (element.id) {
      const id = `id-${element.id}`;
      this.elementMap.set(id, element);
      return id;
    }
    
    // Generate a new ID
    const id = `el-${this.idCounter++}`;
    this.elementMap.set(id, element);
    return id;
  }
  
  /**
   * Check if an element is interactable
   * @param element Element to check
   * @returns Whether the element is interactable
   */
  private isElementInteractable(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    
    // Check if the element is a common interactive element
    if (
      tagName === 'a' ||
      tagName === 'button' ||
      tagName === 'input' ||
      tagName === 'select' ||
      tagName === 'textarea' ||
      element.hasAttribute('onclick') ||
      element.hasAttribute('role') && (
        element.getAttribute('role') === 'button' ||
        element.getAttribute('role') === 'link' ||
        element.getAttribute('role') === 'menuitem'
      )
    ) {
      // Check if the element is disabled
      if (
        element.hasAttribute('disabled') ||
        element.hasAttribute('aria-disabled') && element.getAttribute('aria-disabled') === 'true'
      ) {
        return false;
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Platform-specific action execution
   */
  protected async executePlatformAction(
    actionType: string,
    element: UIElement,
    data?: any
  ): Promise<ActionResult> {
    // Find the DOM element
    const domElement = this.findDomElementById(element.id);
    if (!domElement) {
      return {
        success: false,
        error: `DOM element with ID ${element.id} not found`
      };
    }
    
    try {
      // Cast to HTMLElement for DOM operations
      const htmlElement = domElement as HTMLElement;
      
      switch (actionType) {
        case 'click':
          htmlElement.click();
          break;
          
        case 'focus':
          htmlElement.focus();
          break;
          
        case 'type':
          if (
            domElement instanceof HTMLInputElement ||
            domElement instanceof HTMLTextAreaElement
          ) {
            domElement.value = data || '';
            
            // Dispatch input and change events
            domElement.dispatchEvent(new Event('input', { bubbles: true }));
            domElement.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            return {
              success: false,
              error: 'Element is not a text input'
            };
          }
          break;
          
        case 'scroll':
          if (data && typeof data === 'object') {
            const { x, y } = data;
            domElement.scrollTo(x || 0, y || 0);
          } else {
            domElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          break;
          
        default:
          return {
            success: false,
            error: `Unsupported action type: ${actionType}`
          };
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Find a DOM element by its ID
   * @param id Element ID to find
   * @returns DOM element or null if not found
   */
  private findDomElementById(id: string): Element | null {
    return this.elementMap.get(id) || null;
  }
  
  /**
   * Platform-specific resource cleanup
   */
  /**
   * Check if a URL is from the same origin as the current page
   * @param url URL to check
   * @returns Whether the URL is from the same origin
   */
  private isSameOrigin(url: string): boolean {
    try {
      const currentOrigin = window.location.origin;
      const urlOrigin = new URL(url, window.location.href).origin;
      return currentOrigin === urlOrigin;
    } catch (error) {
      return false;
    }
  }
  
  protected disposePlatformResources(): void {
    // Disconnect mutation observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    
    // Clear element map
    this.elementMap.clear();
    
    // Reset root element
    this.rootElement = null;
  }
}