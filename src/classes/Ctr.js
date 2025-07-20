"use strict";

import * as U from "src/lib/utils";
import { R, RR } from "src/lib/utils";
import { hsm, cCtx, hElems, hCtx, modeRef } from "src/classes/Chsm";
import { CbaseElem } from "src/classes/CbaseElem";
import { trStyles } from "src/lib/styles";

export class Ctr extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
    this.lineWidth = 1.5;
  }

  load(transOptions) {
    this.segments = transOptions.segments;
    this.start = transOptions.start;
    this.end = transOptions.end;
    if (transOptions.color) this.color = transOptions.color;
    else delete (this.color);
  }

  connectSelf() {
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
          dir2 = side == "B" ? "S" : "N";
          segments.push({ dir: dir1, len: radius });
          segments.push({ dir: dx > 0 ? "E" : "W", len: Math.abs(dx) });
          segments.push({ dir: dir2, len: radius });
          break;
        case "R":
        case "L":
          dir1 = side == "R" ? "E" : "W";
          dir2 = side == "R" ? "W" : "E";
          segments.push({ dir: dir1, len: radius });
          segments.push({ dir: dy > 0 ? "S" : "N", len: Math.abs(dy) });
          segments.push({ dir: dir2, len: radius });
          break;
      }
    }
    else {
      segments = U.connectPoints(x0, y0, this.start.side, x1, y1, this.end.side, false);
    }
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
    const x = hsm.mmToPL(val);
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

  isLegal() {
    if (this.start.id == this.end.id) return true;
    if (this.segments.length == 0) return true;
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
    if (!check(this.start.side, this.segments[0].dir)) return false;
    else if (!check2(this.end.side, this.segments[this.segments.length - 1].dir)) return false;
    return true;
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
    const [x1, y1] = U.idToXY(this.end);
    let baseColor = this.color;
    if (!baseColor) baseColor = hElems.getElemById(this.start.id).color;
    // console.log(`[Ctr.draw] (${this.id}) startId:${this.start.id} baseColor:${baseColor}`);
    const styles = trStyles(baseColor);
    if (this.isIllegal) {
      cCtx.lineWidth = styles.lineErrorWidth;
      cCtx.strokeStyle = styles.lineError;
    }
    else {
      cCtx.lineWidth = styles.lineWidth;
      cCtx.strokeStyle = styles.line;
    }
    cCtx.beginPath();
    let [x, y] = [x0, y0];
    cCtx.moveTo(this.C(x), this.C(y));
    let curDir;
    const maxIdx = this.segments.length - 1;
    // console.log(`[Ctr.draw]----------------------- maxIdx: ${ maxIdx }`);
    let radius1 = 0;
    for (let idx in this.segments) {
      idx = Number(idx);
      let segment = this.segments[idx];
      const nextSeg = idx < maxIdx ? this.segments[idx + 1] : null;
      // console.log(`[Ctr.draw](${ idx }) previousSeg: ${ previousSeg } nextSeg: ${ nextSeg }`);
      curDir = segment.dir;
      let len = segment.len;
      let radius2 = hsm.settings.maxTransRadiusMm;
      if (radius2 > segment.len / 2) radius2 = segment.len / 2;
      if (!nextSeg) radius2 = 0;
      else if (radius2 > nextSeg.len / 2) radius2 = nextSeg.len / 2;
      // radius1 = 0;
      // radius2 = 0;
      len = len - radius1 - radius2;
      // console.log(`[Ctr.draw](${ idx }) len0: ${ segment.len.toFixed() } len: ${ len.toFixed() } dir: ${ segment.dir } radius1: ${ radius1.toFixed() } radius2: ${ radius2.toFixed() }`);
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
      cCtx.lineTo(this.C(x), this.C(y));
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
        // cCtx.lineTo(this.C(x), this.C(y));
        cCtx.quadraticCurveTo(this.C(cpx), this.C(cpy), this.C(x), this.C(y));
        radius1 = radius2;
      }
    }
    cCtx.stroke();
    if (curDir) U.drawArrow(cCtx, this.lineWidth, x1, y1, curDir);
  }



  makeIdz(x, y, idz) {
    // console.log(`[Ctr.makeIdz](${ this.id }) id: ${ idz.id } zone: ${ idz.zone }`);
    return idz;
  }


};;
