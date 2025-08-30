"use strict";

import * as U from "src/lib/utils";
import { hsm, hElems, hCtx } from "src/classes/Chsm";
import { nextXY } from "src/lib/segments";
import { patchMouseDown } from "src/lib/rootElemListeners";

// All distances in mm from folio frame

// return anchor in mm in folio frame
export function anchorToXYF(anchor, pos = anchor.pos) {
  const elem = hElems.getElemById(anchor.id);
  // console.log(`[trUtils.anchorToXYF] id:${anchor.id} elem:${elem}`);
  if (pos > 1) pos = 1;
  if (pos < 0) pos = 0;
  let v = elem.getOriginXYF();
  if (!v) return v;
  let [x0, y0] = v;
  const [x, y] = elem.makeTrXY(anchor.side, pos);
  return [x + x0, y + y0];
}

// Returns pos from XY in folio frame optionally clamped to [0, 1]
export function XYFToAnchorPos(anchor, x, y, doClamp = true) {
  const minXY = anchorToXYF(anchor, 0);
  const maxXY = anchorToXYF(anchor, 1);
  let pos = 0;
  if (U.isHoriz(anchor.side)) pos = (x - minXY[0]) / (maxXY[0] - minXY[0]);
  else pos = (y - minXY[1]) / (maxXY[1] - minXY[1]);
  if (doClamp) {
    if (pos < 0) pos = 0;
    else if (pos > 1) pos = 1;
  }
  // console.log(`[trUtils.XYFToAnchorPos] pos:${pos}`);
  return pos;
}

function createSelfSegments(tr) {
  // console.log(`[trUtils.createSelfSegments]`);
  let segments = [];
  const dsl = hsm.settings.defaultSegmentLengthMm;
  const [x0, y0] = anchorToXYF(tr.from);
  let [x1, y1] = anchorToXYF(tr.to);
  if (x0 == x1) x1 += 0.1;
  if (y0 == y1) y1 += 0.1;
  const [dx, dy] = [x1 - x0, y1 - y0];
  const [dxa, dya] = [Math.abs(dx), Math.abs(dy)];
  const side0 = tr.from.side;
  const side1 = tr.to.side;
  let dirV = dy > 0 ? "S" : "N";
  let dirH = dx > 0 ? "E" : "W";
  if (side0 == side1) {
    if (U.isHoriz(side0)) {
      if (tr.isInternal) dirV = side0 == "T" ? "S" : "N";
      else dirV = side0 == "T" ? "N" : "S";
      // console.log(`[trUtils.createSelfSegments] side:${side0} internal:${tr.isInternal} dirV:${dirV}`);
    } else {
      if (tr.isInternal) dirH = side0 == "L" ? "E" : "W";
      else dirH = side0 == "L" ? "W" : "E";
    }
  }

  if (U.isHoriz(side0)) {
    if (U.isHoriz(side1)) {
      if (side0 == side1) {
        segments.push({ dir: dirV, len: dsl });
        segments.push({ dir: dirH, len: dxa });
        segments.push({ dir: U.reverseDir(dirV), len: dsl });
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
      segments.push({ dir: dirH, len: dsl });
      segments.push({ dir: dirV, len: dya });
      segments.push({ dir: U.reverseDir(dirH), len: dsl });
    }
  }
  return segments;
}

export function createSegments(tr) {
  if (tr.from.id == tr.to.id) return createSelfSegments(tr);
  let segments = [];
  const dsl = hsm.settings.defaultSegmentLengthMm;
  const [x0, y0] = anchorToXYF(tr.from);
  const [x1, y1] = anchorToXYF(tr.to);
  const [dx, dy] = [x1 - x0, y1 - y0];
  const [dxa, dya] = [Math.abs(dx), Math.abs(dy)];
  const side0 = tr.from.side;
  const side1 = tr.to.side;
  const dirV = dy > 0 ? "S" : "N";
  const dirH = dx > 0 ? "E" : "W";

  if (U.isHoriz(side0)) {
    if (U.isHoriz(side1)) {
      if (dxa != 0) {
        const dl = Math.min(dsl, dya);
        const dir = dya >= 0 ? dirV : U.reverseDir(dirV);
        segments.push({ dir: dirV, len: dl / 2 });
        segments.push({ dir: dirH, len: dxa });
        segments.push({ dir: dir, len: Math.abs(dya - dl / 2) });
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
        // Side2 vertical
        const dl = Math.min(dsl, dxa);
        const dir = dxa >= 0 ? dirH : U.reverseDir(dirH);
        segments.push({ dir: dirH, len: dl / 2 });
        segments.push({ dir: dirV, len: dya });
        segments.push({ dir: dirH, len: dxa - dl / 2 });
      } else {
        segments.push({ dir: dirH, len: dxa });
      }
    }
  }
  // console.log(`[trUtils.createSegments] Segments:${JSON.stringify(segments)}`);
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
  const nA = dragCtx.zone;
  // console.log(`[trUtils.dragNormalSegment] (${tr.id}) (x:${x}, y:${y})`);
  const segA = tr.segments[nA];
  const segPrev = tr.segments[nA - 1];
  const segNext = tr.segments[nA + 1];
  if (typeof dragCtx.segPrevOrig == "undefined") {
    dragCtx.segPrevOrig = { len: segPrev.len, dir: segPrev.dir };
    dragCtx.segNextOrig = { len: segNext.len, dir: segNext.dir };
  }
  const hDir = U.isHoriz(segA.dir);
  const dirPrev = dragCtx.segPrevOrig.dir;
  const lenPrev = dragCtx.segPrevOrig.len;
  const dirNext = dragCtx.segNextOrig.dir;
  const lenNext = dragCtx.segNextOrig.len;

  if (hDir) {
    if (dirPrev == "N") {
      if (dirNext == "N") {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) NN`);
        // OK
        segPrev.len = lenPrev - dy;
        segNext.len = lenNext + dy;
      } else {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) NS`);
        // OK
        segPrev.len = lenPrev - dy;
        segNext.len = lenNext - dy;
      }
    }
    else {
      if (dirNext == "N") {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) SN`);
        // OK
        segPrev.len = lenPrev + dy;
        segNext.len = lenNext + dy;
      } else {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) SS`);
        // OK
        segPrev.len = lenPrev + dy;
        segNext.len = lenNext - dy;
      }
    }
  }
  else {
    if (dirPrev == "W") {
      if (dirNext == "W") {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) WW`);
        // OK
        segPrev.len = lenPrev - dx;
        segNext.len = lenNext + dx;
      } else {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) WE`);
        // OK
        segPrev.len = lenPrev - dx;
        segNext.len = lenNext - dx;
      }
    }
    else {
      if (dirNext == "W") {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) EW`);
        // OK
        segPrev.len = lenPrev + dx;
        segNext.len = lenNext + dx;
      } else {
        // console.log(`[trUtils.dragNormalSegment] (${tr.id}) EE`);
        // OK F bad L
        segPrev.len = lenPrev + dx;
        segNext.len = lenNext - dx;
      }
    }
  }

  segPrev.dir = dirPrev;
  segNext.dir = dirNext;
  if (segPrev.len <= 0) {
    segPrev.len = -segPrev.len;
    segPrev.dir = U.reverseDir(segPrev.dir);
  }
  if (segNext.len <= 0) {
    segNext.len = -segNext.len;
    segNext.dir = U.reverseDir(segNext.dir);
  }
  // console.log(`[trUtils.dragNormalSegment] (${tr.id}) TO segments:${JSON.stringify(tr.segments)}`);
  // console.log(`[trUtils.dragNormalSegment] (${tr.id}) nbSeg:${tr.segments.length} seg#:${nA} l2:${segA.len}`);
}

