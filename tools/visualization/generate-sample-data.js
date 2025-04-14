/**
 * Generate sample UI state and update files for testing the visualization tool
 */

const fs = require('fs');
const path = require('path');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'sample-data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate a sample UI state
function generateSampleState() {
  const elements = {};
  
  // Root element (body)
  elements['body'] = {
    id: 'body',
    type: 'body',
    bounds: {
      x: 0,
      y: 0,
      width: 1024,
      height: 768
    },
    interactable: false,
    visible: true,
    children: ['header', 'main', 'footer']
  };
  
  // Header
  elements['header'] = {
    id: 'header',
    type: 'div',
    bounds: {
      x: 0,
      y: 0,
      width: 1024,
      height: 80
    },
    interactable: false,
    visible: true,
    parent: 'body',
    children: ['logo', 'nav']
  };
  
  // Logo
  elements['logo'] = {
    id: 'logo',
    type: 'img',
    text: '',
    bounds: {
      x: 20,
      y: 20,
      width: 100,
      height: 40
    },
    interactable: true,
    visible: true,
    parent: 'header',
    attributes: {
      src: 'logo.png',
      alt: 'Logo'
    }
  };
  
  // Navigation
  elements['nav'] = {
    id: 'nav',
    type: 'nav',
    bounds: {
      x: 200,
      y: 20,
      width: 600,
      height: 40
    },
    interactable: false,
    visible: true,
    parent: 'header',
    children: ['nav-home', 'nav-about', 'nav-contact']
  };
  
  // Nav items
  elements['nav-home'] = {
    id: 'nav-home',
    type: 'a',
    text: 'Home',
    bounds: {
      x: 200,
      y: 20,
      width: 100,
      height: 40
    },
    interactable: true,
    visible: true,
    parent: 'nav',
    attributes: {
      href: '/'
    }
  };
  
  elements['nav-about'] = {
    id: 'nav-about',
    type: 'a',
    text: 'About',
    bounds: {
      x: 300,
      y: 20,
      width: 100,
      height: 40
    },
    interactable: true,
    visible: true,
    parent: 'nav',
    attributes: {
      href: '/about'
    }
  };
  
  elements['nav-contact'] = {
    id: 'nav-contact',
    type: 'a',
    text: 'Contact',
    bounds: {
      x: 400,
      y: 20,
      width: 100,
      height: 40
    },
    interactable: true,
    visible: true,
    parent: 'nav',
    attributes: {
      href: '/contact'
    }
  };
  
  // Main content
  elements['main'] = {
    id: 'main',
    type: 'main',
    bounds: {
      x: 0,
      y: 80,
      width: 1024,
      height: 600
    },
    interactable: false,
    visible: true,
    parent: 'body',
    children: ['heading', 'content', 'form']
  };
  
  // Heading
  elements['heading'] = {
    id: 'heading',
    type: 'h1',
    text: 'Welcome to ModelEyes',
    bounds: {
      x: 20,
      y: 100,
      width: 984,
      height: 40
    },
    interactable: false,
    visible: true,
    parent: 'main'
  };
  
  // Content
  elements['content'] = {
    id: 'content',
    type: 'div',
    text: 'ModelEyes is a Model Context Protocol (MCP) implementation that replaces traditional screenshot-based UI representation with a structured, efficient approach.',
    bounds: {
      x: 20,
      y: 160,
      width: 984,
      height: 100
    },
    interactable: false,
    visible: true,
    parent: 'main'
  };
  
  // Form
  elements['form'] = {
    id: 'form',
    type: 'form',
    bounds: {
      x: 20,
      y: 280,
      width: 600,
      height: 300
    },
    interactable: false,
    visible: true,
    parent: 'main',
    children: ['form-name-label', 'form-name-input', 'form-email-label', 'form-email-input', 'form-submit']
  };
  
  // Form elements
  elements['form-name-label'] = {
    id: 'form-name-label',
    type: 'label',
    text: 'Name:',
    bounds: {
      x: 20,
      y: 280,
      width: 100,
      height: 30
    },
    interactable: false,
    visible: true,
    parent: 'form',
    attributes: {
      for: 'name'
    }
  };
  
  elements['form-name-input'] = {
    id: 'form-name-input',
    type: 'input',
    bounds: {
      x: 130,
      y: 280,
      width: 300,
      height: 30
    },
    interactable: true,
    visible: true,
    parent: 'form',
    attributes: {
      type: 'text',
      name: 'name',
      placeholder: 'Enter your name'
    }
  };
  
  elements['form-email-label'] = {
    id: 'form-email-label',
    type: 'label',
    text: 'Email:',
    bounds: {
      x: 20,
      y: 330,
      width: 100,
      height: 30
    },
    interactable: false,
    visible: true,
    parent: 'form',
    attributes: {
      for: 'email'
    }
  };
  
  elements['form-email-input'] = {
    id: 'form-email-input',
    type: 'input',
    bounds: {
      x: 130,
      y: 330,
      width: 300,
      height: 30
    },
    interactable: true,
    visible: true,
    parent: 'form',
    attributes: {
      type: 'email',
      name: 'email',
      placeholder: 'Enter your email'
    }
  };
  
  elements['form-submit'] = {
    id: 'form-submit',
    type: 'button',
    text: 'Submit',
    bounds: {
      x: 130,
      y: 380,
      width: 100,
      height: 40
    },
    interactable: true,
    visible: true,
    parent: 'form',
    attributes: {
      type: 'submit'
    }
  };
  
  // Footer
  elements['footer'] = {
    id: 'footer',
    type: 'footer',
    text: '© 2025 ModelEyes. All rights reserved.',
    bounds: {
      x: 0,
      y: 680,
      width: 1024,
      height: 88
    },
    interactable: false,
    visible: true,
    parent: 'body'
  };
  
  // Create the UI state
  const state = {
    timestamp: Date.now(),
    platform: 'web',
    application: 'ModelEyes Demo',
    title: 'ModelEyes - Structured UI Representation',
    url: 'https://example.com',
    viewport: {
      width: 1024,
      height: 768
    },
    elements,
    focus: 'form-name-input',
    version: '1.0'
  };
  
  return state;
}

