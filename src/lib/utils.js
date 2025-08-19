"use strict";

export const inchInMm = 25.4;
export const pxPerMm = 3.78;

import * as V from "vue";
import { hsm, hCtx, hElems, cCtx } from "src/classes/Chsm";
import html2canvas from 'html2canvas-pro';
import markdownit from 'markdown-it';
const md = markdownit();

export const fText = V.ref("");

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
  // console.log(`[utils.rectsIntersect] They intersect!`);
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
  if (x < r.x0 || x > r.x0 + r.width || y < r.y0 || y > r.y0 + r.height) return false;
  return true;
}

export function pointInWH(x, y, r) {
  if (x < 0 || x > r.width || y < 0 || y > r.height) return false;
  return true;
}

export function myClamp(dx, x0, len0, x1, len1) {
  if (x0 + dx < x1) dx = x1 - x0;
  if (x0 + dx + len0 > x1 + len1) dx = x1 + len1 - x0 - len0;
  return dx;
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
  // console.log(`[utils.connectPoints] side0:${side0} side1:${side1}`);
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
          // console.log(`[utils.connectPoints] side0:${side0} side1:${side1}`);
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


// cf. https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
export function distToSegmentSquared(p, v, w) {
  function dist2(v, w) { return (v.x - w.x) ** 2 + (v.y - w.y) ** 2; }
  var l2 = dist2(v, w);
  if (l2 == 0) return [dist2(p, v), 0];
  var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const d2 = dist2(p, {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y)
  });
  // if (window.windump) console.log(`[utils.distToSegmentSquared] (x:${p.x.toFixed(2)}, y:${p.y.toFixed(2)}) (xs:${v.x}, ys:${v.y})  (xe:${w.x}, ye:${w.y}) d:${Math.sqrt(d2).toFixed(2)} t:${t.toFixed(2)}`);
  return [d2, t];
}

export function pathRoundedRectP(px, py, pwidth, pheight, pradius) {
  cCtx.beginPath();
  cCtx.moveTo(px + pradius, py);
  cCtx.lineTo(px + pwidth - pradius, py);
  cCtx.quadraticCurveTo(px + pwidth, py, px + pwidth, py + pradius);
  cCtx.lineTo(px + pwidth, py + pheight - pradius);
  cCtx.quadraticCurveTo(px + pwidth, py + pheight, px + pwidth - pradius, py + pheight);
  cCtx.lineTo(px + pradius, py + pheight);
  cCtx.quadraticCurveTo(px, py + pheight, px, py + pheight - pradius);
  cCtx.lineTo(px, py + pradius);
  cCtx.quadraticCurveTo(px, py, px + pradius, py);
  cCtx.closePath();
}

export function raiseElement(tabElements, myId) {
  let iFound;
  for (iFound in tabElements) {
    if (tabElements[iFound].id == myId) break;
  }
  if (iFound >= tabElements.length - 1) return;
  const elem = tabElements[iFound];
  tabElements.splice(iFound, 1);
  tabElements.push(elem);
  // In case of folio, insert before transitions
  //
  const parentEl = elem.myElem.parentElement;
  if (elem.parent.id.startsWith("F")) {
    const firstTr = hCtx.folio.trs[0];
    if (firstTr) {
      parentEl.insertBefore(elem.myElem, firstTr.myElem);
      return;
    }
  }
  // Otherwise insert at end
  elem.myElem.remove;
  parentEl.append(elem.myElem);
}

export function distToSegment(p, v, w) {
  return Math.sqrt(distToSegmentSquared(p, v, w));
}

export function isHoriz(val) {
  // val can be a side or a dir
  switch (val) {
    case "N":
    case "S":
    case "L":
    case "R":
      return false;
    case "W":
    case "E":
    case "T":
    case "B":
      return true;
  }
  console.error(`[utils.isHoriz] Unknown dir:${val}`);
}

