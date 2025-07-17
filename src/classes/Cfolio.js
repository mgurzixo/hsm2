"use strict";

import * as U from "src/lib/utils";
import { hsm, cCtx, hCtx } from "src/classes/Chsm";
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
      hsm.hElems.insertElem(myState);
      this.children.push(myState);
      myState.load(stateOption);
    }
  }

  drawFolioBackground() {
    cCtx.fillStyle = hsm.settings.styles.folioBackground;
    cCtx.beginPath();
    const s = this.scalePhy();
    cCtx.rect(
      Math.round(this.geo.x0 * s) + 0.5,
      Math.round(this.geo.y0 * s) + 0.5,
      Math.round(this.geo.width * s) + 0.5,
      Math.round(this.geo.height * s) + 0.5,
    );
    cCtx.fill();
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

  dragStart() {
    const idz = this.idz();
    const [x, y] = [idz.x, idz.y];
    // console.log(`[Cfolio.dragStartP] xx:${xx.toFixed()} x:${x.toFixed()}`);
    switch (hCtx.mode) {
      case "INSERT_STATE": {
        const myState = new Cstate(this);
        hsm.hElems.insertElem(myState);
        this.children.push(myState);
      }
      // FALLTHRU
      // eslint-disable-next-line no-fallthrough
      default:
        hCtx.setMode("");
    }
    hCtx.setDragCtx({ id: this.id, x0: this.geo.x0, y0: this.geo.y0, type: "M" });
  }

  drag(dx, dy) {
    // console.log(`[Cfolio.dragP] dx:${dx} dy:${dy}`);
    const dragCtx = hCtx.getDragCtx();
    const [x0, y0] = [dragCtx.x0, dragCtx.y0];
    this.geo.x0 = x0 + dx;
    this.geo.y0 = y0 + dy;
    // console.log(`[Cfolio.drag] (${this.id}) id:${idz.id} zone:${idz.zone}`);
  }

  dragEnd(dx, dy) {
    // console.log(`[Cfolio.dragEnd]`);
    this.drag(dx, dy);
    return true;
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
    console.log(`[Cfolio.wheelP] scale0:${this.geo.scale}`);
    let scale = this.geo.scale + deltas * hsm.settings.deltaScale;
    if (scale >= 1.5) scale += deltas * hsm.settings.deltaScale;
    scale = Math.min(Math.max(0.1, scale), 10);
    const rScale = scale / this.geo.scale;
    this.geo.scale = scale;
    const x0 = (this.geo.x0 - (rScale - 1) * x) / rScale;
    const y0 = (this.geo.y0 - (rScale - 1) * y) / rScale;
    this.geo.x0 = x0;
    this.geo.y0 = y0;
    hsm.draw();
  }

  makeIdz(x, y, idz) {
    const m = this.pToMmL(hsm.settings.cursorMarginP);
    if (x < this.geo.x0 || y < this.geo.y0) return idz;
    if (x < this.geo.x0 || y < this.geo.y0) return idz;
    idz = { id: this.id, zone: "M" };
    for (let child of this.children) {
      idz = child.makeIdz(x - this.geo.x0, y - this.geo.y0, idz);
    }
    // console.log(`[Cfolio.makeIdz] (${this.id}) id:${idz.id} zone:${idz.zone}`);
    return idz;
  }

  canInsertState(idz) {
    return true;
  }
}
