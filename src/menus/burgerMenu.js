import { hsm } from 'src/classes/Chsm';
"use strict";


import { loadHsm } from "src/lib/hsmIo";
import { doPdf, dialogOpen } from "src/lib/toNative";
import { doSaveHsm, doSaveAsHsm } from "src/lib/doSaveHsm";
import SettingsDialog from 'src/components/SettingsDialog.vue';
import { saveUserSettings } from 'src/lib/settingsManager';

function doExit() {
  window.close();
}

async function doLoadHsm() {
  const filePath = await dialogOpen({
    properties: ['openFile'],
    filters: [
      { name: 'HSM', extensions: ['hsm2', 'json', 'json5', 'json5'] }
    ]
  });
  // console.log(`[burgerMenu.doLoadHsm] filePath:${filePath}`);
  if (filePath) await loadHsm(filePath);
}

function openSettingsDialog() {
  if (window.openSettingsDialog) {
    window.openSettingsDialog();
  } else {
    console.warn('Settings dialog not implemented for this UI context.');
  }
}

async function saveSettingsAsDefault() {
  await saveUserSettings(hsm.settings);
}

const burgerMenu = {
  anchor: "bottom left",
  self: "top start",
  class: "bg-amber-1 menu-border",
  minWidth: "120px",
  items: [
    { label: "Open...", icon: "mdi-open-in-app", click: doLoadHsm },
    { label: "Save...", icon: "mdi-content-save-outline", click: doSaveHsm },
    { label: "Save as...", icon: "mdi-content-save-move-outline", click: doSaveAsHsm },
    { label: "Settings", icon: "mdi-cog-outline", click: openSettingsDialog },
    { label: "Save settings as new default", icon: "mdi-content-save-settings-outline", click: saveSettingsAsDefault },
    { label: "-" },
    {
      label: "New",
      icon: "mdi-plus",
      menu: {
        anchor: "top end",
        self: "top start",
        class: "bg-amber-1 menu-border",
        minWidth: "140px",
        items: [
          { label: "State", icon: "mdi-rectangle-outline" },
          { label: "Transition", icon: "mdi-arrow-top-right" },
        ],
      },
    },
    { label: "-" },
    { label: "Exit", icon: "mdi-exit-run", click: doExit },
  ],
};

export default burgerMenu;
