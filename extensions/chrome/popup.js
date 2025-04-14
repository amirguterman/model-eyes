/**
 * ModelEyes UI Capture Extension - Popup Script
 * 
 * This script handles the popup UI interactions and communicates with the background script.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const serverUrlInput = document.getElementById('server-url');
  const captureModeSelect = document.getElementById('capture-mode');
  const captureBtn = document.getElementById('capture-btn');
  const statusDiv = document.getElementById('status');
  
  // Load saved settings
  chrome.storage.sync.get(['serverUrl', 'captureMode'], function(result) {
    if (result.serverUrl) {
      serverUrlInput.value = result.serverUrl;
    }
    if (result.captureMode) {
      captureModeSelect.value = result.captureMode;
    }
  });
  
  // Save settings when changed
  serverUrlInput.addEventListener('change', function() {
    chrome.storage.sync.set({ serverUrl: serverUrlInput.value });
  });
  
  captureModeSelect.addEventListener('change', function() {
    chrome.storage.sync.set({ captureMode: captureModeSelect.value });
  });
  
  // Handle capture button click
  captureBtn.addEventListener('click', function() {
    // Show loading state
    captureBtn.disabled = true;
    captureBtn.textContent = 'Capturing...';
    statusDiv.style.display = 'none';
    
    // Save current settings
    const serverUrl = serverUrlInput.value;
    const captureMode = captureModeSelect.value;
    chrome.storage.sync.set({ serverUrl, captureMode });
    
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      
      // Send message to background script to capture UI state
      chrome.runtime.sendMessage({
        action: 'captureUIState',
        tabId: activeTab.id,
        serverUrl,
        captureMode
      }, function(response) {
        // Reset button state
        captureBtn.disabled = false;
        captureBtn.textContent = 'Capture UI State';
        
        // Show status message
        statusDiv.style.display = 'block';
        
        if (response.success) {
          statusDiv.className = 'status success';
          statusDiv.textContent = `Success! Captured ${response.elementCount} elements.`;
        } else {
          statusDiv.className = 'status error';
          statusDiv.textContent = `Error: ${response.error}`;
        }
      });
    });
  });
});