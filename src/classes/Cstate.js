"use strict";

import * as U from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { Cregion } from "src/classes/Cregion";
import { hsm, ctx } from "src/classes/Chsm";

class CbaseState extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
  }
}

export class CentrySstate extends CbaseState {
  constructor(parent, options) {
    super(parent, options, "E");
  }
}

export class CexitSstate extends CbaseState {
  constructor(parent, options) {
    super(parent, options, "X");
  }
}

export class Cstate extends CbaseState {
  constructor(parent, options) {
    super(parent, options, "S");
  }

  addRegion(regionOptions) {
    const myRegion = new Cregion(this, regionOptions);
    hsm.hElems.insert(myRegion);
    this.children.push(myRegion);
    myRegion.load(regionOptions);
    myRegion.geo.y0 = hsm.settings.stateTitleHeight;
    myRegion.geo.height = myRegion.parent.geo.height - hsm.settings.stateTitleHeight;
  }

  load(stateOptions) {
    // console.log(`[Cstate.load] regions:${stateOptions?.regions}`);
    if (!stateOptions?.regions) return;
    for (let id of Object.keys(stateOptions.regions)) {
      // console.log(`[Cstate.load] RegionId:${id}`);
      const regionOptions = stateOptions.regions[id];
      this.addRegion(regionOptions);
    }
    this.updateGeo00();
  }

  click(xx, yy) {
    // (xx, yy) in mm from parent origin
    if (!U.pointInRect(xx, yy, this.geo)) return null;
    // Inside us
    let elem;
    const [x, y] = [xx - this.geo.x0, yy - this.geo.y0];
    for (let child of this.children) {
      // Is it inside a child
      elem = child.click(x, y);
      if (elem) break;
    }
    if (elem) return elem;
    // For us
    // console.log(`[Cstate.click] Raising ${this.id}`);
    this.parent.raiseChildR(this.id);
    return this;
  }

  dragStart(xx, yy) {
    // (xx, yy) in mm from parent origin
    // Inside us
    let elem;
    const [x, y] = [xx - this.geo.x0, yy - this.geo.y0];
    // console.log(`[Cstate.dragStart] ${this.id} xx:${xx?.toFixed()} x:${x?.toFixed()}`);
    console.log(
      `[Cstate.dragStart] ${this.id} yy:${yy?.toFixed()} y:${y?.toFixed()} y0:${this.geo.y0}`,
    );
    if (!U.pointInWH(x, y, this.geo)) return null;
    for (let child of this.children.toReversed()) {
      // Is it inside a child
      elem = child.dragStart(x, y);
      if (elem) break;
    }
    if (elem) return elem;
    // For us
    // Is it an angle
    let type = "";
    const sSize = hsm.settings.stateRadiusMm;
    const width = this.geo.width;
    const height = this.geo.height;
    if (x <= sSize) {
      if (y <= sSize) type = "TL";
      if (y >= height - sSize) type = "BL";
    } else if (x >= width - sSize) {
      if (y <= sSize) type = "TR";
      if (y >= height - sSize) type = "BR";
    }
    if (!type) type = "M";
    hsm.hElems.setDragCtx(this.id, {
      x0: this.geo.x0,
      y0: this.geo.y0,
      width: this.geo.width,
      height: this.geo.height,
      type: type,
    });
    console.log(`[Cstate.dragStart] ${this.id} type:${type}`);
    this.parent.raiseChildR(this.id);
    return this;
  }

