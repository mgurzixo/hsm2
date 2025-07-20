"use strict";

import * as U from "src/lib/utils";
import { hsm, hCtx } from "src/classes/Chsm";
import { CbaseElem } from "src/classes/CbaseElem";
import { Cstate } from "src/classes/Cstate";

export class CbaseRegion extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
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

  setChildrenDragOrigin() {
    // console.log(`[Cregion.setChildrenDragOrigin] myId:${this.id}`);
    for (let child of this.children) {
      child.dragOrigin = { x0: child.geo.x0, y0: child.geo.y0 };
    }
  }

  patchChildrenOrigin(dx, dy) {
    for (let child of this.children) {
      if (dx != null) child.geo.x0 = child.dragOrigin.x0 - dx;
      if (dy != null) child.geo.y0 = child.dragOrigin.y0 - dy;
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
  }

  addState(stateOptions) {
    const myState = new Cstate(this, stateOptions);
    hsm.hElems.insertElem(myState);
    this.children.push(myState);
    myState.load(stateOptions);
  }

  dragStart() {
    console.warn(`[Cregion.dragStart] ${this.id}`);
  }

  drag(dx, dy) {
    if (hCtx.getDraggedId() != this.id) {
      for (let child of this.children.toReversed()) {
        child.drag(dx, dy);
      }
      return;
    }
    // console.log(`[Cregion.drag] dx:${dx} dy:${dy}`);
    const dragCtx = hCtx.getDragCtx();
    const [x0, y0] = [dragCtx.x0, dragCtx.y0];
    dx = U.myClamp(dx, x0, this.geo.width, 0, this.parent.geo.width);
    dy = U.myClamp(dy, y0, this.geo.height, 0, this.parent.geo.height);
    this.geo.x0 = x0 + dx;
    this.geo.y0 = y0 + dy;
  }

  draw(xx0, yy0) {
    // console.log(`[Cregion.draw] Drawing ${this.id} xx0:${xx0} yy0:${yy0}`);
    this.geo.xx0 = xx0 + this.geo.x0;
    this.geo.yy0 = yy0 + this.geo.y0;
    // console.log(`[Cregion.draw] Drawing ${this.id} y0:${this.geo.y0} yy0:${yy0} geo.yy0:${this.geo.yy0}`);
    // For now, no region background
    // console.log(`[Cregion.draw]`);
    // Sync with a modified state size
    this.geo.y0 = hsm.settings.stateTitleHeightMm;
    this.geo.height = this.parent.geo.height - hsm.settings.stateTitleHeightMm;
    this.geo.width = this.parent.geo.width;
    for (let child of this.children) {
      child.draw(this.geo.xx0, this.geo.yy0);
    }
  }

  load(regionOptions) {
    // console.log(`[Cregion.load] states:${regionOptions?.states}`);
    for (let stateOption of regionOptions.states) {
      const myState = new Cstate(this, stateOption);
      hsm.hElems.insertElem(myState);
      this.children.push(myState);
      myState.load(stateOption);
    }
  }

  makeIdz(x, y, idz) {
    const bak = Object.assign({}, idz);
    const m = this.pToMmL(hsm.settings.cursorMarginP);
    if (
      x < this.geo.x0 - m ||
      x > this.geo.x0 + this.geo.width + m ||
      y < this.geo.y0 - m ||
      y > this.geo.y0 + this.geo.height + m
    )
      return idz;
    idz = { id: this.id, zone: "M" };
    for (let child of this.children) {
      idz = child.makeIdz(x - this.geo.x0, y - this.geo.y0, idz);
    }
    if (idz.id == this.id) {
      // It is for us.
      // In fact, the parent state has setup a correct idz
      // and we have to use it
      return bak;
    }
    // console.log(`[Cregion.makeIdz] (${this.id}) id:${idz.id} zone:${idz.zone}`);
    return idz;
  }
}
