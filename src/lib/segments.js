"use strict";

import * as U from "src/lib/utils";
import { hsm, cCtx, hElems, hCtx, modeRef } from "src/classes/Chsm";


// export function drawArrow(cCtx, x, y, dir) {
//   // console.log(`[utils.drawArrow] dir ${dir}`);
//   function C(val) {
//     const x = U.mmToPL(val);
//     return x;
//     // if (!cCtx.lineWidth % 2) return Math.round(x);
//     // return Math.round(x) + 0.5;
//   }
//   let lenP = C(hsm.settings.arrowLengthMm);
//   let widthP = C(hsm.settings.arrowWidthMm);
//   const xP = C(x);
//   const yP = C(y);
//   // Avoid erasing state border
//   cCtx.lineJoin = "round";
//   cCtx.beginPath();
//   switch (dir) {
//     case "N":
//       lenP = -lenP;
//     // eslint-disable-next-line no-fallthrough
//     case "S":
//       cCtx.moveTo(xP - widthP, yP - lenP);
//       cCtx.lineTo(xP, yP);
//       cCtx.lineTo(xP + widthP, yP - lenP);
//       break;
//     case "W":
//       lenP = -lenP;
//     // eslint-disable-next-line no-fallthrough
//     case "E":
//       cCtx.moveTo(xP - lenP, yP - widthP);
//       cCtx.lineTo(xP, yP);
//       cCtx.lineTo(xP - lenP, yP + widthP);
//       break;
//   }
//   cCtx.stroke();
//   cCtx.lineJoin = "miter";
// }

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

// Transform segments to biPoints
function segsToBps(segments) {
  // console.warn(`[segments.segsToBps] segments:${JSON.stringify(segments)}`);
  const epsilon = hsm.settings.epsilonMm;
  const tabBps = [];
  let [x0Prev, y0Prev] = [0, 0];
  let dirPrev;
  let lenPrev = 0;
  let [x0, y0] = [0, 0];
  let x1, y1;
  let mustCombine = false;
  for (let seg of segments) {
    // console.log(`[segments.segsToBps] seg:${seg.dir}/${seg.len}`);
    if (mustCombine) {
      // Patch this segment with previous one
      // console.log(`[segments.segsToBps] Combinimg: prev:"${dirPrev}"/${lenPrev} with :${seg.dir}/${seg.len}`);
      if (dirPrev) {
        let dl = dirPrev == seg.dir ? lenPrev : -lenPrev;
        seg.len += dl;
        seg = U.normalizeSegment(seg);
        tabBps.pop();
        [x0, y0] = [x0Prev, y0Prev];
      }
      else {
        // console.warn(`[segments.segsToBps] Null dirPrev`);
      }
      mustCombine = false;
    }
    if (Math.abs(seg.len) <= epsilon) {
      // console.log(`[segments.segsToBps] Short segment:${seg.dir}/${seg.len}`);
      mustCombine = true;
      continue; // Remove short segments
    }
    [x1, y1] = nextXY(seg, x0, y0);
    tabBps.push({ from: { x: x0, y: y0 }, to: { x: x1, y: y1 } });
    dirPrev = seg.dir;
    lenPrev = seg.len;
    [x0Prev, y0Prev] = [x0, y0]
    [x0, y0] = [x1, y1];
  }
  // console.log(`[segments.segsToBps] tabBps:${JSON.stringify(tabBps)}`);
  // console.log(`[segments.segsToBps] nsegs:${tabBps.length}`);
  return tabBps;
}

function bpsToSegs(tabBps) {
  const epsilon = hsm.settings.epsilonMm;
  const segments = [];
  for (let bp of tabBps) {
    let dir, len;
    if (Math.abs(bp.from.y - bp.to.y) < epsilon) {
      // Horizontal
      if (bp.to.x > bp.from.x) {
        dir = "E";
        len = bp.to.x - bp.from.x;
      }
      else if (bp.to.x < bp.from.x) {
        dir = "W";
        len = bp.from.x - bp.to.x;
      }
      else continue; // Null segment
    }
    else if (Math.abs(bp.from.x - bp.to.x) < epsilon) {
      if (bp.to.y > bp.from.y) {
        dir = "S";
        len = bp.to.y - bp.from.y;
      }
      else if (bp.to.y < bp.from.y) {
        dir = "N";
        len = bp.from.y - bp.to.y;
      }
      else continue; // Null segment
    }
    else {
      console.error(`[segments.bpsToSegs] invalid segment from:${JSON.stringify(bp.from)} to:${JSON.stringify(bp.to)}`);
    }
    segments.push({ len: len, dir: dir });
  }
  // console.log(`[segments.bpsToSegs] segments:${JSON.stringify(segments)}`);
  return segments;
}

function bpsRemoveLoops(tabBps) {
  const nbBps = tabBps.length;
  const res = [];
  // console.log(`[segments.bpsRemoveLoops] 0 tabBps:${JSON.stringify(tabBps)}`);
  for (let ia = 0; ia < nbBps; ia++) {
    const bpA = tabBps[ia];
    let found = false;
    // for (let ib = ia + 2; ib < nbBps; ib++) {
    for (let ib = nbBps - 1; ib > ia + 1; ib--) {
      const p = bpIntersect(tabBps[ia], tabBps[ib]);
      if (p == null) continue;
      // console.log(`[segments.bpsRemoveLoops] Xfound intersect #${ia} #${ib}`);
      res.push({ from: bpA.from, to: p });
      res.push({ from: p, to: tabBps[ib].to });
      ia = ib;
      found = true;
      break;
    }
    if (!found) res.push(bpA);
  }
  // console.log(`[segments.bpsRemoveLoops] 1 tabBps:${JSON.stringify(tabBps)}`);
  // console.log(`[segments.bpsRemoveLoops] res:${JSON.stringify(res)}`);
  return res;
}

function mergeSameDirSegments(segments) {
  // console.log(`[segments.mergeSameDirSegments] res:${JSON.stringify(segments)}`);
  const res = [segments[0]];
  let hv = U.isHoriz(segments[0].dir);
  segments.shift();
  for (let seg of segments) {
    if (U.isHoriz(seg.dir) == hv) {
      // Same dir, must combine
      if (seg.dir == res.at(-1).dir) res.at(-1).len += seg.len;
      else res.at(-1).len -= seg.len;
      // res.at(-1) = U.normalizeSegment(res[-1]);
    }
    else {
      hv = U.isHoriz(seg.dir);
      res.push(seg);
    }
  }
  return res;
}

export function segsNormalise(segments) {
  const tabBps = segsToBps(segments);
  const tabBps1 = bpsRemoveLoops(tabBps);
  const segs1 = bpsToSegs(tabBps1);
  const segs2 = mergeSameDirSegments(segs1);
  return segs2;
}
