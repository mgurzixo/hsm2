"use strict";

import * as U from "src/lib/utils";
import { hsm, cCtx, hElems, hCtx, modeRef } from "src/classes/Chsm";

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
  }
}

export function isHoriz(dir) {
  switch (dir) {
    case "N":
    case "S":
      return false;
    case "W":
    case "E":
      return true;
  }
  console.error(`[trUtils.isHoriz] Unknown dir:${dir}`);
}

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
        dir = reverseDir(dir);
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
