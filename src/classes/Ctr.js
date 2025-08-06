"use strict";

import * as U from "src/lib/utils";
import * as T from "src/lib/trUtils";
import { hsm, cCtx, hElems, hCtx, modeRef } from "src/classes/Chsm";
import { CbaseElem } from "src/classes/CbaseElem";
import { Ctext } from "src/classes/Cnote";
// import { Ctext } from "src/classes/Ctext";
import { pathSegments, removeNullSegments, segsNormalise } from "src/lib/segments";

export class Ctr extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
    this.lineWidth = 1.5;
    this.isBaseTr = true;
    this.oldTagText = "";
  }

  async load(transOptions) {
    this.segments = transOptions.segments;
    this.from = transOptions.from;
    this.to = transOptions.to;
    this.isInternal = transOptions.isInternal || false;
    if (transOptions.color) this.color = transOptions.color;
    else delete (this.color);
    this.trigger = transOptions.trigger;
    this.guard = transOptions.guard;
    this.effect = transOptions.effect;
    this.include = transOptions.include;
    this.comment = transOptions.comment;
    this.makeTag();
  }

  async onLoaded() {
    // console.log(`[Ctr.onLoaded] (${this.id})}`);
    if (this.segments.length == 0) this.segments = this.getInitialSegments();
  }

  makeTag() {
    let text = "";
    if (this.trigger) text += `[${this.trigger}]`;
    if (this.guard) text += `[${this.guard}]`;
    if (this.effect) text += `/${this.effect}`;
    if (!this.tag) this.tag = new Ctext(this, {
      geo: { x0: 10, y0: 10, width: 20, height: 10 },
      text: text
    });
    else {
      if (this.oldTagText == text) return;
      this.tag.text = text;
      this.tag.makeCanvas();
      // if (this.id == "T13") console.log(`[Ctr.makeTag] (${this.id}) } text:${text}`);
    }
  }

  setSelected(val) {
    // console.log(`[Ctr.setSelected] (${this.id}) } setSelected:${val}`);
    super.setSelected(val);
    this.tag.setSelected(val);
  }

  findNearestLegalTarget(anchor, x0, y0) {
    // console.log(`[Ctr.findNearestTarget] (${this.id}) x0:${x0.toFixed()} y0:${y0.toFixed()}`);
    const r = hsm.settings.stateRadiusMm;
    let bestDist = Number.MAX_VALUE;
    let bestSide = "T";
    let bestElem;
    let bestPos;

    function visit(myElem) {
      if (myElem.id.startsWith("S")) {
        for (let mySide of ["T", "R", "B", "L"]) {
          if ((anchor.id == myElem.id) && (anchor.side != mySide)) {
            continue;
          }
          const geo = myElem.geo;
          let myX0, myY0, myX1, myY1;
          switch (mySide) {
            case "T":
            case "B":
              myX0 = geo.xx0 + r;
              myX1 = geo.xx0 + geo.width - r;
              myY0 = mySide == "T" ? geo.yy0 : geo.yy0 + geo.height;
              myY1 = myY0;
              break;
            case "L":
            case "R":
              myY0 = geo.yy0 + r;
              myY1 = geo.yy0 + geo.height - r;
              myX0 = mySide == "L" ? geo.xx0 : geo.xx0 + geo.width;
              myX1 = myX0;
              break;
          }
          const [d, pos] = U.distToSegmentSquared({ x: x0, y: y0 }, { x: myX0, y: myY0 }, { x: myX1, y: myY1 });
          // if (anchor.id == myElem.id) console.log(`[Ctr.findNearestTarget] anchor.side:${anchor.side} mySide:${mySide} bestDist:${bestDist.toFixed()} dist:${d}`);

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


  async dragStart() {
    // console.log(`[Ctr.dragStart] (${this.id})`);
    const idz = this.idz();
    if (modeRef.value == "") {
      const trDragCtx = {
        id: this.id,
        zone: idz.zone,
        type: idz.type,
        xx0: idz.x,
        yy0: idz.y,
        tr0: {
          from: structuredClone(this.from),
          to: structuredClone(this.to),
          segments: structuredClone(this.segments)
        }
      };
      // console.log(`[Ctr.dragStart] trDragCtx:${JSON.stringify(trDragCtx)}`);
      hCtx.setDragCtx(trDragCtx);
    }
    window.windump = true;
    return this;
  }

  drag(dx, dy) {
    const dragCtx = hCtx.getDragCtx();
    if (dragCtx.zone == "FROM") T.dragFromAnchor(dx, dy);
    else if (dragCtx.zone == "TO") T.dragToAnchor(dx, dy);
    else if (dragCtx.zone == 0) T.dragFirstSegment(this, dx, dy);
    else if (dragCtx.zone == this.segments.length - 1) T.dragLastSegment(this, dx, dy);
    else T.dragNormalSegment(this, dx, dy);
  }

  openDialog() {
    hsm.openDialog(this);
  }

  dragEnd(dx, dy) {
    // console.log(`[Ctr.dragEnd]`);
    this.drag(dx, dy);
    this.segments = removeNullSegments(this.segments);
    const [segs, dxs, dys, dxe, dye] = segsNormalise(this.segments);
    this.segments = segs;
    delete this.from.prevX;
    delete this.from.prevY;
    delete this.to.prevX;
    delete this.to.prevY;
    // console.log(`[Ctr.dragEnd] this.segments:${JSON.stringify(this.segments)}`);
    if (this.justCreated == true) {
      hsm.openDialog(this);
      delete this.justCreated;
    }
    if (hCtx.getErrorId() == this.id) {
      return false;
    }
    window.windump = false;
    return true;
  }


  getInitialSegments() {
    let segments = [];
    const [x0, y0] = T.anchorToXY(this.from);
    const [x1, y1] = T.anchorToXY(this.to);
    [this.from.prevX, this.from.prevY] = [x0, y0];
    [this.to.prevX, this.to.prevY] = [x1, y1];
    segments = T.createSegments(this);
    // console.warn(`[Ctr.getInitialSegments] (${this.id}) prevX:${this.from.prevX} prevY:${this.from.prevY}`);
    // console.log(`[Ctr.getInitialSegments] Segments:${JSON.stringify(segments)}`);
    return segments;
  }

  click(x, y) {
    console.log(`[Ctr.click] (${this.id})`);
    T.reverseTr(this);
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
    // console.log(`[Ctr.myAdjustXy] dx:${dx} dy:${dy}`);
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
      this.segments = this.getInitialSegments();
    }
    return [0, 0];
  }

  isLegal() {
    // console.log(`[Ctr.isLegal] id:${this.id} segments:${this.segments}`);
    if (this.segments.length == 0) return true;
    const fromState = hElems.getElemById(this.from.id);
    const goesToOutside = U.goesToOutside(this.from.side, this.segments[0].dir);
    const goesToInside = U.goesToInside(this.from.side, this.segments[0].dir);
    const lastSeg = this.segments[this.segments.length - 1];
    const comesFromOutside = U.comesFromOutside(this.to.side, lastSeg.dir);
    const comesFromInside = U.comesFromInside(this.to.side, lastSeg.dir);
    if (this.from.id == this.to.id) {
      if (this.from.side != this.to.side) return false;
      if (this.from.pos == this.to.pos) return false;
      if (this.isInternal) {
        if (!comesFromInside || !goesToInside) return false;
      }
      else if (!goesToOutside || !comesFromOutside) return false;
      return true;
    }
    if (fromState.isSuperstate(this.to.id)) {
      if (!goesToInside || !comesFromOutside) return false;
      return true;
    }
    if (fromState.isSubstate(this.to.id)) {
      if (!goesToOutside || !comesFromInside) return false;
      return true;
    }
    if (!goesToOutside || !comesFromOutside) return false;
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
    // console.log(`[Ctr.adjustSegments] prevX:${this.from.prevX} prevY:${this.from.prevY}`);
    if (this.segments.length == 0) this.segments = this.getInitialSegments();
    if (this.from.prevX == undefined || this.from.prevY == undefined) {
      // first time, segments is supposed to be OK
      // console.log(`[Ctr.adjustSegments] First time`);
      [this.from.prevX, this.from.prevY] = T.anchorToXY(this.from);
      [this.to.prevX, this.to.prevY] = T.anchorToXY(this.to);
      return;
    }
    const elemStart = hElems.getElemById(this.from.id);
    // [xs,ys] new position from canvas
    let [xs, ys] = this.getDelta(this.from, elemStart);
    xs += elemStart.geo.xx0;
    ys += elemStart.geo.yy0;
    let [dxs, dys] = [xs - this.from.prevX, ys - this.from.prevY];
    if (dxs != 0 || dys != 0) {
      [dxs, dys] = this.myAdjustXy(dxs, dys);
    }
    [this.from.prevX, this.from.prevY] = [xs, ys];

    const elemEnd = hElems.getElemById(this.to.id);
    let [xe, ye] = this.getDelta(this.to, elemEnd);
    xe += elemEnd.geo.xx0;
    ye += elemEnd.geo.yy0;

    let [dxe, dye] = [xe - this.to.prevX, ye - this.to.prevY];
    if (dxe != 0 || dye != 0) {
      [dxe, dye] = this.myAdjustXy(-dxe, -dye);
      if (dxe != 0 || dye != 0) console.error(`[Ctr.adjustSegments] BAD dxe:${dxe} dye:${dye}`);
    }
    [this.to.prevX, this.to.prevY] = [xe, ye];
  }

  draw(xx0, yy0) {
    if (hCtx.getErrorId() == this.from.id || hCtx.getErrorId() == this.to.id) return;
    const [x0, y0] = T.anchorToXY(this.from);
    [this.geo.x0, this.geo.y0] = [x0, y0];
    this.geo.xx0 = xx0 + this.geo.x0;
    this.geo.yy0 = yy0 + this.geo.y0;
    const s = hElems.getElemById(this.from.id).styles;
    // console.log(`[Ctr.draw] (${this.id}) startId:${this.from.id} baseColor:${baseColor} ${this.segments.length} segments (x0:${x0}, y0:${y0})`);
    if (!this.isLegal()) {
      cCtx.lineWidth = s.trLineErrorWidth;
      cCtx.strokeStyle = s.trLineError;
      this.tag.color = s.trLineError;
      // console.log(`[Ctr.draw] (${this.id}) tag.color:${this.tag.color}`);
    }
    else {
      if (this.isSelected) cCtx.lineWidth = s.trLineSelectedWidth;
      else cCtx.lineWidth = s.trLineWidth;
      cCtx.strokeStyle = s.trLine;
      this.tag.color = s.trTag;
    }
    pathSegments(this.segments, x0, y0);
    if (this.tag) this.tag.draw(this.geo.xx0, this.geo.yy0);
  }

  adjustChange(changedId) {
    // if (changedId == this.from.id || changedId == this.to.id || changedId == this.id) {
    // console.log(`[Ctr.adjustChange](${this.id}) changedId:${changedId}`);
    this.adjustSegments();
    // }
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm in this tr frame
    // console.log(`[Ctr.makeIdz](${this.id}) id: ${idz.id} zone: ${idz.zone}`);
    let [x0, y0] = T.anchorToXY(this.from);
    let bestD2 = Number.MAX_VALUE;
    let bestZone = "TO";
    let bestType;
    let newIdz;
    const maxAnchorD2 = U.pToMmL(hsm.settings.cursorMarginP);
    if (((x - x0) * (x - x0) + (y - y0) * (y - y0) < maxAnchorD2)) {
      // Force an anchor
      return {
        id: this.id, zone: "FROM", type: "A", dist2P: 0, x: x, y: y
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
          id: this.id, zone: "TO", type: "A", dist2P: 0, x: x, y: y
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
    }
    newIdz = { id: this.id, zone: bestZone, type: bestType, dist2P: U.mmToPL(bestD2), x: x, y: y };
    // this.makeTag();
    // if (this.tag.text) {
    newIdz = this.tag.makeIdz(x - this.geo.x0, y - this.geo.y0, newIdz);
    // }
    // if (this.trigger && newIdz.id == this.tag.id) console.warn(`[Ctr.makeIdz] Tag selected. id:${newIdz.id} zone:${newIdz.zone}`);
    if (newIdz.id == this.tag.id) console.log(`[Ctr.makeIdz] (${this.id}) id:${newIdz.id} zone:${newIdz.zone}`);
    return newIdz;
  }
}
