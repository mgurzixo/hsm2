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
  const [xP, yP] = getXYFromMouseEvent(e);
  mousePos.x = xP;
  mousePos.y = yP;
  const [x, y] = [hsm.pToMmL(xP), hsm.pToMmL(yP)];

  if (!isDragging && e.buttons & 1) {
    const dxP = xP - mouseDown.x;
    const dyP = yP - mouseDown.y;
    const dP = dxP * dxP + dyP * dyP;
    // console.log(
    //   `[canvasListeners.handleMouseMove] x:${x} y:${y} isDragging:${isDragging} buttons:${e.buttons} d:${d}`,
    // );
    if (dP > 16) {
      isDragging = true;
      const [mdx, mdy] = [hsm.pToMmL(mouseDown.x), hsm.pToMmL(mouseDown.y)];
      let idz = hsm.getIdAndZone(mdx, mdy);
      hsm.hElems.setIdAndZone(idz);
      folio.dragStart();
    }
  }
  if (isDragging == true) {
    const [dxP, dyP] = [xP - mouseDown.x, yP - mouseDown.y];
    const [dx, dy] = [hsm.pToMmL(dxP), hsm.pToMmL(dyP)];
    folio.drag(dx, dy);
  } else {
    const idz = hsm.getIdAndZone(x, y);
    // console.log(`[canvasListeners.handleMouseMove] elem:${elem} ${JSON.stringify(idz)}`);
    hsm.setCursor(idz);
  }
}

export function handleMouseDown(e) {
  const [xP, yP] = getXYFromMouseEvent(e);
  if (e.buttons & 1) {
    button1Down = true;
    mouseDown = { x: xP, y: yP };
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
    if (isDragging) {
      const [dx, dy] = [hsm.pToMmL(xP - mouseDown.x), hsm.pToMmL(yP - mouseDown.y)];

      folio.dragEnd(dx, dy);
      isDragging = false;
    } else {
      const [x, y] = [hsm.pToMmL(xP), hsm.pToMmL(yP)];
      // console.log(`[canvasListeners.handleMouseUp] x:${x} y:${y} Got click`);
      folio.click(x, y);
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
