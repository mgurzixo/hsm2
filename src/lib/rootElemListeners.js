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
let dragOffset = [0, 0];

export function setDragOffset(myDragOffset) {
  dragOffset = myDragOffset;
}

// TODO Must throttle all...

function handleWheel(e) {
  hsm.wheelP(mousePos.value.xP, mousePos.value.yP, e.deltaY);
}

export function getXYFromMouseEvent(e) {
  let x = Math.round(e.clientX - hsm.rootElem.x0);
  let y = Math.round(e.clientY - hsm.rootElem.y0);
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  return [x, y];
}

export async function handleMouseMove(e) {
  const [xP, yP] = getXYFromMouseEvent(e);
  const [x, y] = [U.pToMmL(xP), U.pToMmL(yP)];
  mousePos.value = { xP: xP, yP: yP, x: x, y: y, buttons: e.buttons };

  if (!isDragging && e.buttons & 1) {
    const dxP = xP - mouseDown.x;
    const dyP = yP - mouseDown.y;
    const dP = dxP * dxP + dyP * dyP;
    // console.log(
    //   `[canvasListeners.handleMouseMove] x:${x} y:${y} isDragging:${isDragging} buttons:${e.buttons} d:${d}`,
    // );
    // if (dP > 2 * 2) {
    if (dP > 2 * 2) {
      isDragging = true;
      inDoubleClick = false;
      clearTimeout(clickTimeoutId);
      const [mdx, mdy] = [U.pToMmL(mouseDown.x), U.pToMmL(mouseDown.y)];
      dragOffset = [0, 0];
      await hsm.dragStart(mdx, mdy);
    }
  }
  if (isDragging == true) {
    const [dxP, dyP] = [xP - mouseDown.x, yP - mouseDown.y];
    const [dx, dy] = [U.pToMmL(dxP), U.pToMmL(dyP)];
    hsm.drag(dx - dragOffset[0], dy - dragOffset[1]);
  } else {
    hsm.mouseMove(x, y);
    // console.log(`[canvasListeners.handleMouseMove] elem:${elem} ${JSON.stringify(idz)}`);
  }
}

export function patchMouseDown() {
  if (!isDragging) return;
  mouseDown.x = mousePos.value.xP;
  mouseDown.y = mousePos.value.yP;
}

export function handleMouseDown(e) {
  const [xP, yP] = getXYFromMouseEvent(e);
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
  const [xP, yP] = getXYFromMouseEvent(e);
  // console.log(
  //   `[canvasListeners.handleMouseUp] x:${x} y:${y} buttons:${e.buttons} button1Down:${button1Down} button2Down:${button2Down}`,
  // );
  if (button1Down && ~e.buttons & 1) {
    // Button 1 released
    console.log(`[canvasListeners.handleMouseUp] isDragging:${isDragging}`);
    if (isDragging) {
      const [dx, dy] = [U.pToMmL(xP - mouseDown.x), U.pToMmL(yP - mouseDown.y)];
      hsm.dragEnd(dx - dragOffset[0], dy - dragOffset[1]);
      isDragging = false;
    } else {
      const [x, y] = [U.pToMmL(xP), U.pToMmL(yP)];
      // console.log(`[canvasListeners.handleMouseUp] x:${x} y:${y} Got click`);
      // console.log(`[canvasListeners.handleMouseUp] inDoubleClick:${inDoubleClick}`);
      if (inDoubleClick) {
        inDoubleClick = false;
        clearTimeout(clickTimeoutId);
        clickTimeoutId = null;
        // console.log(`[canvasListeners.handleMouseUp] doubleClick`);
        // hsm.doubleClick(x, y);
        hsm.handleDoubleClick(x, y);
      }
      else {
        console.log(`[canvasListeners.handleMouseUp] Starting clickTimeout`);
        clickTimeoutId = setTimeout(() => {
          clickTimeoutId = null;
          inDoubleClick = false;
          hsm.click(x, y);
        }, doubleClickTimeout);
      }
    }
    button1Down = false;
  }
  if (button2Down && ~e.buttons & 2) {
    // Button 2 released
    // console.log(`[canvasListeners.handleMouseUp] x:${x} y:${y} Got right click`);
    button2Down = false;
    hsm.handleRightClick(xP, yP, e.clientX, e.clientY);
  }
}

export function handleMouseOut(e) {
  const [x, y] = getXYFromMouseEvent(e);
  // console.log(`[canvasListeners.handleMouseOut] x:${x} y:${y} isDragging:${isDragging}`);
  if (isDragging) {
    // mouseOut.x = x;
    // mouseOut.y = y;
    mouseOut.x = mousePos.value.xP;
    mouseOut.y = mousePos.value.yP;
  }
}

export function handleMouseEnter(e) {
  const [xP, yP] = getXYFromMouseEvent(e);
  // console.log(`[canvasListeners.handleMouseEnter] x:${x} y:${y} isDragging:${isDragging}`);
  if (isDragging) {
    if (!e.buttons & 1) {
      const [dx, dy] = [U.pToMmL(mouseOut.x - mouseDown.x), U.pToMmL(mouseOut.y - mouseDown.y)];
      hsm.dragEnd(dx - dragOffset[0], dy - dragOffset[1]);
      isDragging = false;
    }
  }
}

export function setDoubleClickTimeout(val) {
  doubleClickTimeout = Number(val);
}

export function setCanvasListeners() {
  hsm.rootElem.addEventListener("wheel", handleWheel);
  hsm.rootElem.addEventListener("mousemove", handleMouseMove);
  hsm.rootElem.addEventListener("mousedown", handleMouseDown);
  hsm.rootElem.addEventListener("mouseup", handleMouseUp);
  hsm.rootElem.addEventListener("mouseout", handleMouseOut);
  hsm.rootElem.addEventListener("mouseenter", handleMouseEnter);
}

export function removeCanvasListeners() {
  return; // ICI
  hsm.rootElem?.removeEventListener("wheel", handleWheel);
  hsm.rootElem?.removeEventListener("mousemove", handleMouseMove);
  hsm.rootElem?.removeEventListener("mousedown", handleMouseDown);
  hsm.rootElem?.removeEventListener("mouseup", handleMouseUp);
  hsm.rootElem?.removeEventListener("mouseout", handleMouseOut);
  hsm.rootElem?.removeEventListener("mouseenter", handleMouseEnter);
}
