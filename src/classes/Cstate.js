"use strict";

import * as U from "src/lib/utils";
import { R, RR } from "src/lib/utils";
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
    myRegion.geo.y0 = hsm.settings.stateRadiusMm;
    myRegion.geo.height = myRegion.parent.geo.height - hsm.settings.stateRadiusMm;
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

  setGrandchildrenDragOrigin() {
    for (let child of this.children) {
      child.setChildrenDragOrigin();
    }
  }

  getGrandchildrenBB() {
    let bb = { x0: null, y0: null, x1: null, y1: null };
    for (let child of this.children) {
      bb = child.getChildrenBB(bb);
    }
    // console.log(`[Cstate.getGrandchildrenBB] id:${this.id} bb:${JSON.stringify(bb)}`);
    return bb;
  }

  dragStart(xx, yy) {
    // (xx, yy) in mm from parent origin
    // Inside us
    let elem;
    const [x, y] = [xx - this.geo.x0, yy - this.geo.y0];
    // console.log(`[Cstate.dragStart] ${this.id} xx:${xx?.toFixed()} x:${x?.toFixed()}`);
    // console.log(
    //   `[Cstate.dragStart] ${this.id} yy:${yy?.toFixed()} y:${y?.toFixed()} y0:${this.geo.y0}`,
    // );
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
    else {
      this.setGrandchildrenDragOrigin();
      this.grandchildrenBB = this.getGrandchildrenBB();
    }
    hsm.hElems.setDragCtx(this.id, {
      x0: this.geo.x0,
      y0: this.geo.y0,
      width: this.geo.width,
      height: this.geo.height,
      type: type,
    });
    // console.log(`[Cstate.dragStart] ${this.id} type:${type}`);
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
    // console.log(`[Cstate.drag] id:${this.id} dx:${dx} dy:${dy}`);
    const dragCtx = hsm.hElems.getDragCtx();
    let x0 = dragCtx.x0;
    let y0 = dragCtx.y0;
    let width = dragCtx.width;
    let height = dragCtx.height;
    if (dragCtx.type == "M") {
      // console.log(`[Cstate.drag] id:${this.id} dragCtx.type:${dragCtx.type}`);
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
        // console.log(
        //   `[Cstate.drag] id:${this.id} y0:${y0} dy:${dy} BB.y0:${this.grandchildrenBB.y0}`,
        // );
        if (this.grandchildrenBB.y0 && dy > this.grandchildrenBB.y0 - hsm.settings.minDistanceMm)
          dy = this.grandchildrenBB.y0 - hsm.settings.minDistanceMm;
        y0 += dy;
        height -= dy;
        for (let child of this.children) {
          child.patchChildrenOrigin(null, dy);
        }
      } else if (dragCtx.type.includes("B")) {
        if (height + dy < hsm.settings.stateMinHeight) dy = hsm.settings.stateMinHeight - height;
        if (y0 + height + dy > this.parent.geo.height - hsm.settings.minDistanceMm)
          dy = this.parent.geo.height - height - y0 - hsm.settings.minDistanceMm;
        if (
          this.grandchildrenBB.y1 &&
          height + dy < this.grandchildrenBB.y1 + hsm.settings.minDistanceMm
        )
          dy = this.grandchildrenBB.y1 + hsm.settings.minDistanceMm - height;
        height += dy;
      }
      if (dragCtx.type.includes("L")) {
        if (width - dx < hsm.settings.stateMinWidth) dx = width - hsm.settings.stateMinWidth;
        if (x0 + dx < hsm.settings.minDistanceMm) dx = hsm.settings.minDistanceMm - x0;
        if (this.grandchildrenBB.x0 && dx > this.grandchildrenBB.x0 - hsm.settings.minDistanceMm)
          dx = this.grandchildrenBB.x0 - hsm.settings.minDistanceMm;
        x0 += dx;
        width -= dx;
        for (let child of this.children) {
          child.patchChildrenOrigin(dx, null);
        }
      } else if (dragCtx.type.includes("R")) {
        if (width + dx < hsm.settings.stateMinWidth) dx = hsm.settings.stateMinWidth - width;
        if (x0 + width + dx > this.parent.geo.width - hsm.settings.minDistanceMm)
          dx = this.parent.geo.width - width - x0 - hsm.settings.minDistanceMm;
        if (
          this.grandchildrenBB.y0 &&
          width + dx < this.grandchildrenBB.x1 + hsm.settings.minDistanceMm
        )
          dx = this.grandchildrenBB.x1 + hsm.settings.minDistanceMm - width;
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
    if (this.parent.childIntersect(this)) hsm.hElems.setErrorId(this.id);
    else hsm.hElems.setErrorId(null);
    for (let child of this.children.toReversed()) {
      child.drag(dx, dy);
    }
  }

  resetDrag(deltaX, deltaY) {
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const totalIterations = Math.ceil(dist / hsm.settings.dragResetSpeed);
    // console.log(`[Cstate.resetDrag] dist:${dist.toFixed()} totalIterations:${totalIterations}`);
    let currentIteration = 0;
    const [changeX, changeY] = [deltaX / totalIterations, deltaY / totalIterations];
    const myThis = this;

    function myCb() {
      const ease = Math.pow(currentIteration / totalIterations - 1, 3) + 1;
      // console.log(`[Cstate.resetDrag] #${currentIteration} ease:${ease.toFixed(2)}`);
      const dx = deltaX * (1 - ease);
      const dy = deltaY * (1 - ease);
      myThis.drag(dx, dy);
      if (currentIteration >= totalIterations) {
        hsm.hElems.setErrorId(null);
        hsm.hElems.dragEnd();
      } else {
        currentIteration++;
        window.requestIdleCallback(myCb);
      }
      hsm.draw();
    }
    window.requestIdleCallback(myCb);
  }

  dragEnd(dx, dy) {
    // console.log(`[Cstate.dragEnd]`);
    if (hsm.hElems.getDraggedId() != this.id) {
      for (let child of this.children.toReversed()) {
        child.dragEnd(dx, dy);
      }
      return;
    }
    if (hsm.hElems.getErrorId() == this.id) {
      this.resetDrag(dx, dy);
    } else this.drag(dx, dy);
  }

  pathTitle(px, py, pwidth, pradius) {
    ctx.beginPath();
    ctx.moveTo(px + pradius, py);
    ctx.lineTo(px + pwidth - pradius, py);
    ctx.quadraticCurveTo(px + pwidth, py, px + pwidth, py + pradius);
    ctx.lineTo(px, py + pradius);
    ctx.quadraticCurveTo(px, py, px + pradius, py);
    ctx.closePath();
  }

  draw() {
    // console.log(`[Cstate.draw] Drawing ${this.id}`);
    // console.log(`[canvas.drawState] State:${state.name}`);
    let [x0, y0] = this.getXY0InFolio();
    // console.log(`[Cstate.draw] x0:${x0}`);
    let silhouetteWidth = hsm.settings.styles.stateSilhouetteWidth;
    if (hsm.hElems.getErrorId() == this.id) {
      silhouetteWidth = hsm.settings.styles.silhouetteErrorWidth;
    }
    x0 = RR(this.mmToPL(x0), silhouetteWidth);
    y0 = RR(this.mmToPL(y0));
    const width = R(this.mmToPL(this.geo.width));
    const height = R(this.mmToPL(this.geo.height));
    const titleHeight = R(this.mmToPL(hsm.settings.stateRadiusMm));
    const stateRadiusP = R(this.mmToPL(hsm.settings.stateRadiusMm));
    // console.log(`[Cstate.draw] x0:${theFolio.rect.x0 + state.rect.x0} x0P:${x0}`);
    // Draw background
    ctx.fillStyle = hsm.settings.styles.stateBackground;
    this.pathRoundedRectP(x0, y0, width, height, stateRadiusP);
    ctx.fill();
    ctx.fillStyle = hsm.settings.styles.stateTitleBackground;
    this.pathTitle(x0, y0, width, stateRadiusP);
    ctx.fill();

    // Draw silhouette
    ctx.lineWidth = silhouetteWidth;
    if (hsm.hElems.getErrorId() == this.id) {
      ctx.strokeStyle = hsm.settings.styles.silhouetteError;
    } else if (hsm.hElems.getSelectedId() == this.id) {
      ctx.strokeStyle = hsm.settings.styles.silhouetteSelected;
    } else {
      ctx.strokeStyle = hsm.settings.styles.silhouetteDefault;
    }

    this.pathRoundedRectP(x0, y0, width, height, stateRadiusP);
    ctx.stroke();

    ctx.lineWidth = hsm.settings.styles.stateTitleWidth;
    ctx.strokeStyle = hsm.settings.styles.stateTitleLine;
    ctx.beginPath();
    ctx.moveTo(x0, y0 + titleHeight);
    ctx.lineTo(x0 + width, y0 + titleHeight);
    ctx.stroke();

    // Draw title
    ctx.font = `${Math.round(0.7 * titleHeight)}px sans-serif`;
    ctx.fillStyle = "black";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(
      `${this.id}: ${this.name}`,
      x0 + width / 2,
      y0 + titleHeight / 2,
      width - 1 * stateRadiusP,
    );
    for (let child of this.children) {
      child.draw();
    }
  }

  getIdAndZone(x, y, idz = { id: hsm.id, zone: "" }) {
    // console.log(`[Cstate.getIdAndZone] id:${this.id}`);
    const m = this.pToMmL(hsm.settings.cursorMarginP);
    const r = hsm.settings.stateRadiusMm;
    if (
      x < this.geo.x0 - m ||
      x > this.geo.x0 + this.geo.width + m ||
      y < this.geo.y0 - m ||
      y > this.geo.y0 + this.geo.height + m
    )
      return idz;
    let id = this.id;
    let zone = "M";
    if (x <= this.geo.x0 + r) {
      if (y <= this.geo.y0 + r) zone = "TL";
      else if (y >= this.geo.y0 + this.geo.height - r) zone = "BL";
      else if (x <= this.geo.x0 + m) zone = "L";
    } else if (x >= this.geo.x0 + this.geo.width - r) {
      if (y <= this.geo.y0 + r) zone = "TR";
      else if (y >= this.geo.y0 + this.geo.height - r) zone = "BR";
      else if (x >= this.geo.x0 + this.geo.width - m) zone = "R";
    } else if (y <= this.geo.y0 + m) zone = "T";
    else if (y >= this.geo.y0 + this.geo.height - m) zone = "B";
    idz = { id: id, zone: zone };
    for (let child of this.children) {
      idz = child.getIdAndZone(x - this.geo.x0, y - this.geo.y0, idz);
    }
    // console.log(`[Cstate.getIdAndZone] (${this.id}) id:${id} zone:${zone}`);
    return idz;
  }
}
