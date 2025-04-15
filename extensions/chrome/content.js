/**
 * ModelEyes UI Capture Extension - Content Script
 * 
 * This script runs in the context of the web page and can interact with the DOM.
 * It's primarily used for element selection and highlighting.
 */

/**
 * Constants for element filtering
 */
const IMPORTANT_ELEMENT_TYPES = [
  'a', 'button', 'input', 'select', 'textarea', 'img',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'form',
  'table', 'tr', 'td', 'th', 'ul', 'ol', 'li'
];

const GENERIC_CONTAINER_TYPES = [
  'div', 'span', 'section', 'article', 'main', 'header', 'footer'
];

const IMPORTANT_ATTRIBUTES = [
  'id', 'role', 'aria-label', 'title', 'alt', 'name', 'placeholder'
];

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'highlightElement') {
    highlightElement(request.elementId);
    sendResponse({ success: true });
    return true;
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

/**
 * Check if an element is likely to be relevant for browsing
 *
 * @param {Element} element - DOM element to check
 * @returns {boolean} Whether the element is relevant
 */
function isRelevantElement(element) {
  // Skip elements that are not visible
  if (!isElementVisible(element)) {
    return false;
  }
  if (!isElementVisible(element)) {
    return false;
  }
  
  // Skip elements that are too small
  const rect = element.getBoundingClientRect();
  if (rect.width < 5 || rect.height < 5) {
    return false;
  }
  
  // Always include interactable elements
  if (isElementInteractable(element)) {
    return true;
  }
  
  // Include elements with meaningful text content
  const text = element.textContent.trim();
  if (text.length > 1) {
    return true;
  }
  
  // Include elements with important types
  const tagName = element.tagName.toLowerCase();
  if (IMPORTANT_ELEMENT_TYPES.includes(tagName)) {
    return true;
  }
  
  // Skip generic containers without text or interactivity
  if (GENERIC_CONTAINER_TYPES.includes(tagName) &&
      text.length === 0 &&
      !isElementInteractable(element)) {
    return false;
  }
  
  // Include elements with important attributes
  for (const attr of IMPORTANT_ATTRIBUTES) {
    if (element.hasAttribute(attr) && element.getAttribute(attr).trim().length > 0) {
      return true;
    }
  }
  
  // Default to excluding the element
  return false;
}

// Add data attributes to elements for easier selection, but only to relevant ones
function addDataAttributes() {
  // Generate a unique ID for this page
  const pageId = Math.random().toString(36).substring(2, 10);
  
  // Add data attributes only to relevant elements
  const elements = document.querySelectorAll('*');
  let relevantCount = 0;
  let totalCount = 0;
  elements.forEach((element, index) => {
    totalCount++;
    
    // Only add attributes to relevant elements
    if (isRelevantElement(element)) {
      relevantCount++;
      const elementId = `${pageId}-${index}`;
      element.setAttribute('data-modeleyes-id', elementId);
    }
  });
  
  console.log(`ModelEyes: Added data attributes to ${relevantCount} relevant elements out of ${totalCount} total elements (${Math.round((relevantCount/totalCount) * 100)}%)`);
}

// Run when the content script is loaded
addDataAttributes();