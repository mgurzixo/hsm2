// fontUtils.js
// Utility to get system fonts in Electron

const { ipcRenderer } = window.require ? window.require('electron') : {};

export async function getSystemFonts() {
  try {
    const fonts = await window.hsm2Api.getFonts();
    return fonts;
  } catch (e) {
    // fallback
  }
  // If you have a preload script exposing fonts, use that. Otherwise, fallback to a static list.
  if (ipcRenderer && ipcRenderer.invoke) {
    try {
      return await ipcRenderer.invoke('get-system-fonts');
    } catch (e) {
      // fallback
    }
  }
  // Fallback: common fonts
  console.warn(`[fontUtils.getSystemFonts] Can't get system fonts!`);
  return [
    'Arial', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Times New Roman',
    'Georgia', 'Garamond', 'Courier New', 'Brush Script MT',
    'Segoe UI', 'Consolas', 'Monaco', 'Menlo', 'Liberation Mono',
    'SF Mono', 'Fira Mono', 'Ubuntu Mono', 'Comic Sans MS', 'Impact'
  ];
}
