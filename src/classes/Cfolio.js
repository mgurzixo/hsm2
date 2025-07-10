"use strict";

import * as U from "src/lib/utils";
import { hsm, ctx } from "src/classes/Chsm";
import { CbaseRegion } from "src/classes/Cregion";
import { Cstate } from "src/classes/Cstate";

export class Cfolio extends CbaseRegion {
  constructor(parent, options) {
    super(parent, options, "F");
    this.geo = options.geo;
    // console.log(`[Cfolio.constructor] scale:${options.geo.scale}`);
  }

  load(folioOptions) {
    for (let stateOption of folioOptions.states) {
      const myState = new Cstate(this, stateOption);
      hsm.hElems.insert(myState);
      this.children.push(myState);
      myState.load(stateOption);
    }
    this.updateGeo00();
  }

  drawFolioBackground() {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    const s = this.scalePhy();
    ctx.rect(
      Math.round(this.geo.x0 * s) + 0.5,
      Math.round(this.geo.y0 * s) + 0.5,
      Math.round(this.geo.width * s) + 0.5,
      Math.round(this.geo.height * s) + 0.5,
    );
    ctx.fill();
  }

  draw() {
    // console.log(`[Cfolio.draw] Drawing ${this.id}`);
    this.drawFolioBackground();
    for (let child of this.children) {
      child.draw();
    }
  }

  hoverP(xP, yP) {
    const [x, y] = this.pToMm(xP, yP);
  }

  clickP(xP, yP) {
    const [xx, yy] = [xP / this.scalePhy(), yP / this.scalePhy()];
    // (xx, yy) in mm from parent origin
    if (!U.pointInRect(xx, yy, this.geo)) return null;
    // Inside us
    let elem;
    const [x, y] = [xx - this.geo.x0, yy - this.geo.y0];
    for (let child of this.children.toReversed()) {
      // Is it inside a child
      elem = child.click(x, y);
      if (elem) break;
    }
    if (elem) return elem;
    // For us
    this.parent.raiseChildR(this.id);
    return this;
  }

  dragStartP(xP, yP) {
    const [xx, yy] = [xP / this.scalePhy(), yP / this.scalePhy()];
    // (xx, yy) in mm from canvas origin
    // Inside us
    let elem;
    const [x, y] = [xx - this.geo.x0, yy - this.geo.y0];
    console.log(`[Cfolio.dragStartP] xx:${xx.toFixed()} x:${x.toFixed()}`);
    if (!U.pointInWH(x, y, this.geo)) return null;
    for (let child of this.children.toReversed()) {
      // Is it inside a child
      elem = child.dragStart(x, y);
      if (elem) break;
    }
    if (elem) return elem;
    // For us
    this.parent.raiseChildR(this.id);
    hsm.hElems.setDragCtx(this.id, { x0: this.geo.x0, y0: this.geo.y0, type: "M" });
    return this;
  }

  dragP(dxP, dyP) {
    const dx = dxP / this.scalePhy();
    const dy = dyP / this.scalePhy();
    if (hsm.hElems.getDraggedId() != this.id) {
      for (let child of this.children.toReversed()) {
        child.drag(dx, dy);
      }
      hsm.draw();
      return;
    }
    // console.log(`[Cfolio.dragP] dx:${dx} dy:${dy}`);
    const dragCtx = hsm.hElems.getDragCtx();
    const [x0, y0] = [dragCtx.x0, dragCtx.y0];
    this.geo.x0 = x0 + dx;
    this.geo.y0 = y0 + dy;
    hsm.draw();
  }

  dragEndP(dxP, dyP) {
    const dx = dxP / this.scalePhy();
    const dy = dyP / this.scalePhy();
    if (hsm.hElems.getDraggedId() != this.id) {
      for (let child of this.children.toReversed()) {
        child.dragEnd(dx, dy);
      }
      return;
    }
    this.dragP(dxP, dyP);
    // console.log(`[Cfolio.dragEndP]`);
    hsm.hElems.dragEnd();
    hsm.draw();
  }

  dragCancelP(dxP, dyP) {
    this.dragEndP(dxP, dyP);
  }

  raiseChildR(id) {
    super.raiseChildR(id);
    hsm.draw();
  }

  wheelP(xP, yP, dyP) {
    const [x, y] = this.pToMm(xP, yP);
    const deltas = -dyP / hsm.settings.deltaMouseWheel;
    let scale = this.geo.scale + deltas * hsm.settings.deltaScale;
    scale = Math.min(Math.max(0.1, scale), 10);
    const rScale = scale / this.geo.scale;
    this.geo.scale = scale;
    const x0 = (this.geo.x0 - (rScale - 1) * x) / rScale;
    const y0 = (this.geo.y0 - (rScale - 1) * y) / rScale;
    this.geo.x0 = x0;
    this.geo.y0 = y0;
    hsm.draw();
  }
}