  drag(dx, dy) {
    if (hsm.hElems.getDraggedId() != this.id) {
      for (let child of this.children.toReversed()) {
        child.drag(dx, dy);
      }
      return;
    }
    console.log(`[Cstate.drag] id:${this.id}`);
    console.log(`[Cstate.drag] id:${this.id} bb:${JSON.stringify(this.getChildrenBB())}}`);
    const dragCtx = hsm.hElems.getDragCtx();
    let x0 = dragCtx.x0;
    let y0 = dragCtx.y0;
    let width = dragCtx.width;
    let height = dragCtx.height;
    if (dragCtx.type == "M") {
      dx = U.myClamp(
        dx,
        x0,
        this.geo.width + hsm.settings.minDistanceMm,
        hsm.settings.minDistanceMm,
        this.parent.geo.width - hsm.settings.minDistanceMm,
      );
      dy = U.myClamp(
        dy,
        y0,
        this.geo.height + hsm.settings.minDistanceMm,
        hsm.settings.minDistanceMm,
        this.parent.geo.height - hsm.settings.minDistanceMm,
      );
      x0 += dx;
      y0 += dy;
    } else {
      if (dragCtx.type.includes("T")) {
        if (height - dy < hsm.settings.stateMinHeight) dy = height - hsm.settings.stateMinHeight;
        if (y0 + dy < hsm.settings.minDistanceMm) dy = hsm.settings.minDistanceMm - y0;
        y0 += dy;
        height -= dy;
      } else if (dragCtx.type.includes("B")) {
        if (height + dy < hsm.settings.stateMinHeight) dy = hsm.settings.stateMinHeight - height;
        if (y0 + height + dy > this.parent.geo.height - hsm.settings.minDistanceMm)
          dy = this.parent.geo.height - height - y0 - hsm.settings.minDistanceMm;
        height += dy;
      }
      if (dragCtx.type.includes("L")) {
        if (width - dx < hsm.settings.stateMinWidth) dx = width - hsm.settings.stateMinWidth;
        if (x0 + dx < hsm.settings.minDistanceMm) dx = hsm.settings.minDistanceMm - x0;
        x0 += dx;
        width -= dx;
      } else if (dragCtx.type.includes("R")) {
        if (width + dx < hsm.settings.stateMinWidth) dx = hsm.settings.stateMinWidth - width;
        if (x0 + width + dx > this.parent.geo.width - hsm.settings.minDistanceMm)
          dx = this.parent.geo.width - width - x0 - hsm.settings.minDistanceMm;
        width += dx;
      }
    }

    // console.log(
    //   `[Cstate.drag] type:${dragCtx.type} Cx0:${dragCtx.x0.toFixed()} dx:${dx.toFixed()} x0:${x0.toFixed()}`,
    // );
    this.geo.x0 = x0;
    this.geo.y0 = y0;
    this.geo.height = height;
    this.geo.width = width;
    for (let child of this.children.toReversed()) {
      child.drag(dx, dy);
    }
  }

  dragEnd(dx, dy) {
    if (hsm.hElems.getDraggedId() != this.id) {
      for (let child of this.children.toReversed()) {
        child.dragEnd(dx, dy);
      }
      return;
    }
    this.drag(dx, dy);
    // console.log(`[Cfolio.dragEnd]`);
    hsm.hElems.dragEnd();
  }

  draw() {
    // console.log(`[Cstate.draw] Drawing ${this.id}`);
    // console.log(`[canvas.drawState] State:${state.name}`);
    // const x0 = this.TX(this.geo.x0);
    // const y0 = this.TY(this.geo.y0);
    let [x0, y0] = this.getXY0InFolio();
    // console.log(`[Cstate.draw] x0:${x0}`);
    x0 = this.TL(x0);
    y0 = this.TL(y0);
    const width = this.TL(this.geo.width);
    const height = this.TL(this.geo.height);
    const titleHeight = this.TL(hsm.settings.stateTitleHeight);
    // console.log(`[Cstate.draw] x0:${theFolio.rect.x0 + state.rect.x0} x0P:${x0}`);
    ctx.fillStyle = "#ff0";
    ctx.strokeStyle = "#000";
    // theCtx.rect(x0, y0, width, height);
    const stateRadiusP = this.TL(hsm.settings.stateRadiusMm);
    this.PathRoundedRectP(x0, y0, width, height, stateRadiusP);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, y0 + titleHeight);
    ctx.lineTo(x0 + width, y0 + titleHeight);
    ctx.stroke();

    for (let child of this.children) {
      child.draw();
    }
  }
}
