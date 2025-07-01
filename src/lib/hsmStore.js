"use strict";

import { drawCanvas, RTX, RTY } from "src/lib/canvas";

const inchInMm = 25.4;

export let theHsm = {};
export let theCanvas = {};
export let theCanvasBb = {};
export let theCtx = {};
export let theMousePos = {};
export let theFolio = {};
export let theScalePhy = {};
export let theSettings = {};
export let theVp = {
  x0Mm: 0,
  y0Mm: 0,
  scale: 1,
};

export function setSettings(settings) {
  if (settings) theHsm.settings = settings;
  theSettings = theHsm.settings;
}

export function setCanvas(canvasElem) {
  theCanvas = canvasElem;
  theCtx = canvasElem.getContext("2d");
}

export function setFolioScale(scale) {
  if (scale) theFolio.vp.scale = scale;
  theVp.scale = theFolio.vp.scale;
  theScalePhy = theVp.scale * (theHsm.settings.screenDpi / inchInMm);
  // console.log(`[HsmStore.setFolioScale] theVp.scale:${theVp.scale} theScalePhy:${theScalePhy}`);
}

export function setFolioOffsetMm(x0, y0) {
  // console.log(`[HsmStore.setFolioOffsetMm] oldOx:${theVp.x0} newOx:${x0}`);
  if (x0 != undefined) theFolio.vp.x0 = x0;
  if (y0 != undefined) theFolio.vp.y0 = y0;
  theVp.x0 = theFolio.vp.x0;
  theVp.y0 = theFolio.vp.y0;
}

export function setFolio(folioId) {
  if (folioId) theHsm.state.folio = folioId;
  theFolio = theHsm.folios[theHsm.state.folio];
  setFolioScale();
  setFolioOffsetMm();
}

export function setHsm(hsm) {
  theHsm = hsm;
  setFolio();
  setSettings();
}

export function adjustSizes() {
  const cpe = theCanvas.parentElement;
  theCanvasBb = cpe.getBoundingClientRect();
  const height = window.innerHeight - theCanvasBb.top;
  cpe.style.height = height - 0 + "px";
  const width = window.innerWidth - theCanvasBb.left;
  cpe.style.width = width - 0 + "px";
  // console.log(`[HsmStore.adjustSizes] height:${height}`);
  theCanvas.width = cpe.offsetWidth;
  theCanvas.height = cpe.offsetHeight;
  drawCanvas();
}

export function setMousePos(xP, yP) {
  theMousePos.xMm = RTX(xP);
  theMousePos.yMm = RTY(yP);
  theMousePos.xP = xP;
  theMousePos.yP = yP;
  // console.log(
  //   `[HsmStore.setMousePos] (${xP.toFixed()}, ${yP.toFixed()}) posMm:(${theMousePos.xMm.toFixed()}, ${theMousePos.yMm.toFixed()})`,
  // );
}
