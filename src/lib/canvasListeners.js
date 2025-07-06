"use strict";

import { canvas, folio } from "src/classes/CHsm";

let mousePos = { x: 0, y: 0 };
let mouseDown = { x: 0, y: 0 };
let mouseOut = { x: 0, y: 0 };
let isDragging = false;
let isClicked = false;

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
  }
}

export function handleMouseDown(e) {
  const [x, y] = getXYFromMouseEvent(e);
  mouseDown = { x: x, y: y };
  isClicked = true;
  // console.log(`[canvasListeners.handleMouseDown] x:${x} y:${y}`);
}

export function handleMouseUp(e) {
  const [x, y] = getXYFromMouseEvent(e);
  // console.log(`[canvasListeners.handleMouseUp] x:${x} y:${y} isDragging:${isDragging}`);
  if (isDragging) {
    folio.dragEndP(x - mouseDown.x, y - mouseDown.y);
    isDragging = false;
  } else if (isClicked) {
    folio.clickP(x, y);
  }
  isClicked = false;
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
