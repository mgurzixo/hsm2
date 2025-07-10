"use strict";

import { hsm, ctx, folio } from "src/classes/Chsm";

const inchInMm = 25.4;

export class CbaseElem {
  static sernum = 0;

  constructor(parent, obj, type) {
    let id = obj.id;
    if (!id) id = type + ++CbaseElem.sernum;
    this.id = id;
    this.name = obj.name;
    this.parent = parent;
    this.children = [];
    if (obj.geo) this.geo = obj.geo;
    else this.geo = { x0: 0, y0: 0, x00: 0, y00: 0 }; // Offset from parent

    // console.log(`[CbaseElem.constructor] Created:${this.id}`);
  }

  destroy() {
    // console.log(`[CbaseElem.destroy] this:${this.id}`);
    for (let child of this.children) {
      // console.log(`[CbaseElem.destroy] this:${this.id} child:${child} childId:${child.id}`);
      child.destroy();
    }
    hsm.hElems.removeById(this.id);
    delete this.id;
    delete this.name;
    delete this.parent;
    delete this.children;
    delete this.geo;
  }

  link(parent) {
    this.parent = parent;
    parent.insertChild(this);
    hsm.hElems.add(this);
  }

  unlink() {
    this.parent = null;
    this.parent.excludeChild(this);
    hsm.hElems.removeById(this.id);
  }

  load(options) {
    console.warn(`[CbaseElem.load] this:${this.id}`);
  }

  pathRoundedRectP(px, py, pwidth, pheight, pradius) {
    ctx.beginPath();
    ctx.moveTo(px + pradius, py);
    ctx.lineTo(px + pwidth - pradius, py);
    ctx.quadraticCurveTo(px + pwidth, py, px + pwidth, py + pradius);
    ctx.lineTo(px + pwidth, py + pheight - pradius);
    ctx.quadraticCurveTo(px + pwidth, py + pheight, px + pwidth - pradius, py + pheight);
    ctx.lineTo(px + pradius, py + pheight);
    ctx.quadraticCurveTo(px, py + pheight, px, py + pheight - pradius);
    ctx.lineTo(px, py + pradius);
    ctx.quadraticCurveTo(px, py, px + pradius, py);
    ctx.closePath();
  }

  draw() {
    console.warn(`[CbaseElem.draw] Drawing ${this.id}`);
  }

  hover(x, y) {}
  click(x, y) {}
  doubleClick(x, y) {}
  dragStart(x, y) {
    return null;
  }
  drag(dx, dy) {}
  dragEnd(dx, dy) {}
  dragCancel(dx, dy) {}

  getXY0InFolio() {
    let [x, y] = [0, 0];
    for (let elem = this; elem; elem = elem.parent) {
      [x, y] = [x + elem.geo.x0, y + elem.geo.y0];
      // console.log(`[CbaseElem.getXY0InFolio] id:${elem.id} x:${x?.toFixed()}`);
    }
    return [x, y];
  }

  setGeo00() {
    [this.geo.x00, this.geo.y00] = this.getXY0InFolio();
  }

  setGeo00X() {
    for (let child of this.children) {
      [child.geo.x00, child.geo.y00] = [this.geo.x00 + child.geo.x0, this.geo.y00 + child.geo.y0];
      child.setGeo00X();
    }
  }

  setGeo00R() {
    this.setGeo00();
    this.setGeo00X();
  }

  updateGeo00() {
    [this.geo.x00, this.geo.y00] = [
      this.parent.geo.x00 + this.geo.x0,
      this.parent.geo.y00 + this.geo.y00,
    ];
  }

  scalePhy() {
    return folio.geo.scale * (hsm.settings.screenDpi / inchInMm);
  }

  pToMm(xP, yP) {
    return [xP / this.scalePhy() - this.geo.x0, yP / this.scalePhy() - this.geo.y0];
  }

  TX(xMm) {
    return Math.round((this.parent.geo.x0 + xMm) * this.scalePhy()) + 0.5;
  }

  TY(yMm) {
    return Math.round((this.parent.geo.y0 + yMm) * this.scalePhy()) + 0.5;
  }

  TL(lMm) {
    return Math.round(lMm * this.scalePhy());
  }

  RTX(xP) {
    return xP / this.scalePhy() - this.parent.geo.x0;
  }

  RTY(yP) {
    return yP / this.scalePhy() - this.parent.geo.y0;
  }

  RTL(lP) {
    return lP / this.scalePhy();
  }

  raiseChild(childId) {
    const c = [];
    let found;
    for (let child of this.children) {
      if (child.id != childId) c.push(child);
      else found = child;
    }
    if (found) c.push(found);
    this.children = c;
  }

  raiseChildR(childId) {
    this.raiseChild(childId);
    this.parent?.raiseChildR(this.id);
  }

  getChildrenBB(bb, x0 = 0, y0 = 0) {
    // console.log(`[CbaseElem.getChildrenBB] id:${this.id} bb:${bb}`);
    if (!bb || (!this.id.startsWith("E") && !this.id.startsWith("R"))) {
      if (!bb) {
        bb = { x0: null, y0: null, x1: null, y1: null };
        for (let elem of this.children) {
          bb = elem.getChildrenBB(bb, x0 + this.geo.x0, y0 + this.geo.y0);
        }
      } else {
        // console.log(`[CbaseElem.getChildrenBB] id:${this.id} Doing bb`);
        let u = this.geo.x0 + x0;
        if (bb.x0 == null) bb.x0 = u;
        else if (u < bb.x0) bb.x0 = u;
        u = this.geo.y0 + y0;
        if (bb.y0 == null) bb.y0 = u;
        else if (u < bb.y0) bb.y0 = u;
        u = this.geo.x0 + this.geo.width + x0;
        if (bb.x1 == null) bb.x1 = u;
        else if (u > bb.x1) bb.x1 = u;
        u = this.geo.y0 + this.geo.height + y0;
        if (bb.y1 == null) bb.y1 = u;
        else if (u > bb.y1) bb.y1 = u;
      }
    } else {
      for (let elem of this.children) {
        bb = elem.getChildrenBB(bb, x0 + this.geo.x0, y0 + this.geo.y0);
      }
    }
    return bb;
  }
}
