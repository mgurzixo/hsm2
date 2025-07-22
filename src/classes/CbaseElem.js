"use strict";

import { hsm, cCtx, hCtx, modeRef } from "src/classes/Chsm";

const inchInMm = 25.4;

export class CbaseElem {
  constructor(parent, obj, type) {
    // console.log(`[CbaseElem.constructor] type:${type}`);
    let id = obj?.id;
    if (type == "M") id = "M1";
    else {
      if (!id) {
        id = type + hsm.newSernum();
      }
      else hsm.checkSernum(Number(id.slice(1)));
      // console.log(`[CbaseElem.constructor] id:${id}`);
    }
    this.id = id;
    this.name = obj?.name || `S${id}`;
    this.parent = parent;
    this.children = [];
    if (obj.geo) this.geo = obj.geo;
    else this.geo = { x0: 0, y0: 0 }; // Offset from parent
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
    hsm.hElems.removeElemById(this.id);
    delete this.id;
    delete this.name;
    delete this.parent;
    delete this.children;
    delete this.geo;
  }

  link(parent) {
    this.parent = parent;
    parent.insertChild(this);
    hsm.hElems.addElem(this);
  }

  unlink() {
    this.parent = null;
    this.parent.excludeChild(this);
    hsm.hElems.removeElemById(this.id);
  }

  load(options) {
    console.warn(`[CbaseElem.load] this:${this.id}`);
  }

  pathRoundedRectP(px, py, pwidth, pheight, pradius) {
    cCtx.beginPath();
    cCtx.moveTo(px + pradius, py);
    cCtx.lineTo(px + pwidth - pradius, py);
    cCtx.quadraticCurveTo(px + pwidth, py, px + pwidth, py + pradius);
    cCtx.lineTo(px + pwidth, py + pheight - pradius);
    cCtx.quadraticCurveTo(px + pwidth, py + pheight, px + pwidth - pradius, py + pheight);
    cCtx.lineTo(px + pradius, py + pheight);
    cCtx.quadraticCurveTo(px, py + pheight, px, py + pheight - pradius);
    cCtx.lineTo(px, py + pradius);
    cCtx.quadraticCurveTo(px, py, px + pradius, py);
    cCtx.closePath();
  }

  draw() {
    console.warn(`[CbaseElem.draw] Drawing ${this.id}`);
  }

  hover(x, y) { }
  click(x, y) { }
  doubleClick(x, y) { }
  dragStart() { }
  drag(dx, dy) { }

  dragEnd(dx, dy) {
    console.warn(`[CbaseElem.dragEnd] id:${this.id}`);
    return true;
  }

  dragCancel(dx, dy) { }

  getXY0InFolio() {
    let [x, y] = [0, 0];
    for (let elem = this; elem; elem = elem.parent) {
      [x, y] = [x + elem.geo.x0, y + elem.geo.y0];
      // console.log(`[CbaseElem.getXY0InFolio] id:${elem.id} x:${x?.toFixed()}`);
    }
    return [x, y];
  }

  scalePhy() {
    return hCtx.folio.geo.scale * (hsm.settings.screenDpi / inchInMm);
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

  makeIdz(x, y, idz) {
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
      idz = child.makeIdz(x - this.geo.x0, y - this.geo.y0, idz);
    }
    // console.log(`[CbaseElem.makeIdz] (${this.id}) id:${idz.id} zone:${idz.zone}`);
    return idz;
  }

  defineCursor(idz) {
    let cursor;
    // console.log(`[CbaseElem.defineCursor] (${this.id}) mode:'${modeRef.value}' zone:${idz.zone}`);
    // TODO adjust...

    if (modeRef.value == "inserting-state") {
      // console.log(`[CbaseElem.defineCursor] in IS (${this.id}) id:${idz.id} zone:${idz.zone}`);
      //   cursor: url(http://cursor.in/assets/copy.svg), auto;
      if (this.id.startsWith("F") || this.id.startsWith("S")) {
        if (this.canInsertState(idz)) return "url(/assets/state16x16.png) 8 8,default";
        // if (this.canInsertState(idz)) return "grabbing";
        else return "url(/assets/no-drop16x16.png) 8 8,no-drop";
      }
      return "url(/assets/no-drop16x16.png),no-drop";
    } else if (modeRef.value == "inserting-trans") {
      // console.log(`[CbaseElem.defineCursor] in IT (${this.id}) id:${idz.id} zone:${idz.zone}`);
      if (this.id.startsWith("S")) {
        if (this.canInsertTr(idz)) return "url(/assets/anchor16x16.png) 8 8,default";
        // if (this.canInsertState(idz)) return "grabbing";
        else return "url(/assets/no-drop16x16.png) 8 8,no-drop";
      }
      return "url(/assets/no-drop16x16.png) 8 8,no-drop";
    }
    if (hCtx.getErrorId() == this.id) {
      cursor = "url(/assets/no-drop16x16.png) 8 8,no-drop";
      return cursor;
    }
    if (!this.id.startsWith("S") && hCtx.getDraggedId() == this.id) {
      cursor = "grabbing";
      return cursor;
    }
    // console.log(`[CbaseElem.defineCursor] in Default (${this.id}) id:${idz.id} zone:${idz.zone}`);
    switch (idz.zone) {
      case "M":
        cursor = "move";
        break;
      case "TL":
        cursor = "nw-resize";
        break;
      case "BL":
        cursor = "sw-resize";
        break;
      case "TR":
        cursor = "ne-resize";
        break;
      case "BR":
        cursor = "se-resize";
        break;
      case "T":
        cursor = "n-resize";
        break;
      case "B":
        cursor = "s-resize";
        break;
      case "L":
        cursor = "w-resize";
        break;
      case "R":
        cursor = "e-resize";
        break;
      default:
        cursor = "default";
    }
    // console.log(`[CbaseElem.defineCursor] res (${this.id}) zone:${idz.zone} cursor:${cursor}`);
    return cursor;
  }

  idz() {
    return hCtx.getIdz();
  }

  canInsertState(idz) {
    return false;
  }

  canInsertTr(idz) {
    return false;
  }
}
