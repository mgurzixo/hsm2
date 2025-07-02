"use strict";

import { theCanvas, theFolio, theVp, theSettings, theMouse } from "src/lib/hsmStore";
import { drawCanvas, RTX, RTY, RTL, findObject } from "src/lib/canvas";

let oldFolioRect = {};
function dragFolio(e) {
  if (e.type == "hsmDragStart") {
    Object.assign(oldFolioRect, theFolio.rect);
    return;
  }
  if (e.type == "hsmDrag") {
    theFolio.rect.x0 = oldFolioRect.x0 + RTL(e.detail.dXP);
    theFolio.rect.y0 = oldFolioRect.y0 + RTL(e.detail.dYP);
    // console.log(`[drag.handleHsmDrag]`);
    drawCanvas();
    return;
  }
  if (e.type == "hsmDragEnd") {
    theFolio.rect.x0 = oldFolioRect.x0 + RTL(e.detail.dXP);
    theFolio.rect.y0 = oldFolioRect.y0 + RTL(e.detail.dYP);
    drawCanvas();
    return;
  }
  if (e.type == "hsmDragCancel") {
    Object.assign(theFolio.rect, oldFolioRect);
    drawCanvas();
    return;
  }
}

let dObject;

function handleHsmDragStart(e) {
  // console.log(`[drag.handleHsmDrag]`);
  const x = RTX(e.detail.downXP);
  const y = RTY(e.detail.downYP);
  dObject = findObject(x, y);
  console.log(`[drag.handleHsmDrag] id:${dObject.id}`);
  if (dObject) {
    dObject.drag = {
      dx: 0,
      dy: 0,
      oldRect: {},
    };
    Object.assign(dObject.drag.oldRect, dObject.rect);
  }
}

function handleHsmDrag(e) {
  // console.log(`[drag.handleHsmDragStart] e:${e.type}`);
  if (dObject) {
    dObject.drag.dx = RTL(e.detail.dXP);
    dObject.drag.dy = RTL(e.detail.dYP);
    drawCanvas();
  }
}

function handleHsmDragEnd(e) {
  // console.log(`[drag.handleHsmDragEnd]`);
  if (dObject) {
    delete dObject.drag;
    dObject = undefined;
    drawCanvas();
  }
}

function handleHsmDragCancel(e) {
  // console.log(`[drag.handleHsmDragCancel]`);
  if (dObject) {
    dObject.rect.x0 = dObject.drag.oldRect.x0;
    dObject.rect.y0 = dObject.drag.oldRect.y0;
    delete dObject.drag;
    dObject = undefined;
    drawCanvas();
  }
}

export function setDragListeners() {
  theCanvas.addEventListener("hsmDrag", handleHsmDrag);
  theCanvas.addEventListener("hsmDragStart", handleHsmDragStart);
  theCanvas.addEventListener("hsmDragEnd", handleHsmDragEnd);
  theCanvas.addEventListener("hsmDragCancel", handleHsmDragCancel);
}

export function resetDragListeners() {
  theCanvas.removeEventListener("hsmDrag", handleHsmDrag);
  theCanvas.removeEventListener("hsmDragStart", handleHsmDragStart);
  theCanvas.removeEventListener("hsmDragEnd", handleHsmDragEnd);
  theCanvas.removeEventListener("hsmDragCancel", handleHsmDragCancel);
}
