"use strict";

import { theCanvas, theVp, theSettings, theMouse } from "src/lib/hsmStore";
import { RTX, RTY, setZoom } from "src/lib/canvas";
import { setDragListeners, resetDragListeners } from "src/lib/drag";

import { hsm, canvas, folio } from "src/classes/CHsm";

let mousePos = { x: 0, y: 0 };

// TODO Must throttle all...

function handleWheel(e) {
  // console.log(`[canvasListeners.handleWheel] deltaX:${e.deltaX} deltaY:${e.deltaY} deltaMode:${e.deltaMode}`);
  folio.wheelP(mousePos.x, mousePos.y, e.deltaY);
  // const deltas = -e.deltaY / theSettings.deltaMouseWheel;
  // const scale = theVp.scale + deltas * theSettings.deltaScale;
  // setZoom(RTX(theMouse.xP), RTY(theMouse.yP), scale);
}

export function getXYFromMouseEvent(e) {
  let x = Math.round(e.clientX - canvas.x0);
  let y = Math.round(e.clientY - canvas.y0);
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  return [x, y];
}

export function handleMouseMove(e) {
  // console.log(`[canvasListeners.handleMouseMove] clientX:${e.clientX} clientY:${e.clientY}`);
  const [x, y] = getXYFromMouseEvent(e);
  // console.log(`[canvasListeners.handleMouseMove] x:${x} y:${y} buttons:${e.buttons}`);
  mousePos.x = x;
  mousePos.y = y;
  return;

  // theMouse.xP = x;
  // theMouse.yP = y;
  // if (!theMouse.isDragging && e.buttons & 1) {
  //   const dx = x - theMouse.downXP;
  //   const dy = y - theMouse.downYP;
  //   const d = dx * dx + dy * dy;
  //   // console.log(
  //   //   `[canvasListeners.handleMouseMove] x:${x} y:${y} isDragging:${theMouse.isDragging} buttons:${e.buttons} d:${d}`,
  //   // );
  //   if (d > 5) {
  //     theMouse.isDragging = true;
  //     const event = new CustomEvent("hsmDragStart", {
  //       detail: { downXP: theMouse.downXP, downYP: theMouse.downYP },
  //     });
  //     // console.log(`[canvasListeners.handleMouseMove] Sending hsmDragStart`);
  //     theCanvas.dispatchEvent(event);
  //   }
  // }
  // if (theMouse.isDragging == true) {
  //   const dx = x - theMouse.downXP;
  //   const dy = y - theMouse.downYP;
  //   theMouse.dXP = dx;
  //   theMouse.dYP = dy;
  //   const event = new CustomEvent("hsmDrag", {
  //     detail: { downXP: theMouse.downXP, downYP: theMouse.downYP, dXP: dx, dYP: dy },
  //   });
  //   theCanvas.dispatchEvent(event);
  //   // console.log(
  //   //   `[canvasListeners.handleMouseMove] Dragging:(${theMouse.downXP}, ${theMouse.downYP}) delta:(${dx}, ${dy})`,
  //   // );
  // }
}

export function handleMouseDown(e) {
  const [x, y] = getXYFromMouseEvent(e);
  theMouse.downXP = x;
  theMouse.downYP = y;
  theMouse.clickDown = true;
  console.log(`[canvasListeners.handleMouseDown] x:${x} y:${y}`);
}

export function handleMouseUp(e) {
  const [x, y] = getXYFromMouseEvent(e);
  // console.log(`[canvasListeners.handleMouseUp] x:${x} y:${y} isDragging:${theMouse.isDragging}`);
  if (theMouse.isDragging) {
    const event = new CustomEvent("hsmDragEnd", {
      detail: {
        downXP: theMouse.downXP,
        downYP: theMouse.downYP,
        dXP: x - theMouse.downXP,
        dYP: y - theMouse.downYP,
      },
    });
    // console.log(`[canvasListeners.handleMouseUp] Sending hsmDragEnd`);
    theCanvas.dispatchEvent(event);
    theMouse.isDragging = false;
  } else if (theMouse.clickDown) {
    const event = new CustomEvent("hsmClick", {
      detail: {
        xP: x,
        yP: y,
      },
    });
    console.log(`[canvasListeners.handleMouseUp] Sending hsmClick`);
    theCanvas.dispatchEvent(event);
  }
  theMouse.clickDown = false;
}

export function handleMouseOut(e) {
  // const [x, y] = getXYFromMouseEvent(e);
  // console.log(`[canvasListeners.handleMouseOut] x:${x} y:${y} isDragging:${theMouse.isDragging}`);
  // if (theMouse.isDragging) {
  //   const event = new CustomEvent("hsmDragCancel", {
  //     detail: { downXP: theMouse.downXP, downYP: theMouse.downYP },
  //   });
  //   // console.log(`[canvasListeners.handleMouseUp] Sending hsmDragCancel`);
  //   theCanvas.dispatchEvent(event);
  //   theMouse.isDragging = false;
  //   theMouse.clickDown = false;
  // }
}

export function setCanvasListeners() {
  canvas.addEventListener("wheel", handleWheel);
  canvas.addEventListener("mousemove", handleMouseMove);
  // canvas.addEventListener("mousedown", handleMouseDown);
  // canvas.addEventListener("mouseup", handleMouseUp);
  // canvas.addEventListener("mouseout", handleMouseOut);
  // setDragListeners();
}

export function removeCanvasListeners() {
  canvas.removeEventListener("wheel", handleWheel);
  canvas.removeEventListener("mousemove", handleMouseMove);
  // canvas.removeEventListener("mousedown", handleMouseDown);
  // canvas.removeEventListener("mouseup", handleMouseUp);
  // canvas.removeEventListener("mouseout", handleMouseOut);
  // resetDragListeners();
}
