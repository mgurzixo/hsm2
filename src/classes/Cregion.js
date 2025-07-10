"use strict";

import * as U from "src/lib/utils";
import { hsm, ctx } from "src/classes/Chsm";
import { CbaseElem } from "src/classes/CbaseElem";
import { Cstate } from "src/classes/Cstate";

export class CbaseRegion extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
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
    hsm.hElems.insert(myState);
    this.children.push(myState);
    myState.load(stateOptions);
  }

  dragStart(xx, yy) {
    // (xx, yy) in mm from parent origin
    // Inside us
    let elem;
    const [x, y] = [xx - this.geo.x0, yy - this.geo.y0];
    console.log(
      `[Cregion.dragStart] ${this.id} yy:${yy?.toFixed()} y:${y?.toFixed()} y0:${this.geo.y0}`,
    );
    if (!U.pointInWH(x, y, this.geo)) return null;
    for (let child of this.children.toReversed()) {
      // Is it inside a child
      elem = child.dragStart(x, y);
      if (elem) break;
    }
    if (elem) return elem;
    // For now, the region is not draggable
    // this.parent.raiseChildR(this.id);
    // hsm.hElems.setDragCtx(this.id, {x0:this.geo.x0, y0:this.geo.y0, type:"MOVE"});
    // return this;
    return null;
  }

  drag(dx, dy) {
    if (hsm.hElems.getDraggedId() != this.id) {
      for (let child of this.children.toReversed()) {
        child.drag(dx, dy);
      }
      return;
    }
    // console.log(`[Cstate.drag] dx:${dx} dy:${dy}`);
    const dragCtx = hsm.hElems.getDragCtx();
    const [x0, y0] = [dragCtx.x0, dragCtx.y0];
    dx = U.myClamp(dx, x0, this.geo.width, 0, this.parent.geo.width);
    dy = U.myClamp(dy, y0, this.geo.height, 0, this.parent.geo.height);
    this.geo.x0 = x0 + dx;
    this.geo.y0 = y0 + dy;
  }

  draw() {
    // console.log(`[Cregion.draw] Drawing ${this.id}`);
    // For now, no region background
    // console.log(`[Cregion.draw]`);
    // Sync with a modified state size
    this.geo.y0 = hsm.settings.stateRadiusMm;
    this.geo.height = this.parent.geo.height - hsm.settings.stateRadiusMm;
    this.geo.width = this.parent.geo.width;
    for (let child of this.children) {
      child.draw();
    }
  }

  load(regionOptions) {
    // console.log(`[Cregion.load] states:${regionOptions?.states}`);
    for (let stateOption of regionOptions.states) {
      const myState = new Cstate(this, stateOption);
      hsm.hElems.insert(myState);
      this.children.push(myState);
      myState.load(stateOption);
    }
    this.updateGeo00();
  }
}