function dragSingleSegment(tr, dx, dy) {
  // console.log(`[trUtils.dragSingleSegment] (${tr.id}) 0 ${JSON.stringify(tr.from)}`);
  const fromMinXY = anchorToXYF(tr.from, 0);
  const fromMaxXY = anchorToXYF(tr.from, 1);
  const toMinXY = anchorToXYF(tr.to, 0);
  const toMaxXY = anchorToXYF(tr.to, 1);
  const dragCtx = hCtx.getDragCtx();
  const fromXY = anchorToXYF(dragCtx.tr0.from);
  const toXY = anchorToXYF(dragCtx.tr0.to);
  if (U.isHoriz(tr.segments[0].dir)) {
    if (fromXY[1] + dy < fromMinXY[1]) dy = fromMinXY[1] - fromXY[1];
    if (fromXY[1] + dy > fromMaxXY[1]) dy = fromMaxXY[1] - fromXY[1];
    if (toXY[1] + dy < toMinXY[1]) dy = toMinXY[1] - toXY[1];
    if (toXY[1] + dy > toMaxXY[1]) dy = toMaxXY[1] - toXY[1];
    tr.from.pos = XYFToAnchorPos(tr.from, fromXY[0], fromXY[1] + dy);
    tr.to.pos = XYFToAnchorPos(tr.to, toXY[0], toXY[1] + dy);
  }
  else {
    if (fromXY[0] + dx < fromMinXY[0]) dx = fromMinXY[0] - fromXY[0];
    if (fromXY[0] + dx > fromMaxXY[0]) dx = fromMaxXY[0] - fromXY[0];
    if (toXY[0] + dx < toMinXY[0]) dx = toMinXY[0] - toXY[0];
    if (toXY[0] + dx > toMaxXY[0]) dx = toMaxXY[0] - toXY[0];
    tr.from.pos = XYFToAnchorPos(tr.from, fromXY[0] + dx, fromXY[1]);
    tr.to.pos = XYFToAnchorPos(tr.to, toXY[0] + dx, toXY[1]);
  }
}

