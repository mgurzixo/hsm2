"use strict";

import * as U from "src/lib/utils";
import { hsm, hCtx } from "src/classes/Chsm";
import { CbaseElem } from "src/classes/CbaseElem";
import { Cstate } from "src/classes/Cstate";
import { fromString, inverse, toCSS, compose, transform, applyToPoint } from 'transformation-matrix';

export class CbaseRegion extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
    // console.log(`[CbaseRegion.constructor] New region (${this.id}) parent:${this.parent.id}`);
    for (let stateOptions of options.states) {
      const myState = new Cstate(this, stateOptions);
      this.children.push(myState);
    }
  }

  // Returns childrenBB in parent origin
  getChildrenBB(bb) {
    if (this.id.startsWith("E")) return bb;
    // console.log(`[Cregion.getChildrenBB] geo.y0:${this.geo.y0}`);
    for (let child of this.children) {
      // console.log(`[Cregion.getChildrenBB] ${child.id}.geo.y0:${child.geo.y0}`);
      let u = child.geo.x0;
      if (bb.x0 == null) bb.x0 = u;
      else if (u < bb.x0) bb.x0 = u;
      u = child.geo.y0;
      if (bb.y0 == null) bb.y0 = u;
      else if (u < bb.y0) bb.y0 = u;
      u = this.geo.x0 + child.geo.x0 + child.geo.width;
      if (bb.x1 == null) bb.x1 = u;
      else if (u > bb.x1) bb.x1 = u;
      u = this.geo.y0 + child.geo.y0 + child.geo.height;
      if (bb.y1 == null) bb.y1 = u;
      else if (u > bb.y1) bb.y1 = u;
    }
    return bb;
  }

  childIntersect(son) {
    for (let child of this.children) {
      if (child == son) continue;
      if (U.rectsIntersect(child.geo, son.geo)) return true;
    }
    return false;
  }

  setGrandChildrenDragOrigin() {
    // console.log(`[Cregion.setChildrenDragOrigin] myId:${this.id}`);
    for (let child of this.children) {
      child.setDragOrigin();
    }
  }

  patchRegionGeometry(dx0, dy0) {
    this.setGeometry();
    for (let child of this.children) {
      child.patchSelfFromDragOrigin(dx0, dy0);
    }
  }
}

export class CExternalRegion extends CbaseRegion {
  constructor(parent, options) {
    super(parent, options, "E");
  }
}

export class Cregion extends CbaseRegion {
  constructor(parent, options) {
    super(parent, options, "R");
    const g = this.geo;
    // console.log(`[Cregion.constructor] (${this.id}) mat:${JSON.stringify(g.mat)}`);
    this.setGeometry();
  }

  setGeometry() {
    // console.log(`[Cregion.setGeometry] (${this.id})`);
    const s = this.myElem.style;
    const g = this.geo;
    g.y0 = hsm.settings.stateTitleHeightMm;
    g.height = this.parent.geo.height - hsm.settings.stateTitleHeightMm;
    g.width = this.parent.geo.width;
    g.mat.f = g.y0 * U.pxPerMm;
    this.geo.matR = inverse(g.mat);
    this.myElem.style.transform = toCSS(this.geo.mat);
    // console.warn(`[CbaseElem.setGeometry] (${this.id}) geo:${this.geo} mat:${JSON.stringify(mat)}`);
    s.top = "0px";
    s.left = "0px";
    s.width = g.width + "mm";
    s.height = g.height + "mm";
    // s.background = "red";
    s.background = "transparent";
  }

  async addState(stateOptions) {
    const myState = new Cstate(this, stateOptions);
    this.children.push(myState);
    await myState.load(stateOptions);
  }

  async dragStart() {
    console.error(`[Cregion.dragStart] ${this.id}`);
  }

  drag(dx, dy) {
    console.error(`[Cregion.drag] ${this.id}`);
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm of mousePos in this.geo.[x0,y0] frame
    const bak = Object.assign({}, idz);
    const m = U.pToMmL(hsm.settings.cursorMarginP);
    // console.log(`[Cregion.makeIdz] (${this.id} (${this.parent.id})) x:${x.toFixed()}  y:${y.toFixed()} x0:${this.geo.x0}`);
    if (
      x < - m ||
      x > this.geo.width + m ||
      y < - m ||
      y > this.geo.height + m
    ) {
      // console.log(`[Cregion.makeIdz] (${this.id} (${this.parent.id})) returning`);
      return idz;
    }
    for (let child of this.children) {
      // console.log(`[Cregion.makeIdz](${this.id}) calling ${child.id}`);
      idz = child.makeIdzInParentCoordinates(x, y, idz);
    }
    return idz;
  }

  makeIdzInParentCoordinates(xp, yp, myIdz) {
    [xp, yp] = [xp * U.pxPerMm, yp * U.pxPerMm];
    let [x, y] = applyToPoint(this.geo.matR, [xp, yp]);
    [x, y] = [x / U.pxPerMm, y / U.pxPerMm];
    // console.log(`[Cregion.makeIdzInParentCoordinates](${this.id} (${this.parent.id})) yp:${yp.toFixed()} y:${y.toFixed()} f:${this.geo.mat.f.toFixed()}`);
    const idz = this.makeIdz(x, y, myIdz);
    return idz;
  }
}