export function reverseDir(dir) {
  switch (dir) {
    case "N":
      return "S";
    case "S":
      return "N";
    case "W":
      return "E";
    case "E":
      return "W";
    case "L":
      return "R";
    case "R":
      return "L";
    case "T":
      return "B";
    case "TL":
      return "BR";
    case "TR":
      return "BL";
    case "BR":
      return "TL";
    case "BL":
      return "TR";
  }
  console.error(`[utils.reverseDir] Unknown dir:${dir}`);
}

export function normalizeSegment(seg) {
  if (seg.len < 0) {
    seg.len = -seg.len;
    seg.dir = reverseDir(seg.dir);
  }
  return seg;
}

export function addToSegment(seg, dl) {
  let dir = seg.dir;
  let len = seg.len;
  if (seg.dir == "S" || seg.dir == "E") seg.len += dl;
  else seg.len -= dl;
  return normalizeSegment(seg);
}

export function goesToOutside(side, dir) {
  if (isHoriz(side)) return dir == (side == "T" ? "N" : "S");
  return dir == (side == "L" ? "W" : "E");
}


export function goesToInside(side, dir) {
  if (isHoriz(side)) return dir == (side == "T" ? "S" : "N");
  return dir == (side == "L" ? "E" : "W");
}

export function comesFromOutside(side, dir) {
  if (isHoriz(side)) return dir == (side == "T" ? "S" : "N");
  return dir == (side == "L" ? "E" : "W");
}

export function comesFromInside(side, dir) {
  if (isHoriz(side)) return dir == (side == "T" ? "N" : "S");
  return dir == (side == "L" ? "W" : "E");
}

export function mmToPL(lMm) {
  return Math.round(lMm * hsm.scalePhy());
}

// export function pToMmL(lP) {
//   return lP / hsm.scalePhy();
// }

export function mmToPx(len) {
  const px = len * hCtx.folio.geo.scale * pxPerMm;
  return px;
}

export function pxToMm(px) {
  // Beware of hsm initialisation
  const scale = hCtx?.folio?.geo.scale ? hCtx.folio.geo.scale : 1;
  const len = px / (scale * pxPerMm);
  // console.log(`[utils.pxToMm] px:${px} len:${len}`);
  return len;
}

export function pxLToMm(px) {
  // Beware of hsm initialisation
  const scale = hCtx?.folio?.geo.scale ? hCtx.folio.geo.scale : 1;
  const len = px / (scale);
  // console.log(`[utils.pxToMm] px:${px} len:${len}`);
  return len;
}

export function pxSTopxL(pxS) {
  // Convert screen pixel to logical pixel
  // Beware of hsm initialisation
  const scale = hCtx?.folio?.geo.scale ? hCtx.folio.geo.scale : 1;
  const pxL = pxS / (scale);
  // console.log(`[utils.pxToMm] px:${px} len:${len}`);
  return pxL;
}

export function pxLTopxS(pxL) {
  // Convert logical pixel to screen pixel
  const pxS = pxL * hCtx.folio.geo.scale * pxPerMm;
  return pxS;
}

export function getScale() {
  return hCtx.folio.geo.scale;
}

export function getElemById(id) {
  return hsm.hElems.getElemById(id);
}

// cf. https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
export function standardize_color(str) {
  let elem = document.createElement("canvas");
  var ctx = elem.getContext("2d");
  ctx.fillStyle = str;
  const colName = ctx.fillStyle;
  elem.remove();
  return colName;
}

// cf. https://gist.github.com/vahidk/05184faf3d92a0aa1b46aeaa93b07786
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let d = max - min;
  let h;
  if (d === 0) h = 0;
  else if (max === r) h = (g - b) / d % 6;
  else if (max === g) h = (b - r) / d + 2;
  else if (max === b) h = (r - g) / d + 4;
  let l = (min + max) / 2;
  let s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return [h * 60, s, l];
}

export function debounce(callback, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback();
    }, delay);
  };
}

// cf. https://stackoverflow.com/questions/2970525/converting-a-string-with-spaces-into-camel-case
export function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

export function underscorize(str) {
  return str.replace(/ /g, "_");
}

// export function matToMm(mat) {
//   return {
//     a: mat.a, b: mat.b, c: mat.c, d: mat.d,
//     e: mat.e * pxPerMm, f: mat.f * pxPerMm
//   };
// }
