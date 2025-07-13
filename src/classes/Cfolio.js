"use strict";

import * as U from "src/lib/utils";
import { hsm, ctx } from "src/classes/Chsm";
import { CbaseRegion } from "src/classes/Cregion";
import { Cstate } from "src/classes/Cstate";
import { mousePos } from "src/lib/canvasListeners";

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
    ctx.fillStyle = hsm.settings.styles.folioBackground;
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
    const [x, y] = this.pToMmXY(xP, yP);
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
    // console.log(`[Cfolio.dragStartP] xx:${xx.toFixed()} x:${x.toFixed()}`);
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
    const idz = hsm.getIdAndZone(hsm.pToMmL(mousePos.x), hsm.pToMmL(mousePos.y));
    const elem = hsm.hElems.getById(idz.id);
    hsm.hElems.setIdAndZone(idz);
    if (hsm.hElems.getDraggedId() != this.id) {
      for (let child of this.children.toReversed()) {
        child.drag(dx, dy);
      }
      hsm.draw();
      hsm.setCursor(elem.defineCursor(idz));
      return;
    }
    // console.log(`[Cfolio.dragP] dx:${dx} dy:${dy}`);
    const dragCtx = hsm.hElems.getDragCtx();
    const [x0, y0] = [dragCtx.x0, dragCtx.y0];
    this.geo.x0 = x0 + dx;
    this.geo.y0 = y0 + dy;
    hsm.draw();
    console.log(`[Cfolio.getIdAndZone] (${this.id}) id:${idz.id} zone:${idz.zone}`);
    hsm.setCursor(elem.defineCursor(idz));
  }

  dragEndP(dxP, dyP) {
    // console.log(`[Cfolio.dragEndP]`);
    const dx = dxP / this.scalePhy();
    const dy = dyP / this.scalePhy();
    if (hsm.hElems.getDraggedId() != this.id) {
      for (let child of this.children.toReversed()) {
        child.dragEnd(dx, dy);
      }
    } else {
      this.dragP(dxP, dyP);
    }
    if (!hsm.hElems.getErrorId()) {
      hsm.hElems.dragEnd();
      hsm.draw();
      hsm.setupCursor();
    }
    // Else resetDrag will do it!
  }

  dragCancelP(dxP, dyP) {
    this.dragEndP(dxP, dyP);
  }

  raiseChildR(id) {
    super.raiseChildR(id);
    hsm.draw();
  }

  wheelP(xP, yP, dyP) {
    const [x, y] = this.pToMmXY(xP, yP);
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

  getIdAndZone(x, y, idz = { id: hsm.id, zone: "" }) {
    const m = this.pToMmL(hsm.settings.cursorMarginP);
    if (x < this.geo.x0 || y < this.geo.y0) return idz;
    if (x < this.geo.x0 || y < this.geo.y0) return idz;
    idz = { id: this.id, zone: "M" };
    for (let child of this.children) {
      idz = child.getIdAndZone(x - this.geo.x0, y - this.geo.y0, idz);
    }
    // console.log(`[Cfolio.getIdAndZone] (${this.id}) id:${idz.id} zone:${idz.zone}`);
    return idz;
  }
}
