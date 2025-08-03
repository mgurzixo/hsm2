"use strict";

import * as U from "src/lib/utils";
import { hsm, hElems, hCtx } from "src/classes/Chsm";
import { nextXY } from "src/lib/segments";
import { patchMouseDown } from "src/lib/canvasListeners";

// All distances in mm from folio origin

// return anchor in mm in folio frame
export function anchorToXY(anchor) {
  const elem = hElems.getElemById(anchor.id);
  if (anchor.pos > 1) anchor.pos = 1;
  let [x0, y0] = [elem.geo.x0, elem.geo.y0];
  if (elem.geo.xx0 == undefined) {
    for (let parent = elem.parent; parent; parent = parent.parent) {
      x0 += parent.geo.x0;
      y0 += parent.geo.y0;
    }
  } else[x0, y0] = [elem.geo.xx0, elem.geo.yy0];
  const r = hsm.settings.stateRadiusMm;
  const w = elem.geo.width;
  const h = elem.geo.height;
  switch (anchor.side) {
    case "R":
      x0 += w;
      y0 += r + (h - 2 * r) * anchor.pos;
      break;
    case "B":
      x0 += r + (w - 2 * r) * anchor.pos;
      y0 += h;
      break;
    case "L":
      y0 += r + (h - 2 * r) * anchor.pos;
      break;
    case "T":
    default:
      x0 += r + (w - 2 * r) * anchor.pos;
      break;
  }
  return [x0, y0];
}

function createSelfSegments(tr) {
  // console.log(`[Ctr.connectSelf]`);
  let segments = [];
  const dsl = hsm.settings.defaultSegmentLengthMm;
  const [x0, y0] = anchorToXY(tr.from);
  let [x1, y1] = anchorToXY(tr.to);
  if (x0 == x1) x1 += 0.1;
  if (y0 == y1) y1 += 0.1;
  const [dx, dy] = [x1 - x0, y1 - y0];
  const [dxa, dya] = [Math.abs(dx), Math.abs(dy)];
  const side0 = tr.from.side;
  const side1 = tr.to.side;
  const dirV = dy > 0 ? "S" : "N";
  const dirH = dx > 0 ? "E" : "W";

  if (U.isHoriz(side0)) {
    if (U.isHoriz(side1)) {
      if (side0 == side1) {
        if (tr.isInternal) {
          segments.push({ dir: dirV, len: dsl });
          segments.push({ dir: dirH, len: dxa });
          segments.push({ dir: U.reverseDir(dirV), len: dsl });
        }
        else {
          segments.push({ dir: U.reverseDir(dirV), len: dsl });
          segments.push({ dir: dirH, len: dxa });
          segments.push({ dir: dirV, len: dsl });
        }
      } else {
        segments.push({ dir: dirV, len: dya / 2 });
        segments.push({ dir: dirH, len: dxa });
        segments.push({ dir: dirV, len: dya - dya / 2 });
      }
    } else {
      segments.push({ dir: dirV, len: dya });
      segments.push({ dir: dirH, len: dxa });
    }
  } else {
    // Side0 vertical
    if (U.isHoriz(side1)) {
      segments.push({ dir: dirH, len: dxa });
      segments.push({ dir: dirV, len: dya });
    } else {
      if (tr.isInternal) {
        segments.push({ dir: dirH, len: dsl });
        segments.push({ dir: dirV, len: dya });
        segments.push({ dir: U.reverseDir(dirH), len: dsl });
      }
      else {
        segments.push({ dir: dirH, len: dsl });
        segments.push({ dir: dirV, len: dya });
        segments.push({ dir: U.reverseDir(dirH), len: dsl });
      }
    }
  }
  return segments;
}

