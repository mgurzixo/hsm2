"use strict";

import * as U from "src/lib/utils";
import { hsm, cCtx, hElems, hCtx, modeRef } from "src/classes/Chsm";


export function drawArrow(cCtx, x, y, dir) {
  // console.log(`[utils.drawArrow] dir ${dir}`);
  function C(val) {
    const x = U.mmToPL(val);
    return x;
    // if (!cCtx.lineWidth % 2) return Math.round(x);
    // return Math.round(x) + 0.5;
  }
  let lenP = C(hsm.settings.arrowLengthMm);
  let widthP = C(hsm.settings.arrowWidthMm);
  const xP = C(x);
  const yP = C(y);
  // Avoid erasing state border
  cCtx.lineJoin = "round";
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
  cCtx.lineJoin = "miter";
}

export function removeNullSegments(segs) {
  const res = [];
  let gotNul = false;
  for (let i = 0; i < segs.length; i++) {
    if (segs[i].len == 0) {
      if (!i) continue;
      if (i == segs.length - 1) break;
      gotNul = true;
      continue;
    }
    const seg = segs[i];
    if (gotNul) {
      const prev = res.pop();
      // console.warn(`[segments.removeNullSegments] i:${i} resLen:${res.length} prev:${prev}`);
      let len = prev.len + seg.len;
      let dir = prev.dir;
      if (dir != seg.dir) len = prev - seg.len;
      if (len == 0) continue;
      if (len < 0) {
        len = -len;
        dir = U.reverseDir(dir);
      }
      res.push({ len: len, dir: dir });
      // console.warn(`[segments.removeNullSegments] i:${i} res#:${res.length - 1} dir:${dir} len:${len}`);
      gotNul = false;
      continue;
    }
    res.push({ len: seg.len, dir: seg.dir });
  }
  return res;
}

export function pathSegments(segments, x0, y0) {
  // Warning, a segment len can be null when dragging
  // but 2 sonsecutive segs cant be both null
  function C(val) {
    const x = U.mmToPL(val);
    if (!cCtx.lineWidth.lineWidth % 2) return Math.round(x);
    return Math.round(x) + 0.5;
  }

  segments = removeNullSegments(segments);
  cCtx.beginPath();
  let [x, y] = [x0, y0];
  cCtx.moveTo(C(x), C(y));
  let curDir;
  const maxIdx = segments.length - 1;
  // console.log(`[segments.pathSegments]----------------------- maxIdx: ${ maxIdx }`);
  let radius1 = 0;
  for (let idx in segments) {
    idx = Number(idx);
    let segment = segments[idx];
    let len = segment.len;
    if (len == 0) continue;
    if (len <= 0) console.error(`[segments.pathSegments] (${idx}) seg#${idx}: len:${segment.len} dir:${segment.dir}`);
    let nextSeg = null;
    for (let idn = idx + 1; idn <= maxIdx; idn++) {
      if (segments[idn].len == 0) continue;
      nextSeg = segments[idn];
      break;
    }
    // const nextSeg = idx < maxIdx ? segments[idx + 1] : null;
    // console.log(`[segments.pathSegments] (${ idx }) previousSeg: ${ previousSeg } nextSeg: ${ nextSeg }`);
    curDir = segment.dir;
    let radius2 = hsm.settings.maxTransRadiusMm;
    if (radius2 > segment.len / 2) radius2 = segment.len / 2;
    if (!nextSeg) radius2 = 0;
    else if (radius2 > nextSeg.len / 2) radius2 = nextSeg.len / 2;
    // radius1 = 0;
    // radius2 = 0; // REMOVE
    len = len - radius1 - radius2;
    // console.log(`[segments.pathSegments] (${ idx }) len0: ${ segment.len.toFixed() } len: ${ len.toFixed() } dir: ${ segment.dir } radius1: ${ radius1.toFixed() } radius2: ${ radius2.toFixed() }`);
    switch (segment.dir) {
      case "N":
        y = y - len;
        break;
      case "E":
        x = x + len;
        break;
      case "S":
        y = y + len;
        break;
      case "W":
        x = x - len;
        break;
    }
    cCtx.lineTo(C(x), C(y));
    let [cpx, cpy] = [x, y];
    if (radius2) {
      switch (segment.dir) {
        case "N":
          y -= radius2;
          x += nextSeg.dir == "E" ? radius2 : -radius2;
          cpy = y;
          break;
        case "S":
          y += radius2;
          x += nextSeg.dir == "E" ? radius2 : -radius2;
          cpy = y;
          break;
        case "E":
          x += radius2;
          y += nextSeg?.dir == "S" ? radius2 : -radius2;
          cpx = x;
          break;
        case "W":
          x -= radius2;
          y += nextSeg?.dir == "S" ? radius2 : -radius2;
          cpx = x;
          break;
      }
      // cCtx.lineTo(C(x), C(y)); // REMOVE
      cCtx.quadraticCurveTo(C(cpx), C(cpy), C(x), C(y));
      radius1 = radius2;
    }
  }
  cCtx.stroke();
  if (curDir) drawArrow(cCtx, x, y, curDir);
}

