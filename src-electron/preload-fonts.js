// preload-fonts.js
// Electron preload script to expose system fonts to renderer
const { contextBridge, ipcRenderer } = require('electron');
const fontScanner = require('font-scanner');

contextBridge.exposeInMainWorld('fontAPI', {
  getFonts: async () => {
    try {
      // font-scanner returns an array of font objects with family, style, etc.
      const fonts = fontScanner.getAvailableFontsSync();
      // Return unique family names, sorted
      const families = Array.from(new Set(fonts.map(f => f.family))).sort();
      console.log(`[preload] families:${families}`);
      return families;
    } catch (e) {
      return [];
    }
  }
});

// Limitations:
// - Requires 'font-scanner' npm package (native, cross-platform, but may need build tools)
// - On Linux, may miss some fonts if not in standard font directories
// - On Windows/Mac, should list all user/system fonts
// - Must be loaded as the preload script in Electron's BrowserWindow
