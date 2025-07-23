"use strict";

import * as U from "src/lib/utils";
import { hsm, hElems, hCtx } from "src/classes/Chsm";

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
  const [x0, y0] = anchorToXY(tr.start);
  const [x1, y1] = anchorToXY(tr.end);
  if (tr.start.side == tr.end.side) {
    const [dx, dy] = [x1 - x0, y1 - y0];
    let radius = hsm.settings.maxTransRadiusMm;
    const side = tr.start.side;
    let dir1, dir2;
    switch (side) {
      case "T":
      case "B":
        dir1 = side == "T" ? "N" : "S";
        dir2 = side == "T" ? "S" : "N";
        segments.push({ dir: dir1, len: radius * 1.5 });
        segments.push({ dir: dx > 0 ? "E" : "W", len: Math.abs(dx) });
        segments.push({ dir: dir2, len: radius * 1.5 });
        break;
      case "R":
      case "L":
        dir1 = side == "R" ? "E" : "W";
        dir2 = side == "R" ? "W" : "E";
        segments.push({ dir: dir1, len: radius * 1.5 });
        segments.push({ dir: dy > 0 ? "S" : "N", len: Math.abs(dy) });
        segments.push({ dir: dir2, len: radius * 1.5 });
        break;
    }
  }
  else {
    segments = U.connectPoints(x0, y0, tr.start.side, x1, y1, tr.end.side, false);
  }
  // console.log(`[Ctr.connectSelf] Segments:${JSON.stringify(segments)}`);
  return segments;
}

export function createSegments(tr) {
  // TODO avoid making internal transitions
  if (tr.start.id == tr.end.id) return createSelfSegments(tr);
  const r = hsm.settings.maxTransRadiusMm * 1.5;
  let segments = [];
  const [x0, y0] = anchorToXY(tr.start);
  const [x1, y1] = anchorToXY(tr.end);
  const side0 = tr.start.side;
  const side1 = tr.end.side;
  const [dx, dy] = [Math.abs(x1 - x0), Math.abs(y1 - y0)];
  if (x1 == x0) {
    if (y1 == y0) return segments;
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
            segments.push({ dir: y1 > y0 ? "S" : "N", len: dy - dy / 2 });
          }
        }
          break;
        case "R":
        case "L": {
          segments.push({ dir: y1 > y0 ? "S" : "N", len: dy });
          segments.push({ dir: x1 > x0 ? "E" : "W", len: dx });
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
          if (y1 != y0) segments.push({ dir: y1 > y0 ? "S" : "N", len: dy });
        }
          break;
        case "R":
        case "L": {
          // console.log(`[trUtils.connectPoints] side0:${side0} side1:${side1}`);
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
              segments.push({ dir: x1 > x0 ? "E" : "W", len: dx - dx / 2 });
            }
          }
        }
          break;
      }
      break;
    }
  }
  // console.log(`[trUtils.connectPoints] Segments:${JSON.stringify(segments)}`);
  return segments;
}

export function reverseTr(tr) {
  const temp = tr.start;
  tr.start = tr.end;
  tr.end = temp;
  tr.segments = tr.segments.reverse();
  for (const segment of tr.segments) {
    if (segment.dir == "W") segment.dir = "E";
    else if (segment.dir == "E") segment.dir = "W";
    else if (segment.dir == "N") segment.dir = "S";
    else if (segment.dir == "S") segment.dir = "N";
    else console.warn(`[trUtils.reverseTr] Unknown dir:${segment.dir}`);
  }
}