// Generate a sample differential update
function generateSampleUpdate(baseState) {
  // Create a differential update
  const update = {
    timestamp: Date.now(),
    baseVersion: baseState.version,
    version: '1.1',
    
    // Add a new element
    added: {
      'form-message-label': {
        id: 'form-message-label',
        type: 'label',
        text: 'Message:',
        bounds: {
          x: 20,
          y: 380,
          width: 100,
          height: 30
        },
        interactable: false,
        visible: true,
        parent: 'form',
        attributes: {
          for: 'message'
        }
      },
      'form-message-textarea': {
        id: 'form-message-textarea',
        type: 'textarea',
        bounds: {
          x: 130,
          y: 380,
          width: 300,
          height: 100
        },
        interactable: true,
        visible: true,
        parent: 'form',
        attributes: {
          name: 'message',
          placeholder: 'Enter your message'
        }
      }
    },
    
    // Modify existing elements
    modified: {
      'form-submit': {
        bounds: {
          x: 130,
          y: 500,
          width: 100,
          height: 40
        }
      },
      'form': {
        children: ['form-name-label', 'form-name-input', 'form-email-label', 'form-email-input', 'form-message-label', 'form-message-textarea', 'form-submit'],
        bounds: {
          x: 20,
          y: 280,
          width: 600,
          height: 400
        }
      }
    },
    
    // Change focus
    focus: 'form-message-textarea'
  };
  
  return update;
}

// Generate and save the sample data
const state = generateSampleState();
fs.writeFileSync(path.join(outputDir, 'sample-state.json'), JSON.stringify(state, null, 2));
console.log(`Generated sample state: ${path.join(outputDir, 'sample-state.json')}`);

const update = generateSampleUpdate(state);
fs.writeFileSync(path.join(outputDir, 'sample-update.json'), JSON.stringify(update, null, 2));
console.log(`Generated sample update: ${path.join(outputDir, 'sample-update.json')}`);

console.log('Done!');