"use strict";

import * as U from "src/lib/utils";
import { R, RR } from "src/lib/utils";
import { hsm, cCtx, hCtx, modeRef } from "src/classes/Chsm";
import { CbaseElem } from "src/classes/CbaseElem";
import { Cstate } from "src/classes/Cstate";

export class Ctrans extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
    this.lineWidth = 1;
  }

  load(transOptions) {
    this.segments = transOptions.segments;
    this.start = transOptions.start;
    this.end = transOptions.end;
  }

  connectPoints(x0, y0, side0, x1, y1, side1, skipLast = false) {
    let segments = [];
    const [dx, dy] = [Math.abs(x1 - x0), Math.abs(y1 - y0)];
    switch (side0) {
      case "B":
      case "T": {
        if (x1 == x0) {
          if (!skipLast) segments.push({ dir: y1 > y0 ? "S" : "N", len: dy });
          break;
        }
        switch (side1) {
          case "B":
          case "T": {
            if (y1 > y0) {
              segments.push({ dir: "S", len: dy / 2 });
              segments.push({ dir: x1 > x0 ? "E" : "W", len: dx });
              if (!skipLast) segments.push({ dir: "S", len: dy - dy / 2 });
            }
            else {
              segments.push({ dir: "N", len: dy - dy / 2 });
              segments.push({ dir: x1 > x0 ? "E" : "W", len: dx });
              if (!skipLast) segments.push({ dir: "N", len: dy / 2 });
            }
          }
            break;
          case "R":
            // TODO
            break;
          case "L":
            // TODO
            break;
        }
      }
    }
    return segments;
  }

  doIt() {
    const [x0, y0] = U.idToXY(this.start);
    const [x1, y1] = U.idToXY(this.end);
    this.segments = this.connectPoints(x0, y0, this.start.side, x1, y1, this.end.side, false);
    console.log(`[Ctrans.draw] Segments:${JSON.stringify(this.segments)}`);
  }

  drawArrow(x, y, dir) {
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
      case "E":
        widthP = -widthP;
      // eslint-disable-next-line no-fallthrough
      case "W":
        cCtx.moveTo(xP - widthP, yP - lenP);
        cCtx.lineTo(xP, yP);
        cCtx.lineTo(x - widthP, yP + lenP);
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
    console.log(`[Ctrans.draw] Drawing ${this.id}`);
    const [x0, y0] = U.idToXY(this.start);
    [this.geo.x0, this.geo.y0] = [x0, y0];
    const [x1, y1] = U.idToXY(this.end);
    // const [x0P, y0P] = [RR(hsm.mmToPL(x0)), RR(hsm.mmToPL(y0))];
    // const [x1P, y1P] = [RR(hsm.mmToPL(x1)), RR(hsm.mmToPL(y1))];
    // cCtx.lineWidth = 1.5;
    cCtx.beginPath();
    let [x, y] = [x0, y0];
    cCtx.moveTo(this.C(x), this.C(y));
    let oldDir;
    for (let segment of this.segments) {
      oldDir = segment.dir;
      const len = segment.len;
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
    }
    cCtx.stroke();
    this.drawArrow(x1, y1, oldDir);
  }



  makeIdz(x, y, idz) {
    // console.log(`[Ctrans.makeIdz] (${this.id}) id:${idz.id} zone:${idz.zone}`);
    return idz;
  }


}