export function createSegments(tr) {
  if (tr.from.id == tr.to.id) return createSelfSegments(tr);
  let segments = [];
  const dsl = hsm.settings.defaultSegmentLengthMm;
  const [x0, y0] = anchorToXY(tr.from);
  const [x1, y1] = anchorToXY(tr.to);
  const [dx, dy] = [x1 - x0, y1 - y0];
  const [dxa, dya] = [Math.abs(dx), Math.abs(dy)];
  const side0 = tr.from.side;
  const side1 = tr.to.side;
  const dirV = dy > 0 ? "S" : "N";
  const dirH = dx > 0 ? "E" : "W";
  if (U.isHoriz(side0)) {
    if (U.isHoriz(side1)) {
      if (dxa != 0) {
        const dir = dya - dsl >= 0 ? dirV : U.reverseDir(dirV);
        segments.push({ dir: dirV, len: dsl });
        segments.push({ dir: dirH, len: dxa });
        segments.push({ dir: dir, len: Math.abs(dya - dsl) });
      } else {
        segments.push({ dir: dirV, len: dya });
      }
    }
    else {
      segments.push({ dir: dirV, len: dya });
      segments.push({ dir: dirH, len: dxa });
    }
  }
  else {
    // Side0 vertical
    if (U.isHoriz(side1)) {
      // Side1 horizontal
      segments.push({ dir: dirH, len: dxa });
      segments.push({ dir: dirV, len: dya });

    } else {
      // Side1 vertical
      if (dya != 0) {
        segments.push({ dir: dirH, len: dxa / 2 });
        segments.push({ dir: dirV, len: dya });
        segments.push({ dir: dirH, len: dxa - dxa / 2 });
      } else {
        segments.push({ dir: dirH, len: dxa });
      }
    }
  }
  // console.log(`[trUtils.connectPoints] Segments:${JSON.stringify(segments)}`);
  return segments;
}

export function reverseTr(tr) {
  const temp = tr.from;
  tr.from = tr.to;
  tr.to = temp;
  tr.segments = tr.segments.reverse();
  for (const segment of tr.segments) {
    if (segment.dir == "W") segment.dir = "E";
    else if (segment.dir == "E") segment.dir = "W";
    else if (segment.dir == "N") segment.dir = "S";
    else if (segment.dir == "S") segment.dir = "N";
    else console.warn(`[trUtils.reverseTr] Unknown dir:${segment.dir}`);
  }
}

function prevXY(segment, x, y) {
  switch (segment.dir) {
    case "N":
      y += segment.len;
      break;
    case "S":
      y -= segment.len;
      break;
    case "W":
      x += segment.len;
      break;
    case "E":
      x -= segment.len;
      break;
  }
  return [x, y];
}



