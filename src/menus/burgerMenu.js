import { hsm } from 'src/classes/Chsm';
"use strict";


import { loadHsm } from "src/lib/hsmIo";
import { doPdf, dialogOpen } from "src/lib/toNative";
import { doSaveHsm, doSaveAsHsm } from "src/lib/doSaveHsm";
import SettingsDialog from 'src/components/SettingsDialog.vue';
import { saveUserSettings } from 'src/lib/settingsManager';
import { defaultHsm } from "src/lib/defaultSettings";

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

async function doNewHsm() {
  await hsm.load(defaultHsm);
}

const burgerMenu = {
  anchor: "bottom left",
  self: "top start",
  class: "bg-amber-1 menu-border",
  minWidth: "120px",
  items: [
    {
      label: "File", icon: "mdi-open-in-app",
      menu: {
        anchor: "top end",
        self: "top start",
        class: "bg-amber-1 menu-border",
        minWidth: "140px",
        items: [
          { label: "New HSM", icon: "mdi-open-in-app", click: doNewHsm },
          { label: "Open HSM...", icon: "mdi-rectangle-outline", click: doLoadHsm },
          { label: "Save...", icon: "mdi-content-save-outline", click: doSaveHsm },
          { label: "Save as...", icon: "mdi-content-save-move-outline", click: doSaveAsHsm },
        ],
      },
    },
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
    {
      label: "Settings", icon: "mdi-cog-outline",
      menu: {
        anchor: "top end",
        self: "top start",
        class: "bg-amber-1 menu-border",
        minWidth: "140px",
        items: [
          { label: "Settings", icon: "mdi-cog-outline", click: openSettingsDialog },
          { label: "Save settings as new default", icon: "mdi-content-save-settings-outline", click: saveSettingsAsDefault },

        ],
      },
    },
    { label: "Exit", icon: "mdi-exit-run", click: doExit },
  ],
};

export default burgerMenu;
