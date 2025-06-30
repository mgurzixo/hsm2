"use strict";

import { drawCanvas } from "src/lib/canvas";

export let theHsm = {};
export let theCanvas = {};
export let theCanvasBb = {};
export let theCtx = {};
export let theMousePos = {};

export function setHsm(hsm) {
  theHsm = hsm;
}

export function setCanvas(canvasElem) {
  theCanvas = canvasElem;
  theCtx = canvasElem.getContext("2d");
}

export function adjustSizes() {
  const cpe = theCanvas.parentElement;
  theCanvasBb = cpe.getBoundingClientRect();
  const height = window.innerHeight - theCanvasBb.top;
  cpe.style.height = height - 2 + "px";
  const width = window.innerWidth - theCanvasBb.left;
  cpe.style.width = width - 2 + "px";
  // console.log(`[HsmStore.adjustSizes] height:${height}`);
  theCanvas.width = cpe.offsetWidth;
  theCanvas.height = cpe.offsetHeight;
  drawCanvas();
}

export function setMousePos(x, y) {
  theMousePos.x = x;
  theMousePos.y = y;
}
