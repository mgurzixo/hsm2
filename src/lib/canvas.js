"use strict";

import {
  theHsm,
  theCanvas,
  theCtx,
  theScalePhy,
  theFolio,
  theVp,
  setFolioScale,
  setFolioOffsetMm,
} from "src/lib/hsmStore";

let stateRadiusP;

export function TX(xMm) {
  return Math.round((xMm - theVp.x0) * theScalePhy) + 0.5;
}

export function TY(yMm) {
  return Math.round((yMm - theVp.y0) * theScalePhy) + 0.5;
}

export function TL(lMm) {
  return Math.round(lMm * theScalePhy);
}

export function RTX(xP) {
  return xP / theScalePhy + theVp.x0;
}

export function RTY(yP) {
  return yP / theScalePhy + theVp.y0;
}

export function RTL(lP) {
  return lP / theScalePhy;
}

function Trect(rect) {
  return `(${TX(rect.x0)}, ${TY(rect.y0)}) [${TL(rect.width)},${TL(rect.height)}]}`;
}

function PathRoundedRectP(px, py, pwidth, pheight, pradius) {
  theCtx.beginPath();
  theCtx.moveTo(px + pradius, py);
  theCtx.lineTo(px + pwidth - pradius, py);
  theCtx.quadraticCurveTo(px + pwidth, py, px + pwidth, py + pradius);
  theCtx.lineTo(px + pwidth, py + pheight - pradius);
  theCtx.quadraticCurveTo(px + pwidth, py + pheight, px + pwidth - pradius, py + pheight);
  theCtx.lineTo(px + pradius, py + pheight);
  theCtx.quadraticCurveTo(px, py + pheight, px, py + pheight - pradius);
  theCtx.lineTo(px, py + pradius);
  theCtx.quadraticCurveTo(px, py, px + pradius, py);
  theCtx.closePath();
}

function drawState(state) {
  // console.log(`[canvas.drawState] State:${state.name}`);
  const x0 = TX(theFolio.rect.x0 + state.rect.x0);
  const y0 = TY(theFolio.rect.y0 + state.rect.y0);
  const width = TL(state.rect.width);
  const height = TL(state.rect.height);
  // console.log(`[canvas.drawState] x0:${theFolio.rect.x0 + state.rect.x0} x0P:${x0}`);
  theCtx.fillStyle = "#fff";
  theCtx.strokeStyle = "#000";
  // theCtx.rect(x0, y0, width, height);
  PathRoundedRectP(x0, y0, width, height, stateRadiusP);

  theCtx.fill();
  theCtx.stroke();
}

function drawCanvasBackground() {
  // Clear canvas
  theCtx.fillStyle = "#ccc";
  theCtx.beginPath();
  theCtx.rect(0, 0, theCanvas.width, theCanvas.height);
  theCtx.fill();
}

function drawFolio(folio) {
  theCtx.fillStyle = "#fff";
  theCtx.beginPath();
  // console.log(`[canvas.drawFolio] folio:${Trect(theFolio.rect)}`);
  theCtx.rect(TX(folio.rect.x0), TY(folio.rect.y0), TL(folio.rect.width), TL(folio.rect.height));
  theCtx.fill();
}

export function drawCanvas() {
  if (!theHsm.state) return;
  // console.log(`[canvas.drawCanvas] theHsm:${JSON.stringify(theHsm)}`);
  drawCanvasBackground();
  if (!theFolio.rect) return;
  // console.log(`[canvas.drawCanvas] folioName:${theFolio.name}`);
  drawFolio(theFolio);
  stateRadiusP = TL(theHsm.settings.stateRadiusMm);
  for (let stateId of Object.keys(theFolio.states)) {
    const state = theFolio.states[stateId];
    // console.log(`[canvas.drawCanvas] State:${state.name}`);
    drawState(state);
  }
}

export function setZoom(x, y, scale) {
  const oldScale = theVp.scale;
  // console.log(
  //   `[HsmCanvas.handleWheel] oldScale:${theVp.scale.toFixed(2)} newScale:${scale.toFixed(2)}`,
  // );
  // Restrict scale
  scale = Math.min(Math.max(0.1, scale), 10);
  // scale = 2;
  const rScale = scale / oldScale;
  const x0Mm = (theVp.x0 + (rScale - 1) * x) / rScale;
  const y0Mm = (theVp.y0 + (rScale - 1) * y) / rScale;
  setFolioScale(scale);
  setFolioOffsetMm(x0Mm, y0Mm);
  drawCanvas();
}
