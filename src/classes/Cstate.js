"use strict";

import * as U from "src/lib/utils";
import { R, RR } from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { Cregion } from "src/classes/Cregion";
import { hsm, cCtx, hCtx } from "src/classes/Chsm";
import Color from "colorjs.io";

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
    hsm.hElems.insertElem(myRegion);
    this.children.push(myRegion);
    myRegion.load(regionOptions);
    myRegion.geo.y0 = hsm.settings.stateTitleHeightMm;
    myRegion.geo.height = myRegion.parent.geo.height - hsm.settings.stateTitleHeightMm;
  }

  load(stateOptions) {
    // console.log(`[Cstate.load] regions:${stateOptions?.regions}`);
    if (!stateOptions?.regions) return;
    for (let id of Object.keys(stateOptions.regions)) {
      // console.log(`[Cstate.load] RegionId:${id}`);
      const regionOptions = stateOptions.regions[id];
      this.addRegion(regionOptions);
    }
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

  dragStart() {
    const idz = this.idz();
    // console.log(`[Cstate.dragStart] (${this.id}) x:${x?.toFixed()}`);
    // console.log(
    //   `[Cstate.dragStart] ${this.id} yy:${yy?.toFixed()} y:${y?.toFixed()} y0:${this.geo.y0}`,
    // );
    this.grandchildrenBB = this.getGrandchildrenBB();
    this.setGrandchildrenDragOrigin();
    const dragCtx = {
      id: this.id,
      x0: this.geo.x0,
      y0: this.geo.y0,
      width: this.geo.width,
      height: this.geo.height,
    };
    // console.log(`[Cstate.dragStart] dragCtx:${JSON.stringify(dragCtx)}`);
    hCtx.setDragCtx(dragCtx);
    this.parent.raiseChildR(this.id);
    return this;
  }

  drag(dx, dy) {
    const idz = this.idz();
    console.log(`[Cstate.drag] (${this.id}) dx:${dx.toFixed()} dy:${dy.toFixed()}`);
    const dragCtx = hCtx.getDragCtx();
    let x0 = dragCtx.x0;
    let y0 = dragCtx.y0;
    let width = dragCtx.width;
    let height = dragCtx.height;
    // console.log(`[Cstate.drag] dragCtx:${JSON.stringify(dragCtx)}`);
    if (idz.zone == "M") {
      // console.log(`[Cstate.drag] id:${this.id} idz.zone:${idz.zone}`);
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
      if (idz.zone.includes("T")) {
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
      } else if (idz.zone.includes("B")) {
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
      if (idz.zone.includes("L")) {
        if (width - dx < hsm.settings.stateMinWidth) dx = width - hsm.settings.stateMinWidth;
        if (x0 + dx < hsm.settings.minDistanceMm) dx = hsm.settings.minDistanceMm - x0;
        if (this.grandchildrenBB.x0 && dx > this.grandchildrenBB.x0 - hsm.settings.minDistanceMm)
          dx = this.grandchildrenBB.x0 - hsm.settings.minDistanceMm;
        x0 += dx;
        width -= dx;
        for (let child of this.children) {
          child.patchChildrenOrigin(dx, null);
        }
      } else if (idz.zone.includes("R")) {
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
    //   `[Cstate.drag] type:${idz.zone} Cx0:${dragCtx.x0.toFixed()} dx:${dx.toFixed()} x0:${x0.toFixed()}`,
    // );
    this.geo.x0 = x0;
    this.geo.y0 = y0;
    this.geo.height = height;
    this.geo.width = width;
    if (this.parent.childIntersect(this)) hCtx.setErrorId(this.id);
    else hCtx.setErrorId(null);
  }

  resetDrag(deltaX, deltaY) {
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const totalIterations = Math.ceil(dist / hsm.settings.dragResetSpeed);
    // console.log(`[Cstate.resetDrag] dist:${dist.toFixed()} totalIterations:${totalIterations}`);
    let currentIteration = 0;
    const [changeX, changeY] = [deltaX / totalIterations, deltaY / totalIterations];

    function myCb() {
      const ease = Math.pow(currentIteration / totalIterations - 1, 3) + 1;
      // console.log(`[Cstate.resetDrag] #${currentIteration} ease:${ease.toFixed(2)}`);
      const dx = deltaX * (1 - ease);
      const dy = deltaY * (1 - ease);
      hsm.drag(dx, dy);
      if (!hCtx.getErrorId() || currentIteration >= totalIterations) {
        hCtx.setErrorId(null);
        hCtx.dragEnd();
      } else {
        currentIteration++;
        window.requestIdleCallback(myCb);
      }
      hsm.draw();
      const idz = hCtx.getIdz(); // This is not defined...
      hsm.setCursor(idz);
    }
    window.requestIdleCallback(myCb);
  }

  dragEnd(dx, dy) {
    // console.log(`[Cstate.dragEnd]`);
    this.drag(dx, dy);
    if (hCtx.getErrorId() == this.id) {
      this.resetDrag(dx, dy);
      return false;
    }
    return true;
  }

  pathTitle(px, py, pwidth, pheight, pradius) {
    cCtx.beginPath();
    cCtx.moveTo(px + pradius, py);
    cCtx.lineTo(px + pwidth - pradius, py);
    cCtx.quadraticCurveTo(px + pwidth, py, px + pwidth, py + pradius);
    cCtx.lineTo(px + pwidth, py + pheight);
    cCtx.lineTo(px, py + pheight);
    cCtx.lineTo(px, py + pradius);
    cCtx.quadraticCurveTo(px, py, px + pradius, py);
    cCtx.closePath();
  }

  draw() {
    // console.log(`[Cstate.draw] Drawing ${this.id}`);
    // console.log(`[canvas.drawState] State:${state.name}`);
    let [x0, y0] = this.getXY0InFolio();
    // console.log(`[Cstate.draw] x0:${x0}`);
    let silhouetteWidth = hsm.settings.styles.stateSilhouetteWidth;
    if (hCtx.getErrorId() == this.id) {
      silhouetteWidth = hsm.settings.styles.silhouetteErrorWidth;
    }
    x0 = RR(this.mmToPL(x0), silhouetteWidth);
    y0 = RR(this.mmToPL(y0));
    const width = R(this.mmToPL(this.geo.width));
    const height = R(this.mmToPL(this.geo.height));
    let titleHeight = R(this.mmToPL(hsm.settings.stateTitleHeightMm));
    const stateRadiusP = R(this.mmToPL(hsm.settings.stateRadiusMm));
    if (titleHeight < hsm.settings.stateRadiusMm) titleHeight = hsm.settings.stateRadiusMm;
    // console.log(`[Cstate.draw] x0:${theFolio.rect.x0 + state.rect.x0} x0P:${x0}`);
    let stateBackgroundColor;
    if (this.color) stateBackgroundColor = new Color(this.color);
    else stateBackgroundColor = new Color(hsm.settings.styles.defaultColor);
    stateBackgroundColor.lch.c = hsm.settings.styles.stateColorChroma;
    const titleLightness = hsm.settings.styles.titleLightnessPcs;
    let [stateTitleColor1, stateTitleColor2] = [
      new Color(stateBackgroundColor),
      new Color(stateBackgroundColor),
    ];
    stateBackgroundColor.lch.l = hsm.settings.styles.stateLightnessPc;
    stateTitleColor1.lch.l = titleLightness[0];
    stateTitleColor2.lch.l = titleLightness[1];
    const stateBackgroundColorSrgb = stateBackgroundColor.to("srgb") + "";
    // console.log(`[Cstate.draw] stateBackgroundColor:${stateBackgroundColor.to("srgb") + ""}`);
    // Draw background
    cCtx.fillStyle = stateBackgroundColorSrgb;
    this.pathRoundedRectP(x0, y0, width, height, stateRadiusP);
    cCtx.fill();
    const titleGradient = cCtx.createLinearGradient(x0, y0, x0, y0 + titleHeight);
    titleGradient.addColorStop(1, stateTitleColor1.to("srgb") + "");
    titleGradient.addColorStop(0, stateTitleColor2.to("srgb") + "");
    cCtx.fillStyle = titleGradient;
    this.pathTitle(x0, y0, width, titleHeight, stateRadiusP);
    cCtx.fill();

    // Draw silhouette
    cCtx.lineWidth = silhouetteWidth;
    if (hCtx.getErrorId() == this.id) {
      cCtx.strokeStyle = hsm.settings.styles.silhouetteError;
    } else if (hCtx.getSelectedId() == this.id) {
      cCtx.strokeStyle = hsm.settings.styles.silhouetteSelected;
    } else {
      cCtx.strokeStyle = hsm.settings.styles.silhouetteDefault;
    }

    this.pathRoundedRectP(x0, y0, width, height, stateRadiusP);
    cCtx.stroke();

    cCtx.lineWidth = hsm.settings.styles.stateTitleWidth;
    cCtx.strokeStyle = hsm.settings.styles.stateTitleLine;
    cCtx.beginPath();
    cCtx.moveTo(x0, y0 + titleHeight);
    cCtx.lineTo(x0 + width, y0 + titleHeight);
    cCtx.stroke();

    // Draw title
    cCtx.font = `${Math.round(0.7 * titleHeight)}px sans-serif`;
    cCtx.fillStyle = "black";
    cCtx.textBaseline = "middle";
    cCtx.textAlign = "center";
    cCtx.fillText(
      `${this.id}: ${this.name}`,
      x0 + width / 2,
      y0 + titleHeight / 2,
      width - 1 * stateRadiusP,
    );
    for (let child of this.children) {
      child.draw();
    }
  }

  makeIdz(x, y, idz = { id: hsm.id, zone: "", x: 0, y: 0 }) {
    // console.log(`[Cstate.makeIdz] (${this.id}) x:${x} y:${y}`);
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
    idz = { id: id, zone: zone, x: x, y: y };
    for (let child of this.children) {
      idz = child.makeIdz(x - this.geo.x0, y - this.geo.y0, idz);
    }
    // console.log(`[Cstate.makeIdz] (${this.id}) id:${id} zone:${zone}`);
    return idz;
  }

  canInsertState(idz) {
    if (idz.zone != "M") return false;
    // console.log(`[Cstate.canInsertState] (${this.id}) idz.y:${idz.y}`);
    if (idz.y - this.geo.y0 < hsm.settings.stateTitleHeightMm + hsm.settings.minDistanceMm)
      return false;
    return true;
  }
}
