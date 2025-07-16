"use strict";

import { hsm, ctx, folio } from "src/classes/Chsm";

const inchInMm = 25.4;

export class CbaseElem {
  static sernum = 0;

  constructor(parent, obj, type) {
    console.log(`[CbaseElem.constructor] type:${type}`);
    let id = obj.id;
    if (!id) id = type + ++CbaseElem.sernum;
    this.id = id;
    this.name = obj.name;
    this.parent = parent;
    this.children = [];
    if (obj.geo) this.geo = obj.geo;
    else this.geo = { x0: 0, y0: 0, x00: 0, y00: 0 }; // Offset from parent
    if (obj.color) this.color = obj.color;
    else if (obj.settings?.styles?.defaultColor) this.color = obj.settings.styles.defaultColor;
    else if (hsm) this.color = hsm.settings.styles.defaultColor;
    else this.color = "grey";
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
  dragStart() {}
  drag(dx, dy) {}

  dragEnd(dx, dy) {
    // console.log(`[CbaseElem.dragEnd] id:${this.id}`);
  }

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

  pToMmXY(xP, yP) {
    return [xP / this.scalePhy() - this.geo.x0, yP / this.scalePhy() - this.geo.y0];
  }

  mmToPL(lMm) {
    return Math.round(lMm * this.scalePhy());
  }

  pToMmL(lP) {
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

  getIdAndZone(x, y, idz = { id: hsm.id, zone: "", x: 0, y: 0 }) {
    const m = this.pToMmL(hsm.settings.cursorMarginP);
    if (
      x < this.geo.x0 ||
      x > this.geo.x0 + this.geo.width ||
      y < this.geo.y0 ||
      y > this.geo.y0 + this.geo.height
    )
      return idz;
    idz = { id: this.id, zone: "M", x: x, y: y };
    for (let child of this.children) {
      idz = child.getIdAndZone(x - this.geo.x0, y - this.geo.y0, idz);
    }
    // console.log(`[CbaseElem.getIdAndZone] (${this.id}) id:${idz.id} zone:${idz.zone}`);
    return idz;
  }

  defineCursor(idz) {
    let cursor;
    // console.log(`[CbaseElem.defineCursor] (${this.id}) errorId:${hsm.hElems.errorId}`);
    // TODO adjust...
    if (hsm.hElems.errorId) {
      cursor = "no-drop";
      return cursor;
    }
    if (hsm.hElems.getDraggedId()) {
      cursor = "grabbing";
      return cursor;
    }
    switch (idz.zone) {
      case "M":
        cursor = "move";
        break;
      case "TL":
        cursor = "nwse-resize";
        break;
      case "BL":
        cursor = "nesw-resize";
        break;
      case "TR":
        cursor = "nesw-resize";
        break;
      case "BR":
        cursor = "nwse-resize";
        break;
      case "T":
        cursor = "row-resize";
        break;
      case "B":
        cursor = "row-resize";
        break;
      case "L":
        cursor = "col-resize";
        break;
      case "R":
        cursor = "col-resize";
        break;
      default:
        cursor = "default";
    }
    // console.log(`[CbaseElem.defineCursor] (${this.id}) zone:${idz.zone} cursor:${cursor}`);
    return cursor;
  }

  idz() {
    return hsm.hElems.getIdAndZone();
  }
}
