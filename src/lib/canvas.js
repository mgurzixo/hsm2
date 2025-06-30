"use strict";

import { theHsm, theCanvas, theCtx } from "src/lib/hsmStore";

const inchInMm = 25.4;

let folio;
let scale;
let X0;
let Y0;

function TX(x) {
  return Math.round((x - X0) * scale) + 0.5;
}

function TY(y) {
  return Math.round((y - Y0) * scale) + 0.5;
}

function TL(l) {
  return Math.round(l * scale);
}

function Trect(rect) {
  return `(${TX(rect.x0)}, ${TY(rect.y0)}) [${TL(rect.width)},${TL(rect.height)}]}`;
}

function drawFolioBackground() {
  theCtx.fillStyle = "#ccc";
  theCtx.beginPath();
  theCtx.rect(0, 0, theCanvas.width, theCanvas.height);
  theCtx.fill();
  // Folio

  theCtx.fillStyle = "#fff";
  theCtx.beginPath();
  // console.log(`[theCanvas.drawFolioBackground] folio:${Trect(folio.rect)}`);
  theCtx.rect(TX(folio.rect.x0), TY(folio.rect.y0), TL(folio.rect.width), TL(folio.rect.height));
  theCtx.fill();
}

export function drawCanvas() {
  if (!theHsm.state) return;
  // console.log(`[theCanvas.drawtheCanvas] theHsm:${JSON.stringify(theHsm)}`);
  const folioId = theHsm.state.folio;
  // console.log(`[theCanvas.drawtheCanvas] folioId:${folioId}`);
  folio = theHsm.folios[theHsm.state.folio];
  scale = theHsm.state.scale * (theHsm.settings.screenDpi / inchInMm);
  X0 = theHsm.state.x0;
  Y0 = theHsm.state.y0;
  drawFolioBackground();
}
