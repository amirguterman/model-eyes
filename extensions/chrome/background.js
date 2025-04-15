/**
 * ModelEyes UI Capture Extension - Background Script
 * 
 * This script runs in the background and handles communication between the popup and content scripts.
 * It also manages the connection to the MCP server.
 */

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'captureUIState') {
    captureUIState(request.tabId, request.serverUrl, request.captureMode)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});

/**
 * Capture UI state from a tab and send it to the MCP server
 * 
 * @param {number} tabId - ID of the tab to capture
 * @param {string} serverUrl - URL of the MCP server
 * @param {string} captureMode - Capture mode (full, viewport, element)
 * @returns {Promise<object>} - Result of the capture operation
 */
async function captureUIState(tabId, serverUrl, captureMode) {
  try {
    // Execute content script to capture UI state
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      function: captureUIStateInPage,
      args: [captureMode]
    });
    
    // Get the result from the content script
    const uiState = result[0].result;
    
    // Send the UI state to the MCP server
    const response = await sendToMCPServer(serverUrl, uiState);
    
    return {
      success: true,
      elementCount: Object.keys(uiState.elements).length,
      serverResponse: response
    };
  } catch (error) {
    console.error('Error capturing UI state:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send UI state to the MCP server
 * 
 * @param {string} serverUrl - URL of the MCP server
 * @param {object} uiState - UI state to send
 * @returns {Promise<object>} - Server response
 */
/**
 * Filter UI state to only include relevant elements for browsing
 *
 * @param {object} uiState - The original UI state
 * @returns {object} A filtered UI state with only relevant elements
 */
function filterRelevantElements(uiState) {
  // Create a deep copy of the state
  const filteredState = {
    ...uiState,
    elements: {}
  };
  
  // Get all elements
  const elements = uiState.elements;
  
  // Filter elements based on relevance criteria
  const relevantElements = {};
  
  for (const [id, element] of Object.entries(elements)) {
    // Skip elements without bounds (not visible)
    if (!element.bounds ||
        element.bounds.width === 0 ||
        element.bounds.height === 0) {
      continue;
    }
    
    // Skip elements that are too small (likely decorative)
    if (element.bounds.width < 5 || element.bounds.height < 5) {
      continue;
    }
    
    // Always include interactable elements
    if (element.interactable) {
      relevantElements[id] = element;
      continue;
    }
    
    // Include elements with meaningful text content
    if (element.text && element.text.trim().length > 0) {
      // Skip elements with very short text that aren't likely meaningful
      if (element.text.trim().length > 1) {
        relevantElements[id] = element;
        continue;
      }
    }
    
    // Include elements with specific types that are usually important
    const importantTypes = ['a', 'button', 'input', 'select', 'textarea', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'form'];
    if (importantTypes.includes(element.type)) {
      relevantElements[id] = element;
      continue;
    }
    
    // Skip generic containers without text or interactivity
    if (['div', 'span', 'section', 'article'].includes(element.type) &&
        (!element.text || element.text.trim().length === 0) &&
        !element.interactable) {
      continue;
    }
    
    // Include elements with specific attributes that indicate importance
    if (element.attributes) {
      const importantAttributes = ['id', 'role', 'aria-label', 'title', 'alt'];
      for (const attr of importantAttributes) {
        if (element.attributes[attr] && element.attributes[attr].trim().length > 0) {
          relevantElements[id] = element;
          break;
        }
      }
    }
  }
  
  // Update the filtered state
  filteredState.elements = relevantElements;
  
  return filteredState;
}

async function sendToMCPServer(serverUrl, uiState) {
  try {
    // Filter the UI state to only include relevant elements
    const filteredState = filterRelevantElements(uiState);
    
    // Log the reduction in elements
    const originalCount = Object.keys(uiState.elements).length;
    const filteredCount = Object.keys(filteredState.elements).length;
    console.log(`Filtered UI state: ${filteredCount} elements (reduced from ${originalCount}, ${Math.round((1 - filteredCount/originalCount) * 100)}% reduction)`);
    const response = await fetch(`${serverUrl}/api/ui-state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filteredState)
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending UI state to MCP server:', error);
    throw error;
  }
}

/**
 * Function to be injected into the page to capture UI state
 * 
 * @param {string} captureMode - Capture mode (full, viewport, element)
 * @returns {object} - Captured UI state
 */
function captureUIStateInPage(captureMode) {
  // Create a unique ID for elements
  function generateElementId() {
    return 'e' + Math.random().toString(36).substring(2, 10);
  }
  
  // Check if an element is visible
  function isElementVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 &&
           element.offsetHeight > 0;
  }
  
  // Check if an element is interactable
  function isElementInteractable(element) {
    const tagName = element.tagName.toLowerCase();
    const interactableTags = ['a', 'button', 'input', 'select', 'textarea'];
    
    if (interactableTags.includes(tagName)) {
      return true;
    }
    
    if (element.getAttribute('role') === 'button') {
      return true;
    }
    
    if (element.onclick || element.addEventListener) {
      return true;
    }
    
    return false;
  }
  
  // Get element bounds
  function getElementBounds(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  }
  
  // Extract text content from an element
  function getElementText(element) {
    // For input elements, use the value
    if (element.tagName.toLowerCase() === 'input' || 
        element.tagName.toLowerCase() === 'textarea') {
      return element.value;
    }
    
    // For other elements, use textContent
    return element.textContent.trim();
  }
  
  // Process an element and its children
  function processElement(element, parentId = null, depth = 0) {
    // Skip script, style, and other non-visible elements
    const tagName = element.tagName.toLowerCase();
    if (['script', 'style', 'meta', 'link', 'noscript'].includes(tagName)) {
      return {};
    }
    
    // Skip elements that are not visible
    if (!isElementVisible(element)) {
      return {};
    }
    
    // Skip elements that are too deep
    if (depth > 20) {
      return {};
    }
    
    // Generate an ID for this element
    const id = generateElementId();
    
    // Create the element object
    const elementObj = {
      id,
      type: tagName,
      bounds: getElementBounds(element),
      interactable: isElementInteractable(element),
      visible: true
    };
    
    // Add parent reference if available
    if (parentId) {
      elementObj.parent = parentId;
    }
    
    // Add text content if available
    const text = getElementText(element);
    if (text) {
      elementObj.text = text;
    }
    
    // Process children
    const childElements = {};
    const childIds = [];
    
    for (let i = 0; i < element.children.length; i++) {
      const childElement = element.children[i];
      const childResult = processElement(childElement, id, depth + 1);
      
      // Add child elements to the result
      Object.assign(childElements, childResult.elements);
      
      // Add child ID to the parent's children array
      if (childResult.rootId) {
        childIds.push(childResult.rootId);
      }
    }
    
    // Add children array if there are children
    if (childIds.length > 0) {
      elementObj.children = childIds;
    }
    
    // Create the result object
    const result = {
      elements: {
        [id]: elementObj
      },
      rootId: id
    };
    
    // Add child elements to the result
    Object.assign(result.elements, childElements);
    
    return result;
  }
  
  // Get the root element based on capture mode
  let rootElement;
  
  if (captureMode === 'viewport') {
    // Create a virtual element that contains all elements in the viewport
    rootElement = document.body;
  } else if (captureMode === 'element') {
    // Use the currently selected element
    rootElement = document.activeElement || document.body;
  } else {
    // Default to full page
    rootElement = document.documentElement;
  }
  
  // Process the root element
  const result = processElement(rootElement);
  
  // Create the UI state object
  const uiState = {
    timestamp: Date.now(),
    platform: 'web',
    application: 'Chrome',
    title: document.title,
    url: window.location.href,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    elements: result.elements,
    version: '1.0'
  };
  
  // Add focus information if available
  if (document.activeElement && document.activeElement !== document.body) {
    for (const [id, element] of Object.entries(uiState.elements)) {
      if (element.type === document.activeElement.tagName.toLowerCase()) {
        // This is a simple heuristic - in a real implementation, we would need
        // to check if this is actually the active element
        uiState.focus = id;
        break;
      }
    }
  }
  
  return uiState;
}