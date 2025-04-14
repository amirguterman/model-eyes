# ModelEyes UI Capture Chrome Extension

This Chrome extension allows you to capture UI states from web pages and send them to a ModelEyes MCP server. It provides a convenient way to extract structured UI representations for use with AI models.

## Features

- Capture UI states from any web page
- Multiple capture modes: full page, viewport only, or selected element
- Send captured UI states to a ModelEyes MCP server
- Highlight elements on the page for easier identification
- Configure server URL and other settings

## Installation

### Development Installation

1. Clone the ModelEyes repository:
   ```bash
   git clone https://github.com/amirguterman/model-eyes.git
   cd model-eyes
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top right corner

4. Click "Load unpacked" and select the `extensions/chrome` directory from the ModelEyes repository

5. The extension should now be installed and visible in your Chrome toolbar

### Production Installation (Coming Soon)

The extension will be available on the Chrome Web Store in the future.

## Usage

1. Click the ModelEyes icon in your Chrome toolbar to open the extension popup

2. Configure the MCP server URL (default: http://localhost:3000)

3. Select a capture mode:
   - **Full Page**: Captures the entire page structure
   - **Viewport Only**: Captures only elements visible in the current viewport
   - **Selected Element**: Captures the currently selected element and its children

4. Click "Capture UI State" to capture the UI state and send it to the MCP server

5. The extension will display a success message with the number of elements captured, or an error message if something went wrong

## Integration with ModelEyes MCP Server

This extension works with the ModelEyes MCP server, which should be running locally or on a remote server. The server processes the captured UI states and makes them available to AI models through the Model Context Protocol.

To start the MCP server locally:

```bash
npm run start:mcp-server
```

The server will be available at http://localhost:3000 by default.

## Development

### Project Structure

- `manifest.json`: Extension manifest file
- `popup.html`: Extension popup UI
- `popup.js`: Popup UI logic
- `background.js`: Background script for handling communication
- `content.js`: Content script for interacting with web pages

### Building from Source

The extension is written in plain JavaScript and doesn't require a build step. However, if you make changes to the code, you'll need to reload the extension in Chrome:

1. Navigate to `chrome://extensions/`
2. Find the ModelEyes UI Capture extension
3. Click the refresh icon

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.