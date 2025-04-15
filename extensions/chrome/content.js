/**
 * Content script for the ModelEyes Chrome extension
 * This script captures the UI state of the current page and sends it to the server
 */

// Configuration
const config = {
  serverUrl: 'http://localhost:3000',
  captureDelay: 500,
  debug: true
};

// Store the server URL from local storage
chrome.storage.local.get(['serverUrl'], function(result) {
  if (result.serverUrl) {
    config.serverUrl = result.serverUrl;
  }
});

/**
 * Check if an element is visible
 * 
 * @param {Element} element - DOM element to check
 * @returns {boolean} Whether the element is visible
 */
function isElementVisible(element) {
  // Check if element has zero dimensions
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }
  
  // Check if element has display: none or visibility: hidden
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }
  
  // Check if element has hidden attribute
  if (element.hasAttribute('hidden') || element.getAttribute('aria-hidden') === 'true') {
    return false;
  }
  
  // Check if element is outside the viewport (completely offscreen)
  if (rect.right < 0 || rect.bottom < 0 || 
      rect.left > window.innerWidth || rect.top > window.innerHeight) {
    return false;
  }
  
  return true;
}

/**
 * Check if an element is relevant for capturing
 * 
 * @param {Element} element - DOM element to check
 * @returns {boolean} Whether the element is relevant
 */
function isElementRelevant(element) {
  // Skip invisible elements
  if (!isElementVisible(element)) {
    return false;
  }
  
  // Skip script, style, and other non-visible elements
  const tagName = element.tagName.toLowerCase();
  if (['script', 'style', 'meta', 'link', 'noscript'].includes(tagName)) {
    return false;
  }
  
  // Skip tiny elements (likely decorative)
  const rect = element.getBoundingClientRect();
  if (rect.width < 5 || rect.height < 5) {
    return false;
  }
  
  // Check if element is interactable
  const interactableTags = ['a', 'button', 'input', 'select', 'textarea', 'label'];
  if (interactableTags.includes(tagName)) {
    return true;
  }
  
  // Check if element has click handlers
  if (element.onclick || element.getAttribute('onclick') || 
      element.addEventListener && element._listeners && element._listeners.click) {
    return true;
  }
  
  // Check if element has role attribute
  if (element.getAttribute('role')) {
    return true;
  }
  
  // Check if element has text content
  if (element.textContent && element.textContent.trim().length > 0) {
    return true;
  }
  
  // Skip elements without children (likely decorative)
  if (element.children.length === 0 && !element.textContent.trim()) {
    return false;
  }
  
  return true;
}

/**
 * Capture the UI state of the current page
 * 
 * @returns {Object} The UI state
 */
function captureUIState() {
  const elements = {};
  const idCounter = { value: 0 };
  
  // Capture the document element
  captureElement(document.documentElement, null, elements, idCounter);
  
  return {
    url: window.location.href,
    title: document.title,
    timestamp: Date.now(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    elements: elements
  };
}

/**
 * Recursively capture an element and its children
 * 
 * @param {Element} element - DOM element to capture
 * @param {string|null} parentId - ID of the parent element
 * @param {Object} elements - Object to store captured elements
 * @param {Object} idCounter - Counter for generating unique IDs
 * @returns {string|null} ID of the captured element, or null if skipped
 */
function captureElement(element, parentId, elements, idCounter) {
  // Skip irrelevant elements
  if (!isElementRelevant(element)) {
    return null;
  }
  
  // Generate a unique ID for the element
  const id = `e${idCounter.value++}`;
  
  // Get element bounds
  const rect = element.getBoundingClientRect();
  
  // Get element attributes
  const attributes = {};
  for (const attr of element.attributes) {
    attributes[attr.name] = attr.value;
  }
  
  // Check if element is interactable
  const interactable = isElementInteractable(element);
  
  // Capture the element's HTML
  const outerHTML = element.outerHTML;
  
  // Store the element
  elements[id] = {
    id: id,
    parentId: parentId,
    type: element.tagName.toLowerCase(),
    text: element.textContent.trim(),
    bounds: {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height
    },
    attributes: attributes,
    interactable: interactable,
    html: outerHTML
  };
  
  // Recursively capture children
  for (const child of element.children) {
    captureElement(child, id, elements, idCounter);
  }
  
  return id;
}

/**
 * Check if an element is interactable
 * 
 * @param {Element} element - DOM element to check
 * @returns {boolean} Whether the element is interactable
 */
function isElementInteractable(element) {
  const tagName = element.tagName.toLowerCase();
  
  // Check if element is a common interactive element
  if (['a', 'button', 'input', 'select', 'textarea'].includes(tagName)) {
    return true;
  }
  
  // Check if element has click handlers
  if (element.onclick || element.getAttribute('onclick')) {
    return true;
  }
  
  // Check if element has role attribute indicating interactivity
  const role = element.getAttribute('role');
  if (role && ['button', 'link', 'checkbox', 'radio', 'menuitem', 'tab'].includes(role)) {
    return true;
  }
  
  // Check for cursor style indicating interactivity
  const style = window.getComputedStyle(element);
  if (style.cursor === 'pointer') {
    return true;
  }
  
  return false;
}

/**
 * Send the UI state to the server
 * 
 * @param {Object} uiState - The UI state to send
 * @returns {Promise} Promise that resolves when the state is sent
 */
async function sendUIState(uiState) {
  try {
    const response = await fetch(`${config.serverUrl}/api/ui-state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(uiState)
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending UI state:', error);
    throw error;
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureUIState') {
    // Delay capture to allow any animations to complete
    setTimeout(() => {
      try {
        const uiState = captureUIState();
        
        if (config.debug) {
          console.log('Captured UI state:', uiState);
        }
        
        sendUIState(uiState)
          .then(response => {
            sendResponse({ success: true, message: response.message });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      } catch (error) {
        console.error('Error capturing UI state:', error);
        sendResponse({ success: false, error: error.message });
      }
    }, config.captureDelay);
    
    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }
});

// Log that the content script has loaded
console.log('ModelEyes content script loaded');