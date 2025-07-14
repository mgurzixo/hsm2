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

  dragStart() {
    // (xx, yy) in mm from canvas origin
    // Inside us
    const idz = this.idz();
    const [x, y] = [idz.x, idz.y];
    // console.log(`[Cfolio.dragStartP] xx:${xx.toFixed()} x:${x.toFixed()}`);
    if (!U.pointInWH(x, y, this.geo)) return null;
    if (idz.id != this.id) {
      hsm.hElems.getById(idz.id).dragStart();
      return;
    }
    // For us
    this.parent.raiseChildR(this.id);
    hsm.hElems.setDragCtx(this.id, { x0: this.geo.x0, y0: this.geo.y0, type: "M" });
  }

  drag(dx, dy) {
    // console.log(`[Cfolio.dragP] dx:${dx} dy:${dy}`);
    const idz = hsm.hElems.getIdAndZone();
    if (idz.id != this.id) {
      const elem = hsm.hElems.getById(idz.id);
      elem.drag(dx, dy);
      hsm.draw();
      hsm.setCursor(idz);
      return;
    }
    const dragCtx = hsm.hElems.getDragCtx();
    const [x0, y0] = [dragCtx.x0, dragCtx.y0];
    this.geo.x0 = x0 + dx;
    this.geo.y0 = y0 + dy;
    hsm.draw();
    // console.log(`[Cfolio.getIdAndZone] (${this.id}) id:${idz.id} zone:${idz.zone}`);
    hsm.setCursor(idz);
  }

  dragEnd(dx, dy) {
    // console.log(`[Cfolio.dragEnd]`);
    const idz = hsm.hElems.getIdAndZone();
    if (idz.id != this.id) {
      const elem = hsm.hElems.getById(idz.id);
      elem.dragEnd(dx, dy);
    } else {
      this.drag(dx, dy);
    }
    if (!hsm.hElems.getErrorId()) {
      hsm.hElems.dragEnd();
      hsm.draw();
      const idz = hsm.hElems.getIdAndZone();
      hsm.setCursor(idz);
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

  getIdAndZone(x, y, idz = { id: hsm.id, zone: "", x: 0, y: 0 }) {
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
