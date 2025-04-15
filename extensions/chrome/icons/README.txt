# Icon Files

This directory is for extension icon files.

Note: The current version of the extension doesn't require icons as they've been removed from the manifest.json file to simplify development.

If you want to add icons, create the following files:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)
- icon128.png (128x128 pixels)

Then update the manifest.json file to include them:

```json
"action": {
  "default_popup": "popup.html",
  "default_icon": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
},
```

And add the icons section:

```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

You can create these icons using any image editor, or generate them from a logo using online tools.