export function dragNormalSegment(tr, dx, dy) {
  // console.log(`[trUtils.dragNormalSegment] (${tr.id}) FROM segments:${JSON.stringify(tr.segments)}`);
  // console.log(`[trUtils.dragNormalSegment] ------------------------------------------`);
  const dragCtx = hCtx.getDragCtx();
  // console.log(`[trUtils.dragNormalSegment] (${tr.id})  xxD:${dragCtx.xxD.toFixed(3)} dx0:${dx0.toFixed(3)} dx:${dx.toFixed(3)})`);
  if (dx == 0 && dy == 0) return;
  // dx -= dragCtx.xxD;
  // dy -= dragCtx.yyD;
  const nA = dragCtx.zone;
  // console.log(`[trUtils.dragNormalSegment] (${tr.id}) (x:${x}, y:${y})`);
  const segA = tr.segments[nA];
  const seg1 = tr.segments[nA - 1];
  const seg2 = tr.segments[nA + 1];
  if (typeof dragCtx.seg1Orig == "undefined") {
    dragCtx.seg1Orig = { len: seg1.len, dir: seg1.dir };
    dragCtx.seg2Orig = { len: seg2.len, dir: seg2.dir };
  }
  const hDir = U.isHoriz(segA.dir);
  const dir1 = dragCtx.seg1Orig.dir;
  const len1 = dragCtx.seg1Orig.len;
  const dir2 = dragCtx.seg2Orig.dir;
  const len2 = dragCtx.seg2Orig.len;

  if (hDir) {
    if (dir1 == "N") {
      if (dir2 == "N") {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) NN`);
        // OK
        seg1.len = len1 - dy;
        seg2.len = len2 + dy;
      } else {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) NS`);
        // OK
        seg1.len = len1 - dy;
        seg2.len = len2 - dy;
      }
    }
    else {
      if (dir2 == "N") {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) SN`);
        // OK
        seg1.len = len1 + dy;
        seg2.len = len2 + dy;
      } else {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) SS`);
        // OK
        seg1.len = len1 + dy;
        seg2.len = len2 - dy;
      }
    }
  }
  else {
    if (dir1 == "W") {
      if (dir2 == "W") {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) WW`);
        // OK
        seg1.len = len1 - dx;
        seg2.len = len2 + dx;
      } else {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) WE`);
        // OK
        seg1.len = len1 - dx;
        seg2.len = len2 - dx;
      }
    }
    else {
      if (dir2 == "W") {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) EW`);
        // OK
        seg1.len = len1 + dx;
        seg2.len = len2 + dx;
      } else {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) EE`);
        // OK F bad L
        seg1.len = len1 + dx;
        seg2.len = len2 - dx;
      }
    }
  }

  seg1.dir = dir1;
  seg2.dir = dir2;
  if (seg1.len <= 0) {
    seg1.len = -seg1.len;
    seg1.dir = U.reverseDir(seg1.dir);
  }
  if (seg2.len <= 0) {
    seg2.len = -seg2.len;
    seg2.dir = U.reverseDir(seg2.dir);
  }
  // console.log(`[trUtils.dragNormalSegment] (${tr.id}) TO segments:${JSON.stringify(tr.segments)}`);
  // console.log(`[trUtils.dragNormalSegment] (${tr.id}) nbSeg:${tr.segments.length} seg#:${nA} l2:${segA.len}`);
}

export function dragFirstSegment(tr, dx, dy) {
  if (dx == 0 && dy == 0) return;
  // console.log(`[trUtils.dragFirstSegment] (${tr.id}) FROM segments:${JSON.stringify(tr.segments)}`);
  const dragCtx = hCtx.getDragCtx();
  const [x, y] = [dragCtx.xx0 + dx, dragCtx.yy0 + dy];
  // console.log(`[trUtils.dragFirstSegment] (${tr.id}) (x:${x}, y:${y})`);
  const segA = tr.segments[0];
  const segB = tr.segments[1];
  const seg1 = {};
  const seg2 = {};
  const seg3 = {};
  const seg4 = {};
  const [xs, ys] = anchorToXY(tr.from);
  const [xe, ye] = nextXY(segA, xs, ys);
  const [d, pos] = U.distToSegmentSquared({ x: x, y: y }, { x: xs, y: ys }, { x: xe, y: ye });
  // console.log(`[trUtils.dragFirstSegment] (${tr.id}) segA.len:${segA.len} (xx0:${dragCtx.xx0}, yy0:${dragCtx.yy0}) (dx:${dx}, dy:${dy}) (x:${x}, y:${y}) (xs:${xs}, ys:${ys})  (xe:${xe}, ye:${ye}) d:${d.toFixed(2)} pos:${pos.toFixed(2)}`);
  seg1.len = segA.len * pos;
  seg1.dir = segA.dir;


  if (U.isHoriz(segB.dir)) seg2.len = (segB.dir == "E" ? dx : -dx); // OK
  else seg2.len = (segB.dir == "S" ? dy : -dy);
  seg2.dir = segB.dir;
  if (seg2.len < 0) {
    seg2.len = -seg2.len;
    seg2.dir = U.reverseDir(seg2.dir);
  }

  seg3.dir = segA.dir;
  seg3.len = segA.len - seg1.len;
  if (seg3.len < 0) {
    seg3.len = -seg3.len;
    seg3.dir = U.reverseDir(seg3.dir);
  }

  console.log(`[trUtils.dragFirstSegment] segA:${segA.dir} dy:${dy}`);
  console.log(`[trUtils.dragFirstSegment] segB:${segB.dir} dx:${dx}`);
  if (U.isHoriz(segB.dir)) seg4.len = segB.len + (segB.dir == "E" ? -dx : dx);
  else seg4.len = segB.len + (segB.dir == "N" ? dy : -dy);
  seg4.dir = segB.dir;
  if (seg4.len < 0) {
    seg4.len = -seg4.len;
    seg4.dir = U.reverseDir(seg4.dir);
  }

  // console.log(`[trUtils.dragFirstSegment] seg4: dir:${seg4.dir} len:${seg4.len}`);
  tr.segments.shift();
  tr.segments.shift();
  tr.segments.unshift(seg1, seg2, seg3, seg4);
  dragCtx.zone = 2;
  patchMouseDown();

  console.log(`[trUtils.dragFirstSegment] (${tr.id}) TO segments:${JSON.stringify(tr.segments)}`);
}

