"use strict";

export const inchInMm = 25.4;

import { hsm, hElems, cCtx } from "src/classes/Chsm";

export function RR(x, lineWidth = 1) {
  if (!lineWidth % 2) return Math.round(x);
  return Math.round(x) + 0.5;
}

export function R(x) {
  return Math.round(x);
}

export function rectsIntersect(r1, r2) {
  const dl = hsm.settings.minDistanceMm;
  if (r1.x0 + r1.width < r2.x0 - dl) return false;
  if (r2.x0 + r2.width < r1.x0 - dl) return false;
  if (r1.y0 + r1.height < r2.y0 - dl) return false;
  if (r2.y0 + r2.height < r1.y0 - dl) return false;
  return true;
}

export function rect2InRect1(r1, r2) {
  if (!rectsIntersect(r1, r2)) return false;
  if (r2.x0 < r1.x0) return false;
  if (r2.x0 + r2.width > r1.x0 + r1.width) return false;
  if (r2.y0 < r1.y0) return false;
  if (r2.y0 + r2.height > r1.y0 + r1.height) return false;
  return true;
}

export function pointInRect(x, y, r) {
  if (x < r.x0 || x > r.x0 + r.width || y < r.y0 || y > r.y0 + r.height) {
    // console.log(
    //   `[Chsm.pointInRect] (${x.toFixed()}, ${y.toFixed()}) in (${r.x0.toFixed()}, ${r.y0.toFixed()}) w:${r.width} h:${r.height} FALSE`,
    // );
    return false;
  }
  // console.log(
  //   `[Chsm.pointInRect] (${x.toFixed()}, ${y.toFixed()}) in (${r.x0.toFixed()}, ${r.y0.toFixed()}) w:${r.width} h:${r.height} TRUE`,
  // );
  return true;
}

export function pointInWH(x, y, r) {
  if (x < 0 || x > r.width || y < 0 || y > r.height) {
    //   console.log(
    //     `[Chsm.pointInWH] (${x.toFixed()}, ${y.toFixed()}) in (${r.x0.toFixed()}, ${r.y0.toFixed()}) w:${r.width} h:${r.height} FALSE`,
    // );
    return false;
  }
  // console.log(
  //   `[Chsm.pointInWH] (${x.toFixed()}, ${y.toFixed()}) in (${r.x0.toFixed()}, ${r.y0.toFixed()}) w:${r.width} h:${r.height} TRUE`,
  // );
  return true;
}

export function idToXY(p) {
  const elem = hElems.getElemById(p.id);
  if (p.pos > 1) p.pos = 1;
  let [x0, y0] = [elem.geo.x0, elem.geo.y0];
  for (let parent = elem.parent; parent; parent = parent.parent) {
    x0 += parent.geo.x0;
    y0 += parent.geo.y0;
  }
  const r = hsm.settings.stateRadiusMm;
  const w = elem.geo.width;
  const h = elem.geo.height;
  switch (p.side) {
    case "R":
      x0 += w;
      y0 += r + (h - 2 * r) * p.pos;
      break;
    case "B":
      x0 += r + (w - 2 * r) * p.pos;
      y0 += h;
      break;
    case "L":
      y0 += r + (h - 2 * r) * p.pos;
      break;
    case "T":
    default:
      x0 += r + (w - 2 * r) * p.pos;
      break;
  }
  return [x0, y0];
}

export function myClamp(dx, x0, len0, x1, len1) {
  if (x0 + dx < x1) dx = x1 - x0;
  if (x0 + dx + len0 > x1 + len1) dx = x1 + len1 - x0 - len0;
  return dx;
}

export function drawLineWithArrows(x0, y0, x1, y1, aWidth, aLength, arrowStart, arrowEnd) {
  var dx = x1 - x0;
  var dy = y1 - y0;
  var angle = Math.atan2(dy, dx);
  var length = Math.sqrt(dx * dx + dy * dy);
  //
  cCtx.translate(x0, y0);
  cCtx.rotate(angle);
  cCtx.beginPath();
  cCtx.moveTo(0, 0);
  cCtx.lineTo(length, 0);
  if (arrowStart) {
    cCtx.moveTo(aLength, -aWidth);
    cCtx.lineTo(0, 0);
    cCtx.lineTo(aLength, aWidth);
  }
  if (arrowEnd) {
    cCtx.moveTo(length - aLength, -aWidth);
    cCtx.lineTo(length, 0);
    cCtx.lineTo(length - aLength, aWidth);
  }
  //
  cCtx.stroke();
  cCtx.setTransform(1, 0, 0, 1, 0, 0);
}
