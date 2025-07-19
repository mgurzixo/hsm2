"use strict";

import * as U from "src/lib/utils";
import { R, RR } from "src/lib/utils";
import { hsm, cCtx, hElems, hCtx, modeRef } from "src/classes/Chsm";
import { CbaseElem } from "src/classes/CbaseElem";
import { Cstate } from "src/classes/Cstate";

export class Ctrans extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
    this.lineWidth = 1.5;
  }

  load(transOptions) {
    this.segments = transOptions.segments;
    this.start = transOptions.start;
    this.end = transOptions.end;
  }

  connectPoints(x0, y0, side0, x1, y1, side1, skipLast = false) {
    let segments = [];
    const [dx, dy] = [Math.abs(x1 - x0), Math.abs(y1 - y0)];
    if (x1 == x0) {
      if (y1 == y0) return segments;
      if (!skipLast) segments.push({ dir: y1 > y0 ? "S" : "N", len: dy });
      return segments;
    }
    switch (side0) {
      case "B":
      case "T": {
        switch (side1) {
          case "B":
          case "T": {
            segments.push({ dir: y1 > y0 ? "S" : "N", len: dy / 2 });
            segments.push({ dir: x1 > x0 ? "E" : "W", len: dx });
            if (!skipLast) segments.push({ dir: y1 > y0 ? "S" : "N", len: dy - dy / 2 });
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
            if (y1 == y0) segments.push({ dir: x1 > x0 ? "E" : "W", len: dx });
            else {
              segments.push({ dir: x1 > x0 ? "E" : "W", len: dx / 2 });
              segments.push({ dir: y1 > y0 ? "S" : "N", len: dy });
              if (!skipLast) segments.push({ dir: x1 > x0 ? "E" : "W", len: dx - dx / 2 });
            }
          }
            break;
        }
        break;
      }
    }
    return segments;
  }

  connectSelf() {
    if (this.start.side == this.end.side) {
      const [x0, y0] = U.idToXY(this.start);
      const [x1, y1] = U.idToXY(this.end);
      const [dx, dy] = [x1 - x0, y1 - y0];
      let length = Math.sqrt(dx * dx + dy * dy);
      // let radius =
      const segments = [];
      switch (this.start.side) {
        case "T":
          length = Math.abs();
          break;
        case "R":

          break;
        case "B":

          break;
        case "L":

          break;
      }
    }
  }

  doIt() {
    const [x0, y0] = U.idToXY(this.start);
    const [x1, y1] = U.idToXY(this.end);
    if (this.start.id != this.end.id) {
      this.segments = this.connectPoints(x0, y0, this.start.side, x1, y1, this.end.side, false);
    }
    else {
      this.connectSelf();
    }
    // console.log(`[Ctrans.draw] Segments:${JSON.stringify(this.segments)}`);
  }

  drawArrow(x, y, dir) {
    // console.log(`[Ctrans.drawArrow] dir ${dir}`);
    let lenP = this.C(hsm.settings.arrowLengthMm);
    let widthP = this.C(hsm.settings.arrowWidthMm);
    const xP = this.C(x);
    const yP = this.C(y);
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

  C(val) {
    const x = hsm.mmToPL(val);
    if (!this.lineWidth % 2) return Math.round(x);
    return Math.round(x) + 0.5;
  }

  draw() {
    // console.log(`[Ctrans.draw] Drawing ${this.id}`);
    const [x0, y0] = U.idToXY(this.start);
    [this.geo.x0, this.geo.y0] = [x0, y0];
    const [x1, y1] = U.idToXY(this.end);
    // const [x0P, y0P] = [RR(hsm.mmToPL(x0)), RR(hsm.mmToPL(y0))];
    // const [x1P, y1P] = [RR(hsm.mmToPL(x1)), RR(hsm.mmToPL(y1))];
    // cCtx.lineWidth = 1.5;
    cCtx.beginPath();
    let [x, y] = [x0, y0];
    cCtx.moveTo(this.C(x), this.C(y));
    let curDir;
    const maxIdx = this.segments.length - 1;
    console.log(`[Ctrans.makeIdz] ----------------------- maxIdx:${maxIdx}`);
    let radius1 = 0;
    for (let idx in this.segments) {
      idx = Number(idx);
      let segment = this.segments[idx];
      const nextSeg = idx < maxIdx ? this.segments[idx + 1] : null;
      // console.log(`[Ctrans.makeIdz] (${idx}) previousSeg:${previousSeg} nextSeg:${nextSeg}`);
      curDir = segment.dir;
      let len = segment.len;
      let radius2 = hsm.settings.maxTransRadiusMm;
      if (radius2 > segment.len / 2) radius2 = segment.len / 2;
      if (!nextSeg) radius2 = 0;
      else if (radius2 > nextSeg.len / 2) radius2 = nextSeg.len / 2;
      // radius1 = 0;
      // radius2 = 0;
      len = len - radius1 - radius2;
      console.log(`[Ctrans.makeIdz] (${idx}) len0:${segment.len.toFixed()} len:${len.toFixed()} dir:${segment.dir} radius1:${radius1.toFixed()} radius2:${radius2.toFixed()}`);
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
    if (curDir) this.drawArrow(x1, y1, curDir);
  }



  makeIdz(x, y, idz) {
    // console.log(`[Ctrans.makeIdz] (${this.id}) id:${idz.id} zone:${idz.zone}`);
    return idz;
  }


}