export function dragFirstSegment(tr, dx, dy) {
  if (dx == 0 && dy == 0) return;
  if (tr.segments.length == 1) return dragSingleSegment(tr, dx, dy);
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
  const [xs, ys] = anchorToXYF(tr.from);
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

  // console.log(`[trUtils.dragFirstSegment] segA:${segA.dir} dy:${dy}`);
  // console.log(`[trUtils.dragFirstSegment] segB:${segB.dir} dx:${dx}`);
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

  // console.log(`[trUtils.dragFirstSegment] (${tr.id}) TO segments:${JSON.stringify(tr.segments)}`);
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
  const [xs, ys] = anchorToXYF(tr.to);
  const [xe, ye] = prevXY(segA, xs, ys);
  const [d, pos] = U.distToSegmentSquared({ x: x, y: y }, { x: xs, y: ys }, { x: xe, y: ye });
  // console.log(`[trUtils.dragLastSegment] (${tr.id}) segA.len:${segA.len} (xx0:${dragCtx.xx0}, yy0:${dragCtx.yy0}) (dx:${dx}, dy:${dy}) (x:${x}, y:${y}) (xs:${xs}, ys:${ys})  (xe:${xe}, ye:${ye}) d:${d.toFixed(2)} pos:${pos.toFixed(2)}`);
  seg1.len = segA.len * (pos) + (segA.dir == "E" ? -2 * dy : -dy);
  seg1.dir = segA.dir;

  // console.log(`[trUtils.dragLastSegment] segA:${segA.dir} dy:${dy}`);
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

  // console.log(`[trUtils.dragLastSegment] segB:${segB.dir} dx:${dx}`);
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
  // console.log(`[trUtils.dragLastSegment] (${tr.id}) xxD:${dx} yyD:${dy}`);
  // console.log(`[trUtils.dragLastSegment] (${tr.id}) TO segments:${JSON.stringify(tr.segments)}`);
}

function trySingleSegment(tr, isFrom) {
  const [xFrom, yFrom] = anchorToXYF(tr.from);
  const [xTo, yTo] = anchorToXYF(tr.to);
  const patchedAnchor = isFrom ? tr.from : tr.to;
  if (U.isHoriz(tr.from.side) && U.isHoriz(tr.to.side)) {
    const pos = XYFToAnchorPos(tr.from, isFrom ? xTo : xFrom, isFrom ? yFrom : yTo, false);
    if (pos >= 0 && pos <= 1) {
      if (yTo > yFrom) tr.segments = [{ dir: "S", len: yTo - yFrom }];
      else tr.segments = [{ dir: "N", len: yFrom - yTo }];
      patchedAnchor.pos = pos;
    }
  } else if (!U.isHoriz(tr.from.side) && !U.isHoriz(tr.to.side)) {
    const pos = XYFToAnchorPos(isFrom ? tr.from : tr.to, isFrom ? xFrom : xTo, isFrom ? yTo : yFrom, false);
    if (pos >= 0 && pos <= 1) {
      if (xTo > xFrom) tr.segments = [{ dir: "E", len: xTo - xFrom }];
      else tr.segments = [{ dir: "W", len: xFrom - xTo }];
      patchedAnchor.pos = pos;
    }
  }
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
        segments[idx] = U.addToSegment(segments[idx], x1 - x0);
        tr.segments = segments;
      } else if (!U.isHoriz(tr.to.side) && !U.isHoriz(segments[idx].dir)) {
        segments[idx] = U.addToSegment(segments[idx], y1 - y0);
        tr.segments = segments;
      } else tr.segments = tr.createSimpleSegments();
    }
    else tr.segments = tr.createSimpleSegments();
  }
  else tr.segments = tr.createSimpleSegments();
  const magnet = hsm.settings.magnetAttractionMm;
  if (tr.segments.length == 3 && tr.segments[1].len < magnet) trySingleSegment(tr, false);
}

export function dragFromAnchor(dx, dy) {
  const dragCtx = hCtx.getDragCtx();
  const tr = U.getElemById(dragCtx.id);
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
        segments[idx] = U.addToSegment(segments[idx], x0 - x1);
        tr.segments = segments;
      } else if (!U.isHoriz(tr.from.side) && !U.isHoriz(segments[idx].dir)) {
        segments[idx] = U.addToSegment(segments[idx], y0 - y1);
        tr.segments = segments;
      } else tr.segments = tr.createSimpleSegments();
    }
    else tr.segments = tr.createSimpleSegments();
  }
  else tr.segments = tr.createSimpleSegments();
  const magnet = hsm.settings.magnetAttractionMm;
  if (tr.segments.length == 3 && tr.segments[1].len < magnet) trySingleSegment(tr, true);
}