function nextXY(segment, x, y) {
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

function reverseDir(dir) {
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

function isHoriz(dir) {
  switch (dir) {
    case "N":
    case "S":
      return false;
    case "W":
    case "E":
      return true;
  }
}

export function dragFirstSegment(tr, dx, dy) {
  if (dx == 0 && dy == 0) return;
  // console.log(`[trUtils.dragFirstSegment] (${tr.id}) START segments:${JSON.stringify(tr.segments)}`);
  const dragCtx = hCtx.getDragCtx();
  const [x, y] = [dragCtx.xx0 + dx, dragCtx.yy0 + dy];
  // console.log(`[trUtils.dragFirstSegment] (${tr.id}) (x:${x}, y:${y})`);
  const segA = tr.segments[0];
  const segB = tr.segments[1];
  const seg1 = {};
  const seg2 = {};
  const seg3 = {};
  const seg4 = {};
  const [xs, ys] = anchorToXY(tr.start);
  const [xe, ye] = nextXY(segA, xs, ys);
  const [d, pos] = U.distToSegmentSquared({ x: x, y: y }, { x: xs, y: ys }, { x: xe, y: ye });
  // console.log(`[trUtils.dragFirstSegment] (${tr.id}) segA.len:${segA.len} (xx0:${dragCtx.xx0}, yy0:${dragCtx.yy0}) (dx:${dx}, dy:${dy}) (x:${x}, y:${y}) (xs:${xs}, ys:${ys})  (xe:${xe}, ye:${ye}) d:${d.toFixed(2)} pos:${pos.toFixed(2)}`);
  seg1.len = segA.len * pos;
  seg1.dir = segA.dir;
  seg2.len = Math.abs(isHoriz(segA.dir) ? dy : dx);
  if (isHoriz(segA.dir)) seg2.dir = dy >= 0 ? "S" : "N";
  else seg2.dir = dx >= 0 ? "E" : "W";
  seg3.dir = segA.dir;
  seg3.len = segA.len - seg1.len;

  if (isHoriz(segB.dir)) seg4.len = segB.len - dx;
  else seg4.len = segB.len - dy;
  seg4.dir = segB.dir;
  if (seg4.len < 0) {
    seg4.len = -seg4.len;
    seg4.dir = reverseDir(seg4.dir);
  }

  // console.log(`[trUtils.dragFirstSegment] seg4: dir:${seg4.dir} len:${seg4.len}`);
  tr.segments.shift();
  tr.segments.shift();
  tr.segments.unshift(seg1, seg2, seg3, seg4);
  dragCtx.zone = 2;
  // console.log(`[trUtils.dragFirstSegment] (${tr.id}) END segments:${JSON.stringify(tr.segments)}`);
}

export function dragLastSegment(tr, dx, dy) {
  if (dx == 0 && dy == 0) return;
  // console.log(`[trUtils.dragFinalSegment] (${tr.id}) START segments:${JSON.stringify(tr.segments)}`);
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
  const [xs, ys] = anchorToXY(tr.end);
  const [xe, ye] = prevXY(segA, xs, ys);
  const [d, pos] = U.distToSegmentSquared({ x: x, y: y }, { x: xs, y: ys }, { x: xe, y: ye });
  // console.log(`[trUtils.dragFinalSegment] (${tr.id}) segA.len:${segA.len} (xx0:${dragCtx.xx0}, yy0:${dragCtx.yy0}) (dx:${dx}, dy:${dy}) (x:${x}, y:${y}) (xs:${xs}, ys:${ys})  (xe:${xe}, ye:${ye}) d:${d.toFixed(2)} pos:${pos.toFixed(2)}`);
  seg1.len = segA.len * (pos);
  seg1.dir = segA.dir;
  seg2.len = Math.abs(isHoriz(segA.dir) ? dy : dx);
  if (isHoriz(segA.dir)) seg2.dir = dy >= 0 ? "N" : "S";
  else seg2.dir = dx >= 0 ? "W" : "E";
  seg3.dir = segA.dir;
  seg3.len = segA.len - seg1.len;

  if (isHoriz(segB.dir)) seg4.len = segB.len + dx;
  else seg4.len = segB.len + dy;
  seg4.dir = segB.dir;
  if (seg4.len < 0) {
    seg4.len = -seg4.len;
    seg4.dir = reverseDir(seg4.dir);
  }

  // console.log(`[trUtils.dragFinalSegment] seg4: dir:${seg4.dir} len:${seg4.len}`);
  tr.segments.pop();
  tr.segments.pop();
  tr.segments.push(seg4, seg3, seg2, seg1);
  dragCtx.zone = this.segments.length - 3;
  // console.log(`[trUtils.dragFinalSegment] (${tr.id}) END segments:${JSON.stringify(tr.segments)}`);
}

export function dragEndAnchor(tr, dx, dy) {
  const dragCtx = hCtx.getDragCtx();
  const [theElem, theSide, thePos] = tr.findNearestTarget(dragCtx.xx0 + dx, dragCtx.yy0 + dy);
  console.log(`[trUtils.dragEndAnchor] (${tr.id}) theElem:${theElem?.id} theSide:${theSide} thePos:${thePos?.toFixed(2)}`);
  tr.end.id = theElem.id;
  tr.end.side = theSide;
  tr.end.pos = thePos;
  tr.segments = tr.getInitialSegments();
}

export function dragStartAnchor(tr, dx, dy) {
  const idz = tr.idz();
  const dragCtx = hCtx.getDragCtx();
  const [theElem, theSide, thePos] = tr.findNearestTarget(dragCtx.xx0 + dx, dragCtx.yy0 + dy);
  // console.log(`[trUtils.dragStartAnchor] (${tr.id}) theElem:${theElem?.id} theSide:${theSide} thePos:${thePos?.toFixed(2)}`);
  tr.start.id = theElem.id;
  tr.start.side = theSide;
  tr.start.pos = thePos;
  tr.segments = tr.getInitialSegments();
}