export function nextXY(segment, x, y) {
  switch (segment.dir) {
    case "N":
      y -= segment.len;
      break;
    case "S":
      y += segment.len;
      break;
    case "W":
      x -= segment.len;
      break;
    case "E":
      x += segment.len;
      break;
  }
  return [x, y];
}

function nearlyEqual(x, y) {
  if (Math.abs(x - y) < hsm.settings.smallestSegMm) return true;
  return false;
}

// Cf. https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
function bpIntersect(bpA, bpB) {
  const dX = bpA.to.x - bpA.from.x;
  const dY = bpA.to.y - bpA.from.y;
  const determinant = dX * (bpB.to.y - bpB.from.y) - (bpB.to.x - bpB.from.x) * dY;
  if (determinant === 0) {
    // parallel lines
    if ((bpA.from.x != bpB.from.x) || (bpA.from.y != bpB.to.y)) return null;
    // Aligned
    if (bpA.from.x == bpB.to.x) {
      // Vertical
      if (Math.max(bpA.from.y, bpA.to.y) < Math.max(bpA.from.y, bpA.to.y)) return null;
      if (Math.min(bpA.from.y, bpA.to.y) > Math.min(bpA.from.y, bpA.to.y)) return null;
      return bpB.to;
    }
    else {
      // Horizontal
      if (Math.max(bpA.from.x, bpA.to.x) < Math.max(bpA.from.x, bpA.to.x)) return null;
      if (Math.min(bpA.from.x, bpA.to.x) > Math.min(bpA.from.x, bpA.to.x)) return null;
      return bpB.to;
    }
  }
  const lambda = ((bpB.to.y - bpB.from.y) * (bpB.to.x - bpA.from.x) + (bpB.from.x - bpB.to.x) * (bpB.to.y - bpA.from.y)) / determinant;

  const gamma = ((bpA.from.y - bpA.to.y) * (bpB.to.x - bpA.from.x) + dX * (bpB.to.y - bpA.from.y)) / determinant;

  // check if there is an intersection
  if (!(0 <= lambda && lambda <= 1) || !(0 <= gamma && gamma <= 1)) return null;
  let p = {
    x: bpA.from.x + lambda * dX,
    y: bpA.from.y + lambda * dY
  };
  // console.log(`[segments.segsToBps] lambda:${lambda.toFixed(2)} gamma:${gamma.toFixed(2)} p:(x:${p.x}, y:${p.y})`);
  return p;
};

function segsToBps(segments, x = 0, y = 0) {
  const tabBps = [];
  let [x0, y0] = [x, y];
  let x1, y1 = [0, 0];
  for (let seg of segments) {
    if (seg.len == 0) continue; // Remove empty segments
    [x1, y1] = nextXY(seg, x0, y0);
    tabBps.push({ from: { x: x0, y: y0 }, to: { x: x1, y: y1 } });
    [x0, y0] = [x1, y1];
  }
  // console.log(`[segments.segsToBps] tabBps:${JSON.stringify(tabBps)}`);
  return tabBps;
}

function bpsToSegs(tabBps) {
  const segments = [];
  for (let bp of tabBps) {
    let dir, len;
    if (bp.from.y == bp.to.y) {
      // Horizontal
      if (bp.to.x > bp.from.x) {
        dir = "E";
        len = bp.to.x - bp.from.x;
      }
      else {
        dir = "W";
        len = bp.from.x - bp.to.x;
      }
    }
    else {
      if (bp.to.y > bp.from.y) {
        dir = "S";
        len = bp.to.y - bp.from.y;
      }
      else {
        dir = "N";
        len = bp.from.y - bp.to.y;
      }
    }
    segments.push({ len: len, dir: dir });
  }
  // console.log(`[segments.bpsToSegs] segments:${JSON.stringify(segments)}`);
  return segments;
}

function bpsRemoveLoops(tabBps) {
  const nbBps = tabBps.length;
  const res = [];
  for (let ia = 0; ia < nbBps; ia++) {
    const bpA = tabBps[ia];
    let found = false;
    for (let ib = ia + 2; ib < nbBps; ib++) {
      const p = bpIntersect(tabBps[ia], tabBps[ib]);
      if (p == null) continue;
      // console.log(`[segments.bpsRemoveLoops] found intersect #${ia} #${ib}`);
      res.push({ from: bpA.from, to: p });
      res.push({ from: p, to: tabBps[ib].to });
      ia = ib;
      found = true;
      break;
    }
    if (!found) res.push(bpA);
  }
  // console.log(`[segments.bpsRemoveLoops] tabBps:${JSON.stringify(tabBps)}`);
  // console.log(`[segments.bpsRemoveLoops] res:${JSON.stringify(res)}`);
  return res;
}

function segsManageStartSegment(tr) {
  const segments = tr.segments;
  if (U.isHoriz(tr.from.side) != U.isHoriz(tr.seg[0])) return this.segments;

}

export function segsNormalise(segments) {
  const tabBps = segsToBps(segments);
  const tabBps1 = bpsRemoveLoops(tabBps);
  const segs1 = bpsToSegs(tabBps1);
  return [segs1, 0, 0, 0, 0];
}