export function dragLastSegment(tr, dx, dy) {
  if (dx == 0 && dy == 0) return;
  // console.log(`[trUtils.dragLastSegment] (${tr.id}) FROM segments:${JSON.stringify(tr.segments)}`);
  const dragCtx = hCtx.getDragCtx();
  const [x, y] = [dragCtx.xx0 + dx, dragCtx.yy0 + dy];
  // console.log(`[trUtils.dragLastSegment] (${tr.id}) (x:${x}, y:${y})`);
  const n = tr.segments.length - 1;
  const segA = tr.segments[n];
  const segB = tr.segments[n - 1];
  const seg1 = {};
  const seg2 = {};
  const seg3 = {};
  const seg4 = {};
  const [xs, ys] = anchorToXY(tr.to);
  const [xe, ye] = prevXY(segA, xs, ys);
  const [d, pos] = U.distToSegmentSquared({ x: x, y: y }, { x: xs, y: ys }, { x: xe, y: ye });
  // console.log(`[trUtils.dragLastSegment] (${tr.id}) segA.len:${segA.len} (xx0:${dragCtx.xx0}, yy0:${dragCtx.yy0}) (dx:${dx}, dy:${dy}) (x:${x}, y:${y}) (xs:${xs}, ys:${ys})  (xe:${xe}, ye:${ye}) d:${d.toFixed(2)} pos:${pos.toFixed(2)}`);
  seg1.len = segA.len * (pos) + (segA.dir == "E" ? -2 * dy : -dy);
  seg1.dir = segA.dir;

  console.log(`[trUtils.dragLastSegment] segA:${segA.dir} dy:${dy}`);
  if (U.isHoriz(segA.dir)) seg2.len = (segA.dir == "E" ? -dy : dy);
  else seg2.len = (segA.dir == "S" ? -dx : dx);
  seg2.dir = segB.dir;
  if (seg2.len < 0) {
    seg2.len = -seg2.len;
    seg2.dir = U.reverseDir(seg2.dir);
  }

  seg3.dir = segA.dir;
  seg3.len = segA.len - seg1.len;
  if (seg3.len < 0) {
    seg3.len = -seg3.len;
    seg3.dir = U.reverseDir(seg3.dir);
  }

  console.log(`[trUtils.dragLastSegment] segB:${segB.dir} dx:${dx}`);
  if (U.isHoriz(segB.dir)) seg4.len = segB.len + (segB.dir == "E" ? dx : -dx);
  else seg4.len = segB.len + (segB.dir == "S" ? dy : -dy);
  seg4.dir = segB.dir;
  if (seg4.len < 0) {
    seg4.len = -seg4.len;
    seg4.dir = U.reverseDir(seg4.dir);
  }

  // console.log(`[trUtils.dragLastSegment] seg4: dir:${seg4.dir} len:${seg4.len}`);
  tr.segments.pop();
  tr.segments.pop();
  tr.segments.push(seg4, seg3, seg2, seg1);
  dragCtx.zone = tr.segments.length - 3;
  patchMouseDown();
  console.log(`[trUtils.dragLastSegment] (${tr.id}) xxD:${dx} yyD:${dy}`);
  // console.log(`[trUtils.dragLastSegment] (${tr.id}) TO segments:${JSON.stringify(tr.segments)}`);
}

