"use strict";

import * as U from "src/lib/utils";
import * as V from "vue";
import { hsm, cCtx, hCtx, modeRef } from "src/classes/Chsm";
import { inverse, toCSS, applyToPoint } from 'transformation-matrix';

const inchInMm = 25.4;

export class CbaseElem {
  constructor(parent, options, type) {
    // console.log(`[CbaseElem.constructor] type:${type} elem:${options.elem}`);
    let id = options?.id;
    if (type == "M") id = "M1";
    else {
      if (!id) {
        id = type + hsm.newSernum();
      }
      else hsm.checkSernum(Number(id.slice(1)));
      // console.log(`[CbaseElem.constructor] id:${id}`);
    }
    this.id = id;
    hsm?.hElems?.insertElem(this);
    this.name = options?.name || `S${id}`;
    this.parent = parent;
    this.children = [];
    if (options.elem) this.myElem = options.elem;
    else {
      if (type == "T") {
        // Cf. https://stackoverflow.com/questions/57769851/how-do-i-set-the-size-of-an-svg-element-using-javascript
        this.myElem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      }
      else this.myElem = document.createElement("div");
    }
    if (this.parent?.myElem) this.parent.myElem.append(this.myElem);
    const s = this.myElem.style;
    s.position = "absolute";
    s.overflow = "hidden";
    s.transformOrigin = "top left";
    s.zIndex = "auto";
    this.myElem.id = this.id;
    this.geo = { x0: 0, y0: 0, scale: 1 }; // Offset from parent
    if (options.geo) this.geo = Object.assign(this.geo, options.geo);
    const g = this.geo;
    g.mat = { a: g.scale, b: 0, c: 0, d: g.scale, e: g.x0 * U.pxPerMm, f: g.y0 * U.pxPerMm };
    g.matR = inverse(g.mat);
    this.myElem.style.transform = toCSS(g.mat);
    const bb = this.myElem.getBoundingClientRect();
    // console.log(`[CbaseElem.constructor] myElemId:${this.myElem?.id} bb.left:${bb.left}`);
    // [xx0,yy0] coords in mm from viewport
    g.xx0 = U.pxToMm(bb.left);
    g.yy0 = U.pxToMm(bb.top);
    // console.log(`[CbaseElem.constructor] myElemId:${this.myElem?.id} [x0:${g.x0.toFixed(2)}, y0:${g.y0.toFixed(2)}] [xx0:${g.xx0.toFixed(2)}, yy0:${g.yy0.toFixed(2)}]`);
    if (options.color) this.color = options.color;
    else if (options.settings?.styles?.defaultColor) this.color = options.settings.styles.defaultColor;
    else if (hsm) this.color = hsm.settings.styles.defaultColor;
    else this.color = "grey";
    this.isSelected = false;
    if (options.justCreated) this.justCreated = options.justCreated;
    // console.log(`[CbaseElem.constructor] Created:${this.id}`);
  }

  async load(options) {
    console.warn(`[CbaseElem.load] this:${this.id}`);
    return true;
  }

  pxToMyMm(xP, yP) {
    // console.warn(`[CbaseElem.pxToMyMm] (${this.id}) xP:${xP} this.geo.xx0:${this.geo.xx0}`);
    return [U.pxToMm(xP) - this.geo.xx0, U.pxToMm(yP) - this.geo.xx0];
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

  async onLoaded() {
    // Called when everything is loaded
    for (let child of this.children) {
      await child.onLoaded();
    }
  }

  isKindOfState() {
    return this.isBaseState == true;
  }

  isKindOfTr() {
    return this.isBaseTr == true;
  }

  draw() {
    console.warn(`[CbaseElem.draw] Drawing ${this.id}`);
  }

  hover(x, y) { }

  click() {
    console.warn(`[CbaseElem.click] id:${this.idz().id}`);
  }

  doubleClick(x, y) { }
  async dragStart(xP, yP) { }
  drag(dx, dy) { }

  // adjustTrAnchors(changedId) {
  //   // console.log(`[CbaseElem.adjustTrAnchors] id:${this.id} TODO`);
  //   for (let child of this.children) {
  //     child.adjustTrAnchors(changedId);
  //   }
  // }

  dragEnd(dx, dy) {
    console.warn(`[CbaseElem.dragEnd] id:${this.id}`);
    return true;
  }

  dragCancel(dx, dy) { }

  getOriginXYF() {
    const s = hCtx.folio.geo.scale;
    const bb = this.myElem.getBoundingClientRect();
    const bbFolio = hCtx.folio.myElem.getBoundingClientRect();
    let [x0, y0] = [bb.left - bbFolio.left, bb.top - bbFolio.top];
    [x0, y0] = [x0 / U.pxPerMm / s, y0 / U.pxPerMm / s];
    return [x0, y0];
  }

  scalePhy() {
    return hCtx.folio.geo.scale * (hsm.settings.screenDpi / inchInMm);
  }

  pToMmXY(xP, yP) {
    return [xP / this.scalePhy() - this.geo.x0, yP / this.scalePhy() - this.geo.y0];
  }

  raiseChild(childId) {
    // const c = [];
    // let found;
    // for (let child of this.children) {
    //   if (child.id != childId) c.push(child);
    //   else found = child;
    // }
    // if (found) c.push(found);
    // this.children = c;
    U.raiseElement(this.children, childId);
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

  canInsertNote(idz) {
    console.log(`[CbaseElem.canInsertNote] (${this.id}) }`);
    return false;
  }

  setSelected(val) {
    // console.log(`[CbaseElem.setSelected] (${this.id}) } setSelected:${val}`);
    this.isSelected = val;
    for (let child of this.children) {
      child.setSelected(val);
    }
  }

  async updateNotes() {
    for (let child of this.children) {
      child.updateNotes();
    }
  }

  pxToMm(xP, yP) {
    let [x, y] = applyToPoint(this.geo.matR, [xP, yP]);
    [x, y] = [x / U.pxPerMm, y / U.pxPerMm];
    return [x, y];
  }

  adjustChange(changedId) {
    // console.log(`[CbaseElem.adjustChange] id:${this.id}`);
    for (let child of this.children) {
      child.adjustChange(changedId);
    }
  }

}
