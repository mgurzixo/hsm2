# Font Scanner Integration for Electron

## How it works

- The preload script `preload-fonts.js` uses the `font-scanner` npm package to enumerate system fonts.
- It exposes a `fontAPI.getFonts()` method to the renderer via Electron's `contextBridge`.
- This works on Linux, Windows, and Mac, but may require build tools for native modules.

## Integration Steps

1. Install the `font-scanner` package in your Electron app:
   ```sh
   npm install font-scanner
   # or
   yarn add font-scanner
   ```
2. In `electron-main.js`, set the preload script for your main window:
   ```js
   preload: path.resolve(currentDir, 'preload-fonts.js'),
   ```
   (You may need to merge this with your existing preload script logic.)
3. In your renderer code, access fonts via:
   ```js
   window.fontAPI.getFonts().then(fonts => { ... });
   ```

## Limitations

- On Linux, only fonts in standard directories are found.
- On Windows/Mac, all user/system fonts should be listed.
- The `font-scanner` package is a native module and may require build tools (Python, C++ compiler) to install.
- If you use multiple preload scripts, you must merge them or chain their logic.

## Security

- Only exposes font family names, not file paths or other sensitive info.
- Uses Electron's contextBridge for safe API exposure.
