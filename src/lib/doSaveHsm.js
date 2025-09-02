import { hsm } from "src/classes/Chsm";
import { writeHsm } from "src/lib/hsmIo";
import { dialogOpen } from "src/lib/toNative";
import { notifyOk, notifyError } from "src/lib/notify";

// Save As: prompt for file, check overwrite, then save
export async function doSaveAsHsm() {
  let defaultPath = hsm.status.currentDirectory ? hsm.status.currentDirectory + '/' : undefined;
  let filePath = await dialogOpen({
    promptToCreate: true,
    filters: [
      { name: 'json', extensions: ['json'] },
      { name: 'hsm2', extensions: ['hsm2'] },
      { name: 'json5', extensions: ['json5'] }
    ],
    defaultPath
  });
  if (!filePath) return;
  // Check if file exists (simple check, can be improved)
  if (window.hsm2Api.fsExists && await window.hsm2Api.fsExists(filePath)) {
    if (!window.confirm(`File ${filePath} exists. Overwrite?`)) return;
  }
  const data = hsm.serialise(); // Serialize the HSM data
  // Add default extension if missing
  if (!/\.(json5|hsm2|json)$/i.test(filePath)) filePath += '.hsm2';
  if (writeHsm(filePath, data)) {
    hsm.status.filePath = filePath;
    notifyOk(`Saved to ${filePath}`);
  } else {
    notifyError(`Failed to save to ${filePath}`);
  }
}

// Save: if no filePath, fallback to Save As
export async function doSaveHsm() {
  let filePath = hsm.status.filePath;
  if (!filePath) {
    await doSaveAsHsm();
    return;
  }
  const data = hsm.serialise();
  if (writeHsm(filePath, data)) {
    notifyOk(`Saved to ${filePath}`);
  } else {
    notifyError(`Failed to save to ${filePath}`);
  }
}
