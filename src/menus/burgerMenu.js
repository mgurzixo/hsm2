"use strict";

import { loadHsm, saveHsm } from "src/lib/hsmIo";
import { hsm } from "src/classes/Chsm";

function doExit() {
  window.close();
}

async function doLoadHsm() {
  await loadHsm();
  hsm.draw();
}

const burgerMenu = {
  anchor: "bottom left",
  self: "top start",
  class: "bg-amber-1 menu-border",
  minWidth: "120px",
  items: [
    { label: "Open...", icon: "mdi-open-in-app", click: doLoadHsm },
    { label: "Save...", icon: "mdi-content-save-outline" },
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
