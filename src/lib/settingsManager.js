// settingsManager.js
// Handles loading, saving, and resetting user default settings for hsm2

import { hsm } from "src/classes/Chsm";
import { notifyError, notifyOk } from "src/lib/notify";

// Platform-specific config directory
export function getUserConfigDir() {
  const home = window.hsm2Api.getHomeDir ? window.hsm2Api.getHomeDir() : process.env.HOME || process.env.USERPROFILE;
  const platform = window.hsm2Api.getPlatform ? window.hsm2Api.getPlatform() : process.platform;
  if (platform === "win32") return `${home}\\AppData\\Roaming\\hsm2`;
  if (platform === "darwin") return `${home}/Library/Application Support/hsm2`;
  // Linux and fallback
  return `${home}/.config/hsm2`;
}

export function getSettingsFilePath() {
  return getUserConfigDir() + "/settings.json5";
}

export async function loadUserSettings() {
  const filePath = getSettingsFilePath();
  try {
    if (window.hsm2Api.fsExists && await window.hsm2Api.fsExists(filePath)) {
      const json = window.hsm2Api.fsRead(filePath, "utf8");
      return JSON.parse(json);
    }
  } catch (e) {
    notifyError(`Failed to load user settings: ${e}`);
  }
  return null;
}

export async function saveUserSettings(settings) {
  const filePath = getSettingsFilePath();
  try {
    const dir = getUserConfigDir();
    if (window.hsm2Api.fsMkdir && !(await window.hsm2Api.fsExists(dir))) {
      await window.hsm2Api.fsMkdir(dir, { recursive: true });
    }
    await window.hsm2Api.fsWrite(filePath, JSON.stringify(settings, null, 2));
    notifyOk("Settings saved as new default.");
    return true;
  } catch (e) {
    notifyError(`Failed to save user settings: ${e}`);
    return false;
  }
}

export async function resetUserSettings(defaultSettings) {
  return saveUserSettings(defaultSettings);
}
