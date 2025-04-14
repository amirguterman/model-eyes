/**
 * ModelEyes UI Capture Extension - Content Script
 * 
 * This script runs in the context of the web page and can interact with the DOM.
 * It's primarily used for element selection and highlighting.
 */

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'highlightElement') {
    highlightElement(request.elementId);
    sendResponse({ success: true });
    return true;
  }
});

/**
 * Highlight an element on the page
 * 
 * @param {string} elementId - ID of the element to highlight
 */
function highlightElement(elementId) {
  // Remove any existing highlights
  const existingHighlights = document.querySelectorAll('.modeleyes-highlight');
  existingHighlights.forEach(el => el.remove());
  
  // Find the element
  const element = document.querySelector(`[data-modeleyes-id="${elementId}"]`);
  if (!element) {
    console.warn(`Element with ID ${elementId} not found`);
    return;
  }
  
  // Create a highlight overlay
  const rect = element.getBoundingClientRect();
  const highlight = document.createElement('div');
  highlight.className = 'modeleyes-highlight';
  highlight.style.position = 'absolute';
  highlight.style.left = `${rect.left + window.scrollX}px`;
  highlight.style.top = `${rect.top + window.scrollY}px`;
  highlight.style.width = `${rect.width}px`;
  highlight.style.height = `${rect.height}px`;
  highlight.style.border = '2px solid #4a6ee0';
  highlight.style.backgroundColor = 'rgba(74, 110, 224, 0.2)';
  highlight.style.zIndex = '9999';
  highlight.style.pointerEvents = 'none';
  
  // Add the highlight to the page
  document.body.appendChild(highlight);
  
  // Remove the highlight after 3 seconds
  setTimeout(() => {
    highlight.remove();
  }, 3000);
}

// Add data attributes to elements for easier selection
function addDataAttributes() {
  // Generate a unique ID for this page
  const pageId = Math.random().toString(36).substring(2, 10);
  
  // Add data attributes to all elements
  const elements = document.querySelectorAll('*');
  elements.forEach((element, index) => {
    const elementId = `${pageId}-${index}`;
    element.setAttribute('data-modeleyes-id', elementId);
  });
}

// Run when the content script is loaded
addDataAttributes();