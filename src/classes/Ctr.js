"use strict";

import * as U from "src/lib/utils";
import { R, RR } from "src/lib/utils";
import { hsm, cCtx, hElems, hCtx, modeRef } from "src/classes/Chsm";
import { CbaseElem } from "src/classes/CbaseElem";
import { trStyles } from "src/lib/styles";
import { pathSegments } from "src/lib/segments";

export class Ctr extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
    this.lineWidth = 1.5;
    this.initialDrag = true;
  }

  load(transOptions) {
    this.segments = transOptions.segments;
    this.start = transOptions.start;
    this.end = transOptions.end;
    if (transOptions.color) this.color = transOptions.color;
    else delete (this.color);
  }

  dragStart() {
    // console.log(`[Ctr.dragStart] (${this.id})`);
    const idz = this.idz();
    if (modeRef.value == "") {
      if (idz.type == "A") {
        const dragCtx = {
          id: this.id,
          type: idz.zone,
          xx0: idz.x,
          yy0: idz.y,
        };
        // console.log(`[Cstate.insertTr] dragCtx:${JSON.stringify(dragCtx)}`);
        hCtx.setDragCtx(dragCtx);
      }
    }
    return this;
  }

  findNearestTarget(x0, y0) {
    // console.log(`[Ctr.findNearestTarget] (${this.id}) x0:${x0.toFixed()} y0:${y0.toFixed()}`);
    let bestDist = Number.MAX_VALUE;
    let bestElem;
    let bestPos;
    let bestSide = "T";

    function visit(myElem) {
      if (myElem.id.startsWith("S")) {
        for (let mySide of ["T", "R", "B", "L"]) {
          const geo = myElem.geo;
          let myX0, myY0, myX1, myY1;
          switch (mySide) {
            case "T":
            case "B":
              myX0 = geo.xx0;
              myX1 = geo.xx0 + geo.width;
              myY0 = mySide == "T" ? geo.yy0 : geo.yy0 + geo.height;
              myY1 = myY0;
              break;
            case "L":
            case "R":
              myY0 = geo.yy0;
              myY1 = geo.yy0 + geo.height;
              myX0 = mySide == "L" ? geo.xx0 : geo.xx0 + geo.width;
              myX1 = myX0;
              break;
          }
          const [d, pos] = U.distToSegmentSquared({ x: x0, y: y0 }, { x: myX0, y: myY0 }, { x: myX1, y: myY1 });
          if (d < bestDist) {
            bestDist = d;
            bestElem = myElem;
            bestPos = pos;
            bestSide = mySide;
          }
        }
      }
      for (let elem1 of myElem.children) {
        visit(elem1);
      }
    }

    visit(hCtx.folio);
    return [bestElem, bestSide, bestPos];
  }

  drag(dx, dy) {
    const idz = this.idz();
    // console.log(`[Ctr.drag] (${this.id}) dx:${dx.toFixed()} dy:${dy.toFixed()}`);
    const dragCtx = hCtx.getDragCtx();
    if (idz.zone == "END") {
      const [theElem, theSide, thePos] = this.findNearestTarget(dragCtx.xx0 + dx, dragCtx.yy0 + dy);
      // console.log(`[Ctr.drag] (${this.id}) theElem:${theElem?.id} theSide:${theSide} thePos:${thePos?.toFixed(2)}`);
      this.end.id = theElem.id;
      this.end.side = theSide;
      this.end.pos = thePos;
      this.segments = this.initialiseSegments();
    }
    else if (idz.zone == "START") {
      const [theElem, theSide, thePos] = this.findNearestTarget(dragCtx.xx0 + dx, dragCtx.yy0 + dy);
      // console.log(`[Ctr.drag] (${this.id}) theElem:${theElem?.id} theSide:${theSide} thePos:${thePos?.toFixed(2)}`);
      this.start.id = theElem.id;
      this.start.side = theSide;
      this.start.pos = thePos;
      this.segments = this.initialiseSegments();
    }
  }

  dragEnd(dx, dy) {
    // console.log(`[Ctr.dragEnd]`);
    this.drag(dx, dy);
    if (hCtx.getErrorId() == this.id) {
      this.resetDrag(dx, dy);
      this.initialDrag = false;
      return false;
    }
    this.initialDrag = false;
    return true;
  }


  connectSelf() {
    // console.log(`[Ctr.connectSelf]`);
    let segments = [];
    const [x0, y0] = U.idToXY(this.start);
    const [x1, y1] = U.idToXY(this.end);
    if (this.start.side == this.end.side) {
      const [dx, dy] = [x1 - x0, y1 - y0];
      let radius = hsm.settings.maxTransRadiusMm;
      const side = this.start.side;
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
      segments = U.connectPoints(x0, y0, this.start.side, x1, y1, this.end.side, false);
    }
    // console.log(`[Ctr.connectSelf] Segments:${JSON.stringify(segments)}`);
    return segments;
  }

  initialiseSegments() {
    let segments = [];
    const [x0, y0] = U.idToXY(this.start);
    const [x1, y1] = U.idToXY(this.end);
    [this.start.oldX, this.start.oldY] = [x0, y0];
    [this.end.oldX, this.end.oldY] = [x1, y1];
    if (this.start.id != this.end.id) {
      segments = U.connectPoints(x0, y0, this.start.side, x1, y1, this.end.side, false);
    }
    else segments = this.connectSelf();
    // console.warn(`[Ctr.initialiseSegments] oldX:${this.start.oldX} oldY:${this.start.oldY}`);
    // console.log(`[Ctr.initialiseSegments] Segments:${JSON.stringify(segments)}`);
    return segments;
  }

  C(val) {
    const x = U.mmToPL(val);
    if (!this.lineWidth % 2) return Math.round(x);
    return Math.round(x) + 0.5;
  }

  adjustXy(dx, dy, minseg = 0) {
    // console.log(`[Ctr.adjustXy] dx:${dx} dy:${dy}`);
    const r = hsm.settings.maxTransRadiusMm;
    for (let idx in this.segments) {
      idx = Number(idx);
      const segment = this.segments[idx];
      switch (segment.dir) {
        case "W":
          if (minseg && segment.len + dx < minseg) break;
          segment.len += dx;
          if (segment.len < 0) {
            segment.dir = "E";
            segment.len = - segment.len;
          }
          dx = 0;
          break;
        case "E":
          if (minseg && segment.len - dx < minseg) break;
          segment.len -= dx;
          if (segment.len < 0) {
            segment.dir = "W";
            segment.len = - segment.len;
          }
          dx = 0;
          break;
        case "S":
          if (minseg && segment.len - dy < minseg) break;
          segment.len -= dy;
          if (segment.len < 0) {
            segment.dir = "N";
            segment.len = - segment.len;
          }
          dy = 0;
          break;
        case "N":
          if (minseg && segment.len + dy < minseg) break;
          segment.len += dy;
          if (segment.len < 0) {
            segment.dir = "S";
            segment.len = - segment.len;
          }
          dy = 0;
          break;
      }
    }
    return [dx, dy];
  }

  myAdjustXy(dx, dy) {
    const r = hsm.settings.stateRadiusMm;
    let [ddx, ddy] = this.adjustXy(dx / 2, dy / 2, r);
    this.segments = this.segments.reverse();
    [dx, dy] = this.adjustXy(dx - dx / 2 + ddx, dy - dy / 2 + ddy, r);
    this.segments = this.segments.reverse();
    if (dx != 0 || dy != 0) {
      let [ddx, ddy] = this.adjustXy(dx / 2, dy / 2);
      this.segments = this.segments.reverse();
      [dx, dy] = this.adjustXy(dx - dx / 2 + ddx, dy - dy / 2 + ddy);
      this.segments = this.segments.reverse();
    }
    if (dx != 0 || dy != 0) {
      this.segments = this.initialiseSegments();
    }
    return [0, 0];
  }

  isIllLegal() {
    if (this.start.id == this.end.id) return false;
    if (this.segments.length == 0) return false;
    function check(side, dir) {
      if ((side == "T" && dir == "S") ||
        (side == "R" && dir == "W") ||
        (side == "B" && dir == "N") ||
        (side == "L" && dir == "E")) return false;
      return true;
    }
    function check2(side, dir) {
      if ((side == "T" && dir == "N") ||
        (side == "R" && dir == "E") ||
        (side == "B" && dir == "S") ||
        (side == "L" && dir == "W")) return false;
      return true;
    }
    if (!check(this.start.side, this.segments[0].dir)) return true;
    else if (!check2(this.end.side, this.segments[this.segments.length - 1].dir)) return true;
    return false;
  }

  // Get delta to add to [xx0,yy0]
  getDelta(p, elem = hElems.getElemById(p.id)) {
    // console.log(`[Ctr.getDelta] id:${elem?.id}`);
    if (p.pos > 1) p.pos = 1;
    let [x, y] = [0, 0];
    const r = hsm.settings.stateRadiusMm;
    const w = elem.geo.width;
    const h = elem.geo.height;
    switch (p.side) {
      case "R":
        x = w;
        y = r + (h - 2 * r) * p.pos;
        break;
      case "B":
        x = r + (w - 2 * r) * p.pos;
        y = h;
        break;
      case "L":
        y = r + (h - 2 * r) * p.pos;
        break;
      case "T":
      default:
        x = r + (w - 2 * r) * p.pos;
        break;
    }
    return [x, y];
  }

  adjustSegments() {
    // console.log(`[Ctr.adjustSegments] oldX:${this.start.oldX} oldY:${this.start.oldY}`);
    if (this.segments.length == 0) this.segments = this.initialiseSegments();
    if (this.start.oldX == undefined || this.start.oldY == undefined) {
      // first time, segments is supposed to be OK
      // console.log(`[Ctr.adjustSegments] First time`);
      [this.start.oldX, this.start.oldY] = U.idToXY(this.start);
      [this.end.oldX, this.end.oldY] = U.idToXY(this.end);
      return;
    }
    const elemStart = hElems.getElemById(this.start.id);
    // [xs,ys] new position from canvas
    let [xs, ys] = this.getDelta(this.start, elemStart);
    xs += elemStart.geo.xx0;
    ys += elemStart.geo.yy0;
    let [dxs, dys] = [xs - this.start.oldX, ys - this.start.oldY];
    if (dxs != 0 || dys != 0) {
      [dxs, dys] = this.myAdjustXy(dxs, dys);
    }
    [this.start.oldX, this.start.oldY] = [xs, ys];

    const elemEnd = hElems.getElemById(this.end.id);
    let [xe, ye] = this.getDelta(this.end, elemEnd);
    xe += elemEnd.geo.xx0;
    ye += elemEnd.geo.yy0;

    let [dxe, dye] = [xe - this.end.oldX, ye - this.end.oldY];
    if (dxe != 0 || dye != 0) {
      [dxe, dye] = this.myAdjustXy(-dxe, -dye);
      if (dxe != 0 || dye != 0) console.error(`[Ctr.adjustSegments] BAD dxe:${dxe} dye:${dye}`);
    }
    // this.segments = this.isLegal(this.segments);

    [this.end.oldX, this.end.oldY] = [xe, ye];
  }

  draw() {
    this.adjustSegments();
    if (hCtx.getErrorId() == this.start.id || hCtx.getErrorId() == this.end.id) return;
    const [x0, y0] = U.idToXY(this.start);
    [this.geo.x0, this.geo.y0] = [x0, y0];
    let baseColor = this.color;
    if (!baseColor) baseColor = hElems.getElemById(this.start.id).color;
    // console.log(`[Ctr.draw] (${this.id}) startId:${this.start.id} baseColor:${baseColor}`);
    const styles = trStyles(baseColor);
    if (this.isIllLegal()) {
      cCtx.lineWidth = styles.lineErrorWidth;
      cCtx.strokeStyle = styles.lineError;
    }
    else {
      cCtx.lineWidth = styles.lineWidth;
      cCtx.strokeStyle = styles.line;
    }
    pathSegments(this.segments, x0, y0);
  }



  makeIdz(x, y, idz) {
    // [x,y] in mm in this tr frame
    // console.log(`[Ctr.makeIdz](${this.id}) id: ${idz.id} zone: ${idz.zone}`);
    let [x0, y0] = U.idToXY(this.start);
    let bestD2 = Number.MAX_VALUE;
    let bestZone = "END";
    let bestType;
    let newIdz;
    const maxAnchorD2 = U.pToMmL(hsm.settings.cursorMarginP);
    if (((x - x0) * (x - x0) + (y - y0) * (y - y0) < maxAnchorD2)) {
      // Force an anchor
      return {
        id: this.id, zone: "START", type: "A", dist2P: 0, x: x, y: y
      };
    }
    for (let idx in this.segments) {
      idx = Number(idx);
      let segment = this.segments[idx];
      let [x1, y1] = [x0, y0];
      switch (segment.dir) {
        case "N":
          y1 = y0 - segment.len;
          break;
        case "E":
          x1 = x0 + segment.len;
          break;
        case "S":
          y1 = y0 + segment.len;
          break;
        case "W":
          x1 = x0 - segment.len;
          break;
      }
      let [d2, pos] = U.distToSegmentSquared({ x: x, y: y }, { x: x0, y: y0 }, { x: x1, y: y1 });
      // if (this.id == "T9") console.log(`[Ctr.makeIdz](${this.id}) (x:${x}, y:${y}) dir:${segment.dir} (x0:${x0}, y0:${y0}) (x1:${x1}, y1:${y1}) idx:${idx} d2:${d2.toFixed()}`);
      [x0, y0] = [x1, y1];
      if ((idx == this.segments.length - 1) && (((x - x1) * (x - x1) + (y - y1) * (y - y1)) < maxAnchorD2)) {
        return {
          id: this.id, zone: "END", type: "A", dist2P: 0, x: x, y: y
        };
      }
      if (d2 <= bestD2) {
        let type = "V";
        if (segment.dir == "E" || segment.dir == "W") type = "H";
        let zone = idx;
        bestType = type;
        bestZone = zone;
        bestD2 = d2;

      }
    } newIdz = { id: this.id, zone: bestZone, type: bestType, dist2P: U.mmToPL(bestD2), x: x, y: y };
    return newIdz;
  }


}