export function dragToAnchor(dx, dy) {
  const dragCtx = hCtx.getDragCtx();
  const tr = U.getElemById(dragCtx.id);
  const [theElem, theSide, thePos] = tr.findNearestLegalTarget(tr.from, dragCtx.xx0 + dx, dragCtx.yy0 + dy);
  // console.log(`[trUtils.dragToAnchor] (${tr.id}) theElem:${theElem?.id} theSide:${theSide} thePos:${thePos?.toFixed(2)}`);
  tr.to.id = theElem.id;
  tr.to.side = theSide;
  tr.to.pos = thePos;
  const tr0 = dragCtx.tr0;
  if (tr.to.id == tr0.to.id && tr.to.side == tr0.to.side) {
    // Only pos changed, try to patch penultimate original segment
    if (tr0.segments.length >= 2) {
      const to = U.getElemById(tr.to.id);
      const [x0, y0] = to.makeTrXY(tr0.to.side, tr0.to.pos);
      const [x1, y1] = to.makeTrXY(tr.to.side, tr.to.pos);
      const segments = structuredClone(tr0.segments);
      const idx = segments.length - 2;
      if (U.isHoriz(tr.to.side) && U.isHoriz(segments[idx].dir)) {
        segments[idx] = U.patchSegment(segments[idx], x1 - x0);
        tr.segments = segments;
      } else if (!U.isHoriz(tr.to.side) && !U.isHoriz(segments[idx].dir)) {
        segments[idx] = U.patchSegment(segments[idx], y1 - y0);
        tr.segments = segments;
      } else tr.segments = tr.getInitialSegments();
    }
    else tr.segments = tr.getInitialSegments();
  }
  else tr.segments = tr.getInitialSegments();
  // console.log(`[trUtils.dragToAnchor] (${tr.id}) Segments len:${tr.segments.length}`);

}

export function dragFromAnchor(dx, dy) {
  const dragCtx = hCtx.getDragCtx();
  const tr = U.getElemById(dragCtx.id);
  // const idz = tr.idz();
  const [theElem, theSide, thePos] = tr.findNearestLegalTarget(tr.to, dragCtx.xx0 + dx, dragCtx.yy0 + dy);
  // console.log(`[trUtils.dragFromAnchor] (${tr.id}) theElem:${theElem?.id} theSide:${theSide} thePos:${thePos?.toFixed(2)}`);
  tr.from.id = theElem.id;
  tr.from.side = theSide;
  tr.from.pos = thePos;
  const tr0 = dragCtx.tr0;
  if (tr.from.id == tr0.from.id && tr.from.side == tr0.from.side) {
    // Only pos changed, try to patch penultimate original segment
    if (tr0.segments.length >= 2) {
      const from = U.getElemById(tr.from.id);
      const [x0, y0] = from.makeTrXY(tr0.from.side, tr0.from.pos);
      const [x1, y1] = from.makeTrXY(tr.from.side, tr.from.pos);
      const segments = structuredClone(tr0.segments);
      const idx = 1;
      if (U.isHoriz(tr.from.side) && U.isHoriz(segments[idx].dir)) {
        segments[idx] = U.patchSegment(segments[idx], x0 - x1);
        tr.segments = segments;
      } else if (!U.isHoriz(tr.from.side) && !U.isHoriz(segments[idx].dir)) {
        segments[idx] = U.patchSegment(segments[idx], y0 - y1);
        tr.segments = segments;
      } else tr.segments = tr.getInitialSegments();
    }
    else tr.segments = tr.getInitialSegments();
  }
  else tr.segments = tr.getInitialSegments();
}
