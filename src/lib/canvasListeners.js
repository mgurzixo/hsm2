"use strict";

import { canvas, folio, hsm } from "src/classes/Chsm";

export let mousePos = { x: 0, y: 0 };
let mouseDown = { x: 0, y: 0 };
let mouseOut = { x: 0, y: 0 };
let isDragging = false;
let button1Down = false;
let button2Down = false;

// TODO Must throttle all...

function handleWheel(e) {
  folio.wheelP(mousePos.x, mousePos.y, e.deltaY);
}

export function getXYFromMouseEvent(e) {
  let x = Math.round(e.clientX - canvas.x0);
  let y = Math.round(e.clientY - canvas.y0);
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  return [x, y];
}

export function handleMouseMove(e) {
  const [x, y] = getXYFromMouseEvent(e);
  mousePos.x = x;
  mousePos.y = y;

  if (!isDragging && e.buttons & 1) {
    const dx = x - mouseDown.x;
    const dy = y - mouseDown.y;
    const d = dx * dx + dy * dy;
    // console.log(
    //   `[canvasListeners.handleMouseMove] x:${x} y:${y} isDragging:${isDragging} buttons:${e.buttons} d:${d}`,
    // );
    if (d > 5) {
      isDragging = true;
      folio.dragStartP(mouseDown.x, mouseDown.y);
    }
  }
  if (isDragging == true) {
    const dx = x - mouseDown.x;
    const dy = y - mouseDown.y;
    // console.log(`[canvasListeners.handleMouseMove] x:${x} y:${y} isDragging:${isDragging}`);
    folio.dragP(dx, dy);
  } else {
    const idz = hsm.getIdAndZone(hsm.pToMmL(mousePos.x), hsm.pToMmL(mousePos.y));
    const elem = hsm.hElems.getById(idz.id);
    // console.log(`[canvasListeners.handleMouseMove] elem:${elem} ${JSON.stringify(idz)}`);
    hsm.setCursor(elem.defineCursor(idz));
  }
}

export function handleMouseDown(e) {
  const [x, y] = getXYFromMouseEvent(e);
  if (e.buttons & 1) {
    button1Down = true;
    mouseDown = { x: x, y: y };
    // console.log(`[canvasListeners.handleMouseDown] x:${x} y:${y} Button 1`);
  }
  if (e.buttons & 2) {
    button2Down = true;
    // console.log(`[canvasListeners.handleMouseDown] x:${x} y:${y} Button 2`);
  }
  // console.log(
  //   `[canvasListeners.handleMouseUp] button1Down:${button1Down} button2Down:${button2Down}`,
  // );
}

export function handleMouseUp(e) {
  const [x, y] = getXYFromMouseEvent(e);
  // console.log(
  //   `[canvasListeners.handleMouseUp] x:${x} y:${y} buttons:${e.buttons} button1Down:${button1Down} button2Down:${button2Down}`,
  // );
  if (button1Down && ~e.buttons & 1) {
    // Button 1 released
    if (isDragging) {
      folio.dragEndP(x - mouseDown.x, y - mouseDown.y);
      isDragging = false;
    } else {
      // console.log(`[canvasListeners.handleMouseUp] x:${x} y:${y} Got click`);
      folio.clickP(x, y);
    }
    button1Down = false;
  }
  if (button2Down && ~e.buttons & 2) {
    // Button 2 released
    // console.log(`[canvasListeners.handleMouseUp] x:${x} y:${y} Got right click`);
    button2Down = false;
    hsm.handleRightClick(x, y, e.clientX, e.clientY);
  }
}

export function handleMouseOut(e) {
  const [x, y] = getXYFromMouseEvent(e);
  // console.log(`[canvasListeners.handleMouseOut] x:${x} y:${y} isDragging:${isDragging}`);
  if (isDragging) {
    // mouseOut.x = x;
    // mouseOut.y = y;
    mouseOut.x = mousePos.x;
    mouseOut.y = mousePos.y;
  }
}

export function handleMouseEnter(e) {
  const [x, y] = getXYFromMouseEvent(e);
  // console.log(`[canvasListeners.handleMouseEnter] x:${x} y:${y} isDragging:${isDragging}`);
  if (isDragging) {
    if (!e.buttons & 1) {
      folio.dragCancelP(mouseOut.x - mouseDown.x, mouseOut.y - mouseDown.y);
      isDragging = false;
    }
  }
}

export function setCanvasListeners() {
  canvas.addEventListener("wheel", handleWheel);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mouseout", handleMouseOut);
  canvas.addEventListener("mouseenter", handleMouseEnter);
  // setDragListeners();
}

export function removeCanvasListeners() {
  canvas?.removeEventListener("wheel", handleWheel);
  canvas?.removeEventListener("mousemove", handleMouseMove);
  canvas?.removeEventListener("mousedown", handleMouseDown);
  canvas?.removeEventListener("mouseup", handleMouseUp);
  canvas?.removeEventListener("mouseout", handleMouseOut);
  canvas?.removeEventListener("mouseenter", handleMouseEnter);
  // resetDragListeners();
}
