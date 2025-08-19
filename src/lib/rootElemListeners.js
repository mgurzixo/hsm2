"use strict";

import * as U from "src/lib/utils";
import * as V from "vue";
import { hsm, hCtx } from "src/classes/Chsm";

export let mousePos = V.ref({ xP: 0, yP: 0, x: 0, y: 0, buttons: 0 });
let mouseDown = { x: 0, y: 0 };
let mouseOut = { x: 0, y: 0 };
let isDragging = false;
let button1Down = false;
let button2Down = false;
let clickTimeoutId = null;
let inDoubleClick = false;
let doubleClickTimeout = 250; // ms
let dragOffsetS = [0, 0];

let rootElem;
let rootTopP;
let rootLeftL;

export function setDragOffset(myDragOffsetP) {
  dragOffsetS = myDragOffsetP;
}

// TODO Must throttle all...

function handleWheel(e) {
  hsm.wheelP(mousePos.value.xP, mousePos.value.yP, e.deltaY);
}

export function getPxFromMouseEvent(e) {
  let x = e.clientX - rootLeftL;
  let y = e.clientY - rootTopP;
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  return [x, y];
}

export async function handleMouseMove(e) {
  e.preventDefault();
  let [xS, yS] = getPxFromMouseEvent(e); // px from rootElem
  const [x, y] = [U.pxToMm(xS), U.pxToMm(yS)]; // mm from rootElem
  mousePos.value = { xP: xS, yP: yS, x: x, y: y, buttons: e.buttons };
  // console.log(`[canvasListeners.handleMouseMove] [xP:${xP.toFixed()}, yP:${yP.toFixed()}]`);

  if (!isDragging && e.buttons & 1) {
    const dxP = xS - mouseDown.x;
    const dyP = yS - mouseDown.y;
    const dP = dxP * dxP + dyP * dyP;
    // console.log(
    //   `[canvasListeners.handleMouseMove] x:${x} y:${y} isDragging:${isDragging} buttons:${e.buttons} d:${d}`,
    // );
    // if (dP > 2 * 2) {
    if (dP > 2 * 2) {
      isDragging = true;
      inDoubleClick = false;
      clearTimeout(clickTimeoutId);
      dragOffsetS = [0, 0];
      await hsm.dragStart(mouseDown.x, mouseDown.y);
    }
  }
  if (isDragging == true) {
    const [dxS, dyS] = [xS - mouseDown.x, yS - mouseDown.y];
    hsm.drag(dxS - dragOffsetS[0], dyS - dragOffsetS[1]);
  } else {
    hsm.mouseMove(xS, yS);
    // console.log(`[canvasListeners.handleMouseMove] elem:${elem} ${JSON.stringify(idz)}`);
  }
}

export function patchMouseDown() {
  if (!isDragging) return;
  mouseDown.x = mousePos.value.xP;
  mouseDown.y = mousePos.value.yP;
}

export function handleMouseDown(e) {
  e.preventDefault();
  const [xP, yP] = getPxFromMouseEvent(e);
  if (e.buttons & 1) {
    button1Down = true;
    mouseDown = { x: xP, y: yP };
    if (clickTimeoutId) {
      clearTimeout(clickTimeoutId);
      clickTimeoutId = null;
      inDoubleClick = true;
      // console.log(`[canvasListeners.handleMouseDown] inDoubleClick:${inDoubleClick}`);
    }
  }
  if (e.buttons & 2) {
    button2Down = true;
  }
  // console.log(
  //   `[canvasListeners.handleMouseUp] button1Down:${button1Down} button2Down:${button2Down}`,
  // );
}

export function handleMouseUp(e) {
  e.preventDefault();
  const [xL, yL] = getPxFromMouseEvent(e);
  // console.log(
  //   `[canvasListeners.handleMouseUp] x:${x} y:${y} buttons:${e.buttons} button1Down:${button1Down} button2Down:${button2Down}`,
  // );
  if (button1Down && ~e.buttons & 1) {
    // Button 1 released
    // console.log(`[canvasListeners.handleMouseUp] isDragging:${isDragging}`);
    if (isDragging) {
      const [dxL, dyL] = [xL - mouseDown.x, yL - mouseDown.y];
      hsm.dragEnd(dxL - dragOffsetS[0], dyL - dragOffsetS[1]);
      isDragging = false;
    } else {
      // console.log(`[canvasListeners.handleMouseUp] x:${x} y:${y} Got click`);
      // console.log(`[canvasListeners.handleMouseUp] inDoubleClick:${inDoubleClick}`);
      if (inDoubleClick) {
        inDoubleClick = false;
        clearTimeout(clickTimeoutId);
        clickTimeoutId = null;
        // console.log(`[canvasListeners.handleMouseUp] doubleClick`);
        // hsm.doubleClick(x, y);
        hsm.handleDoubleClick(xL, yL);
      }
      else {
        // console.log(`[canvasListeners.handleMouseUp] Starting clickTimeout`);
        clickTimeoutId = setTimeout(() => {
          clickTimeoutId = null;
          inDoubleClick = false;
          hsm.handleClick(xL, yL);
        }, doubleClickTimeout);
      }
    }
    button1Down = false;
  }
  if (button2Down && ~e.buttons & 2) {
    // Button 2 released
    // console.log(`[canvasListeners.handleMouseUp] x:${x} y:${y} Got right click`);
    button2Down = false;
    hsm.handleRightClick(xL, yL, e.clientX, e.clientY);
  }
}

export function handleMouseOut(e) {
  const [x, y] = getPxFromMouseEvent(e);
  // console.log(`[canvasListeners.handleMouseOut] x:${x} y:${y} isDragging:${isDragging}`);
  if (isDragging) {
    // mouseOut.x = x;
    // mouseOut.y = y;
    mouseOut.x = mousePos.value.xP;
    mouseOut.y = mousePos.value.yP;
  }
}

export function handleMouseEnter(e) {
  const [xP, yP] = getPxFromMouseEvent(e);
  // console.log(`[canvasListeners.handleMouseEnter] x:${x} y:${y} isDragging:${isDragging}`);
  if (isDragging) {
    if (!e.buttons & 1) {
      const [dxS, dyS] = [mouseOut.x - mouseDown.x, yP - mouseDown.y];
      hsm.dragEnd(dxS - dragOffsetS[0], dyS - dragOffsetS[1]);
      isDragging = false;
    }
  }
}

export function setDoubleClickTimeout(val) {
  doubleClickTimeout = Number(val);
}

export function setRootElemListeners(myRootElem) {
  // console.log(`[canvasListeners.setRootElemListeners] rootElemId:${myRootElem?.id}`);
  rootElem = myRootElem;
  const bb = rootElem.getBoundingClientRect();
  rootLeftL = bb.left;
  rootTopP = bb.top;
  rootElem.addEventListener("wheel", handleWheel);
  rootElem.addEventListener("mousemove", handleMouseMove);
  rootElem.addEventListener("mousedown", handleMouseDown);
  rootElem.addEventListener("mouseup", handleMouseUp);
  rootElem.addEventListener("mouseout", handleMouseOut);
  rootElem.addEventListener("mouseenter", handleMouseEnter);
}

export function removeRootElemListeners() {
  rootElem?.removeEventListener("wheel", handleWheel);
  rootElem?.removeEventListener("mousemove", handleMouseMove);
  rootElem?.removeEventListener("mousedown", handleMouseDown);
  rootElem?.removeEventListener("mouseup", handleMouseUp);
  rootElem?.removeEventListener("mouseout", handleMouseOut);
  rootElem?.removeEventListener("mouseenter", handleMouseEnter);
}
