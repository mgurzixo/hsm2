"use strict";

export const inchInMm = 25.4;

import * as V from "vue";
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

export async function nextTick() {
  return new Promise((res) => {
    V.nextTick(() => res(true));
  });
}

export async function timeout(timeout) {
  if (!timeout) timeout = 0;
  return new Promise((res) => {
    setTimeout(() => res(true), timeout);
  });
}

export async function isIdle() {
  return new Promise((res) => {
    requestIdleCallback(() => res(true));
  });
}

export function connectPoints(x0, y0, side0, x1, y1, side1, skipLast = false) {
  // console.log(`[utils.drawArrow] side0:${side0} side1:${side1}`);
  const r = hsm.settings.maxTransRadiusMm * 1.5;
  let segments = [];
  const [dx, dy] = [Math.abs(x1 - x0), Math.abs(y1 - y0)];
  if (x1 == x0) {
    if (y1 == y0) return segments;
    // if (!skipLast) segments.push({ dir: y1 > y0 ? "S" : "N", len: dy });
    // return segments;
  }
  switch (side0) {
    case "B":
    case "T": {
      switch (side1) {
        case "B":
        case "T": {
          if (side0 == side1) {
            if (side0 == "T") segments.push({ dir: side0 == "T" ? "N" : "S", len: y0 > y1 ? r + dy : r });
            else segments.push({ dir: side0 == "T" ? "N" : "S", len: y0 > y1 ? r : r + dy });
            segments.push({ dir: x1 > x0 ? "E" : "W", len: dx });
            if (side0 == "T") segments.push({ dir: side0 == "T" ? "S" : "N", len: y0 > y1 ? r : r + dy });
            else segments.push({ dir: side0 == "T" ? "S" : "N", len: y0 > y1 ? r + dy : r });
          } else {
            segments.push({ dir: y1 > y0 ? "S" : "N", len: dy / 2 });
            segments.push({ dir: x1 > x0 ? "E" : "W", len: dx });
            if (!skipLast) segments.push({ dir: y1 > y0 ? "S" : "N", len: dy - dy / 2 });
          }
        }
          break;
        case "R":
        case "L": {
          segments.push({ dir: y1 > y0 ? "S" : "N", len: dy });
          if (!skipLast) segments.push({ dir: x1 > x0 ? "E" : "W", len: dx });
        }
          break;
      }
      break;
    }
    case "R":
    case "L": {
      switch (side1) {
        case "B":
        case "T": {
          segments.push({ dir: x1 > x0 ? "E" : "W", len: dx });
          if (!skipLast && y1 != y0) segments.push({ dir: y1 > y0 ? "S" : "N", len: dy });
        }
          break;
        case "R":
        case "L": {
          console.log(`[utils.connectPoints] side0:${side0} side1:${side1}`);
          if (side0 == side1) {
            if (side0 == "R") segments.push({ dir: side0 == "L" ? "W" : "E", len: x0 > x1 ? r : r + dx });
            else segments.push({ dir: side0 == "L" ? "W" : "E", len: x0 > x1 ? r + dx : r });
            segments.push({ dir: y1 > y0 ? "S" : "N", len: dy });
            if (side0 == "R") segments.push({ dir: side0 == "L" ? "E" : "W", len: x0 > x1 ? r + dx : r });
            else segments.push({ dir: side0 == "L" ? "E" : "W", len: x0 > x1 ? r : r + dx });
          } else {
            if (y1 == y0) segments.push({ dir: x1 > x0 ? "E" : "W", len: dx });
            else {
              segments.push({ dir: x1 > x0 ? "E" : "W", len: dx / 2 });
              segments.push({ dir: y1 > y0 ? "S" : "N", len: dy });
              if (!skipLast) segments.push({ dir: x1 > x0 ? "E" : "W", len: dx - dx / 2 });
            }
          }
        }
          break;
      }
      break;
    }
  }
  // console.log(`[utils.connectPoints] Segments:${JSON.stringify(segments)}`);
  return segments;
}

export function drawArrow(cCtx, lineWidth, x, y, dir) {
  // console.log(`[utils.drawArrow] dir ${dir}`);
  function C(val) {
    const x = hsm.mmToPL(val);
    if (!lineWidth % 2) return Math.round(x);
    return Math.round(x) + 0.5;
  }
  let lenP = C(hsm.settings.arrowLengthMm);
  let widthP = C(hsm.settings.arrowWidthMm);
  const xP = C(x);
  const yP = C(y);
  cCtx.beginPath();
  switch (dir) {
    case "N":
      lenP = -lenP;
    // eslint-disable-next-line no-fallthrough
    case "S":
      cCtx.moveTo(xP - widthP, yP - lenP);
      cCtx.lineTo(xP, yP);
      cCtx.lineTo(xP + widthP, yP - lenP);
      break;
    case "W":
      lenP = -lenP;
    // eslint-disable-next-line no-fallthrough
    case "E":
      cCtx.moveTo(xP - lenP, yP - widthP);
      cCtx.lineTo(xP, yP);
      cCtx.lineTo(xP - lenP, yP + widthP);
      break;
  }
  cCtx.stroke();
}
