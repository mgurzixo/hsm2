"use strict";

import * as U from "src/lib/utils";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { CbaseRegion } from "src/classes/Cregion";
import { Cstate } from "src/classes/Cstate";
import { Ctr } from "src/classes/Ctr";

export class Cfolio extends CbaseRegion {
  constructor(parent, options) {
    super(parent, options, "F");
    this.geo = options.geo;
    this.trs = [];
    // console.log(`[Cfolio.constructor] scale:${options.geo.scale}`);
  }

  addTr(trOptions) {
    const myTr = new Ctr(this, trOptions, "T");
    hsm.hElems.insertElem(myTr);
    this.trs.push(myTr);
    myTr.load(trOptions);
    return myTr;
  }

  load(folioOptions) {
    for (let stateOption of folioOptions.states) {
      const myState = new Cstate(this, stateOption);
      hsm.hElems.insertElem(myState);
      this.children.push(myState);
      myState.load(stateOption);
    }
    for (let trOptions of folioOptions.trs) {
      this.addTr(trOptions);
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
    // console.log(`[Cfolio.draw] Drawing ${this.id} ----------------------`);
    this.drawFolioBackground();
    this.geo.xx0 = this.geo.x0;
    this.geo.yy0 = this.geo.y0;
    // console.log(`[Cfolio.draw] Drawing ${this.id} y0:${this.geo.y0} geo.yy0:${this.geo.yy0}`);
    for (let child of this.children) {
      child.draw(this.geo.xx0, this.geo.yy0);
    }
    for (let tr of this.trs) {
      tr.draw();
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

  insertState(x, y) {
    // console.log(`[Cfolio.dragStartP] Inserting state x:${x.toFixed()}`);
    const h = hsm.settings.stateMinHeight;
    const w = hsm.settings.stateMinWidth;
    const id = "S" + hsm.newSernum();
    const stateOptions = {
      id: id,
      name: "State " + id,
      color: "blue",
      geo: {
        x0: x - this.geo.x0 - w,
        y0: y - this.geo.y0 - h,
        width: w,
        height: h,
      },
    };
    const myState = new Cstate(this, stateOptions, "S");
    // console.log(`[Cfolio.dragStartP] New state id:${myState?.id}`);
    hsm.hElems.insertElem(myState);
    this.children.push(myState);
    hsm.draw();
    modeRef.value = "";
    const m = U.pToMmL(hsm.settings.cursorMarginP);

    const newIdz = myState.makeIdz(x - this.geo.x0 - m, y - this.geo.y0 - m, this.idz());
    hCtx.setIdz(newIdz);
    hsm.setCursor(newIdz);
    myState.dragStart(); // Will create dragCtx
  }

  dragStart() {
    const idz = this.idz();
    const [x, y] = [idz.x, idz.y];
    // console.log(`[Cfolio.dragStartP] idz:${JSON.stringify(idz)}`);
    switch (modeRef.value) {
      case "inserting-state": {
        this.insertState(x, y);
        return;
      }
      default:
        modeRef.value = "";
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

  raiseChildR(id) {
    super.raiseChildR(id);
    hsm.draw();
  }

  wheelP(xP, yP, dyP) {
    const [x, y] = this.pToMmXY(xP, yP);
    const deltas = -dyP / hsm.settings.deltaMouseWheel;
    // console.log(`[Cfolio.wheelP] scale0:${this.geo.scale}`);
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
    // [x,y] in mm of mousePos in this.geo.[x0,y0] frame
    const m = U.pToMmL(hsm.settings.cursorMarginP);
    if (x < this.geo.x0 || y < this.geo.y0) return idz;
    if (x < this.geo.x0 || y < this.geo.y0) return idz;
    idz = { id: this.id, zone: "M", x: x, y: y };
    for (let child of this.children) {
      idz = child.makeIdz(x - this.geo.x0, y - this.geo.y0, idz);
    }
    // console.log(`[Cfolio.makeIdz] S id:${idz.id} zone:${idz.zone}`);
    let bestTIdz = { dist2P: Number.MAX_VALUE };
    for (let tr of this.trs) {
      const tIdz = tr.makeIdz(x, y, idz);
      if (tIdz.dist2P <= bestTIdz.dist2P) bestTIdz = tIdz;
      // if (tr.id == "T9") console.log(`[Cfolio.makeIdz]  (${tIdz.id}) dist2P:${tIdz.dist2P.toFixed()} zone:${tIdz.zone} type:${tIdz.type}`);
    }
    if (bestTIdz.dist2P < hsm.settings.cursorMarginP) {
      idz = bestTIdz;
    }
    // console.log(`[Cfolio.makeIdz] T id:${bestTIdz.id} dist2P:${bestTIdz.dist2P.toFixed()} zone:${bestTIdz.zone} type:${bestTIdz.type}`);
    return idz;
  }

  canInsertState(idz) {
    // console.log(`[Cfolio.canInsertState] (${this.id}) idz.x:${idz.x}`);
    const m = hsm.settings.minDistanceMm;
    const h = hsm.settings.stateMinHeight + m;
    const w = hsm.settings.stateMinWidth + m;
    const [x0, y0] = [idz.x - this.geo.x0, idz.y - this.geo.y0];
    if (x0 < w || x0 >= this.geo.width - m) return false;
    if (y0 < h || y0 >= this.geo.height - m) return false;
    for (let child of this.children) {
      let geo = { x0: idz.x - w, y0: idz.y - this.geo.y0 - h, width: w, height: h };
      // console.log(`[Cfolio.canInsertState] (${this.id}) gCId:${child.id}`);
      if (U.rectsIntersect(child.geo, geo)) return false;
    }
    return true;
  }
}
