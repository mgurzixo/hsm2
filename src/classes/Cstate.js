"use strict";

import * as U from "src/lib/utils";
import { R, RR } from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { Cregion } from "src/classes/Cregion";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { stateStyles } from "src/lib/styles";
import { fromString, inverse, toCSS, compose, transform, applyToPoint } from 'transformation-matrix';
import StateDialog from "src/components/StateDialog.vue";
import he from "he";


class CbaseState extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
    const g = this.geo;
    this.isBaseState = true;
    this.isRevertingDrag = false;
    // console.log(`[Cstate.constructor] New state id:${this.id} parent:${this.parent.id} pelId:${this.myElem.parentElement.id} x0:${g.x0} y0:${g.y0}`);
    this.titleElem = document.createElement("div");
    this.titleElem.id = "titleElem_" + this.id;
    this.myElem.append(this.titleElem);
    this.infoElem = document.createElement("div");
    this.myElem.append(this.infoElem);
    this.entry = options.entry || "";
    this.exit = options.exit || "";
    this.include = options.include || "";
    this.setGeometry();
  }

  async load(stateOptions) { }

  setGeometry() {
    // console.log(`[Cfolio.setGeometry]`);
    const s = this.myElem.style;
    const g = this.geo;
    s.top = "0px";
    s.left = "0px";
    s.width = g.width + "mm";
    s.height = g.height + "mm";
  }

  setGeoFromMat(mat = this.geo.mat) {
    this.geo.mat = mat;
    const matR = inverse(mat);
    this.geo.matR = matR;
    this.geo.x0 = mat.e / U.pxPerMm;
    this.geo.y0 = mat.f / U.pxPerMm;
    this.geo.scale = mat.a;
    this.myElem.style.transform = toCSS(this.geo.mat);
    // console.log(`[Cstate.setGeoFromMat] (${this.id}) geo:${this.geo} mat:${JSON.stringify(mat)}`);
  }

  isSubstate(superstateId) {
    for (let state = this; state.parent; state = state.parent) {
      if (state.parent.id == superstateId) return true;
    }
    return false;
  }

  isSuperstate(substateId) {
    for (let state = U.getElemById(substateId); state.parent; state = state.parent) {
      if (state.parent.id == this.id) return true;
    }
    return false;
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
  constructor(parent, stateOptions) {
    super(parent, stateOptions, "S");
    this.setStyles();
    this.paint();
    if (stateOptions.regions) {
      for (let regionOptions of stateOptions.regions) {
        // console.log(`[Cstate.constructor] RegionId:${ id; } `);
        this.addRegion(regionOptions);
      }
    }
    if (this.children.length == 0) this.addRegion();
    // console.log(`[Cstate.constructor] child:${this.childElem.id} `);
  }

  setSelected(val) {
    // console.log(`[Cstate.setSelected] (${this.id}) setSelected:${val}`);
    super.setSelected(val);
    this.paintBorder();
    for (let tr of hCtx.folio.trs) {
      if (tr.from.id == this.id) tr.setSelected(val);
    }
  }

  setStyles() {
    // console.log(`[Cstate.setStyles] id:${this.id}`);
    this.styles = stateStyles(this.color || hsm.settings.styles.defaultColor, this.id);
  }

  async addRegion(regionOptions = { notes: [], states: [] }) {
    // console.log(`[Cstate.addRegion] (${this.id}) Adding region`);
    const reEl = document.createElement("div");
    this.childElem.append(reEl);
    regionOptions.myElem = reEl;
    const myRegion = new Cregion(this, regionOptions);
    this.children.push(myRegion);
  }

  paintBorder() {
    const s = this.styles;
    const se = this.myElem.style;
    // Draw border
    let borderWidth = s.borderWidth;
    if (hCtx.getErrorId() == this.id) borderWidth = s.borderErrorWidth;
    else if (this.isSelected) borderWidth = s.borderSelectedWidth;
    let borderColor = s.border;
    if (hCtx.getErrorId() == this.id) borderColor = s.borderError;
    se.border = `solid ${borderWidth}px ${borderColor}`;
  }

  paintInfo() {
    const ie = this.infoElem;
    const ies = this.infoElem.style;
    const iev = hsm.settings.styles.state.info;
    ies.fontSize = iev.sizeMm + "mm";
    ies.display = "block";
    ies.textOverflow = "ellipsis";
    ies.margin = iev.marginMm + "mm";
    ies.overflow = "hidden";
    ies.whiteSpace = "nowrap";
    ies.color = iev.textColor;
    ies.background = iev.backgroundColor;
    ies.fontFamily = iev.font;
    ie.innerHTML = "";
    if (this.entry) ie.innerHTML += `<strong style="display:inline-block; width:1.5em;">E/ </strong>${this.entry}<br/>`;
    if (this.exit) ie.innerHTML += `<strong style="display:inline-block; width:1.5em;">X/</strong>${this.exit}<br/>`;
    if (this.include) {
      const inc = this.include.replace(/\n/g, '<br/><div style="display:inline-block; width:1.5em;"></div>');
      ie.innerHTML += `<strong  style="display:inline-block; width:1.5em;">I/</strong>${inc}`;
    }
    // ie.innerHTML = `<strong style="display:inline-block; width:1.5em;">E/ </strong>${this.entry}<br/><strong style="display:inline-block; width:1.5em;">X/</strong>${this.exit}<br/><strong  style="display:inline-block; width:1.5em;">I/</strong>${inc}`;
    // ie.padding = "4px";
  }

  paint() {
    const se = this.myElem.style;
    // const g = this.geo;
    se.borderRadius = hsm.settings.stateRadiusMm + "mm";
    const s = this.styles;
    this.paintBorder();
    // Draw state background
    se.background = s.bg;
    // console.log(`[Cstate.setGeometry] bg:${s.bg} background:${se.backgroundColor}`);
    // Title elem
    let th = hsm.settings.stateTitleHeightMm;
    if (th < hsm.settings.stateRadiusMm) th = hsm.settings.stateRadiusMm;
    const te = this.titleElem;
    te.style.overflow = "hidden";
    te.style.width = "100%";
    te.style.height = th + "mm";
    te.style.borderBottom = `solid ${s.titleLineWidth}px ${s.titleLine}`;
    // Draw state title background
    const tbg = `linear-gradient(${s.titleBgs[0]}, ${s.titleBgs[1]}`;
    // console.log(`[Cstate.draw] tbg:${tbg}`);
    te.style.backgroundImage = tbg;
    // Draw title text
    te.style.font = `${(s.titleTextSizePc / 100) * th + "mm"} ${s.titleTextFont}`;
    te.style.color = s.titleText;
    te.innerHTML = `<div style="height:100%; display:flex; align-items: center; justify-content:center; text-wrap: nowrap; ">${this.id}: ${this.name}</div></div>`;
    this.paintInfo();
    for (let child of this.children) child.setGeometry();
  }

  rePaint() {
    this.paint();
    for (let child of this.children) {
      child.rePaint();
    }
  }

  setGrandchildrenDragOrigin() {
    for (let region of this.children) {
      region.setChildrenDragOrigin();
    }
  }
  setDragOrigin() {
    // console.log(`[Cstate.setDragOrigin] myId:${this.id}`);
    let mat = {};
    Object.assign(mat, this.geo.mat);
    this.dragOrigin = { x0: this.geo.x0, y0: this.geo.y0, mat: mat };
  }

  patchSelfFromDragOrigin(dx0, dy0) {
    const g = this.geo;
    // console.log(`[Cstate.patchSelfFromDragOrigin] (${this.id}) (dx0:${dx0?.toFixed(2)}, dy0:${dy0?.toFixed(2)}) mat:${g.mat}`);
    if (dx0 != null) g.mat.e = this.dragOrigin.mat.e - dx0 * U.pxPerMm;
    if (dy0 != null) g.mat.f = this.dragOrigin.mat.f - dy0 * U.pxPerMm;
    this.setGeoFromMat();
  }

  getGrandchildrenBB() {
    let bb = { x0: null, y0: null, x1: null, y1: null };
    // console.log(`[Cstate.getGrandchildrenBB] (${this.id}) children:${this.children} `);
    for (let child of this.children) {
      // console.log(`[Cstate.getGrandchildrenBB] (${this.id}) child:${Object.keys(child)} name:${child.name}`);
      bb = child.getChildrenBB(bb);
    }
    // console.log(`[Cstate.getGrandchildrenBB] id:${ this.id; } bb:${ JSON.stringify(bb); } `);
    return bb;
  }

  // Returns [x,y] of (side,pos) in state frame
  makeTrXY(side, pos) {
    const r = hsm.settings.stateRadiusMm;
    let len = this.geo.width - 2 * r;
    let [x, y] = [0, 0];
    if (side == "L" || side == "R") {
      len = this.geo.height - 2 * r;
      y = r + len * pos;
      if (side == "R") x += this.geo.width;
    }
    else {
      len = this.geo.width - 2 * r;
      x = r + len * pos;
      if (side == "B") y += this.geo.height;
    }
    // console.log(`[Cstate.makeTrXY] side:${ side; } pos:${ pos.toFixed(2); } (x: ${ x.toFixed(1);
    // } y: ${ y.toFixed(1)})`);
    return [x, y];
  }

  makeTrPos(side, x, y, doClamp = false) {
    const r = hsm.settings.stateRadiusMm;
    let l0, l1, res;
    if (side == "T" || side == "B") {
      l0 = r;
      l1 = this.geo.width - r;
      res = (x - l0) / (l1 - l0);
    } else {
      l0 = r;
      l1 = this.geo.height - r;
      res = (y - l0) / (l1 - l0);
    }
    if (!doClamp) return res;
    res = Math.min(Math.max(0, res), 1);
    return res;
  }

  canInsertTr(idz) {
    if (idz.zone != "T" &&
      idz.zone != "R" &&
      idz.zone != "B" &&
      idz.zone != "L") return false;
    const t = hsm.settings.initialTransLengthMm;
    const r = hsm.settings.stateRadiusMm;
    const [x0, y0] = [idz.x, idz.y];
    switch (idz.zone) {
      case "R":
      case "L":
        if (y0 < t + r) return false;
        break;
      case "T":
      case "B":
        if (x0 < t + r) return false;
        break;
    }
    return true;
  }

  // (x, y) mm in state frame
  async insertTr(x, y) {
    // console.log(`[Cstate.insertTr] Inserting tr x:${x.toFixed()} y:${y.toFixed()}`);
    // console.log(`[Cstate.insertTr] idz:${JSON.stringify(this.idz())} `);
    const idz = this.idz();
    const side = idz.zone;
    const pos2 = this.makeTrPos(side, x, y);
    // console.log(`[Cstate.insertTr] pos2:${ pos2.toFixed(2); } `);
    let [xp, yp] = [x, y];
    if (side == "L" || side == "R") yp -= hsm.settings.initialTransLengthMm;
    else xp -= hsm.settings.initialTransLengthMm;
    const pos1 = this.makeTrPos(side, xp, yp);
    // console.log(`[Cstate.insertTr](x: ${(x - this.geo.x0).toFixed(1)} y: ${(y - this.geo.y0).toFixed(1)})`);
    // console.log(`[Cstate.insertTr] pos1:${pos1} pos2:${pos2}`);
    const trOptions = {
      segments: [],
      from: {
        id: this.id,
        side: idz.zone,
        pos: pos1,
      },
      to: {
        id: this.id,
        side: idz.zone,
        pos: pos2,
      },
      isInternal: false,
      justCreated: true,
    };
    const myTr = hCtx.folio.addTr(trOptions);
    await myTr.onLoaded();
    const [x0, y0] = this.getOriginXYF(); // tr origin is folio
    const newIdz = { id: myTr.id, zone: "TO", x: x0 + x, y: y0 + y };
    modeRef.value = "";
    hCtx.setIdz(newIdz);
    await myTr.dragStart();
  }

  async dragStart(xP, yP) {
    const idz = this.idz();
    const [x, y] = [U.pxToMm(xP), U.pxToMm(yP)];
    // [x,y] in mm in this.geo.x/y frame
    // console.log(`[Cstate.dragStart](${this.id}) x:${x?.toFixed()} `);
    // console.log(
    //   `[Cstate.dragStart] ${ this.id; } yy:${ yy?.toFixed(); } y:${ y?.toFixed(); } y0:${ this.geo.y0; } `,
    // );
    hsm.setSelected(this.id);
    switch (modeRef.value) {
      case "inserting-state": {
        console.error(`[Cstate.dragStart](${this.id}) Error: Cant insert state!`);
        return this;
      }
      case "inserting-trans": {
        await this.insertTr(idz.x, idz.y);
        return;
      }
      case "inserting-note": {
        console.error(`[Cstate.dragStart](${this.id}) Error: Cant insert note!`);
        return;
      }
      case "inserting-junction": {
        console.error(`[Cstate.dragStart](${this.id}) Error: Cant insert junction!`);
        return;
      }
      default:
        modeRef.value = "";
    }
    this.grandchildrenBB = this.getGrandchildrenBB();
    this.setGrandchildrenDragOrigin();
    const dragCtx = {
      id: this.id,
      x0: this.geo.x0,
      y0: this.geo.y0,
      width: this.geo.width,
      height: this.geo.height,
      trsSegments: {},
      mat: this.geo.mat,
    };
    for (let tr of hCtx.folio.trs) {
      if ((tr.from.id == this.id) || (tr.to.id == this.id)) {
        dragCtx.trsSegments[tr.id] = structuredClone(tr.segments);
        // console.log(`[Cstate.dragStart] trId:${ tr.id; } segments:${ dragCtx.trs[tr.id]; } `);
      }
    }
    // console.log(`[Cstate.dragStart] dragCtx:${ JSON.stringify(dragCtx); } `);
    hCtx.setDragCtx(dragCtx);
    this.raise();
    this.parent.raiseStates();
    hsm.adjustTrAnchors(this.id);
    return this;
  }

  drag(dxP, dyP) {
    const idz = this.idz();
    // console.log(`[Cstate.drag] (${this.id}) idz:${JSON.stringify(idz)} `);
    const s0 = hCtx.folio.geo.mat.a;
    let [dx, dy] = [dxP / U.pxPerMm / s0, dyP / U.pxPerMm / s0];
    let [de, df] = [0, 0];
    const d = hCtx.getDragCtx();
    const m = hsm.settings.minDistanceMm;
    const pg = this.parent.geo;
    let x0 = d.x0;
    let y0 = d.y0;
    let width = d.width;
    let height = d.height;
    const zone = idz.zone.toString(); // Can be numeric
    // console.log(`[Cstate.drag] (${this.id}) idz:${JSON.stringify(idz)} `);
    // console.log(`[Cstate.drag] dragCtx:${ JSON.stringify(dragCtx); } `);
    // console.log(`[Cstate.drag] id:${this.id} s0:${s0} x0:${x0} dx:${dx.toFixed()}`);
    if (zone == "M") {
      if (x0 + dx < m) dx = m - x0;
      if (x0 + dx + this.geo.width > pg.width - m) dx = pg.width - m - x0 - this.geo.width;
      if (y0 + dy < m) dy = m - y0;
      if (y0 + dy + this.geo.height > pg.height - m) dy = pg.height - m - y0 - this.geo.height;
      x0 = d.x0 + dx;
      y0 = d.y0 + dy;
      [de, df] = [dx * U.pxPerMm, dy * U.pxPerMm];
    } else {
      if (zone.includes("T")) {
        if (height - dy < hsm.settings.stateMinHeightMm) dy = height - hsm.settings.stateMinHeightMm;
        if (y0 + dy < hsm.settings.minDistanceMm) dy = hsm.settings.minDistanceMm - y0;
        // console.log(
        //   `[Cstate.drag] id:${ this.id; } y0:${ y0; } dy:${ dy; } BB.y0:${ this.grandchildrenBB.y0; } `,
        // );
        if (this.grandchildrenBB.y0 && dy > this.grandchildrenBB.y0 - hsm.settings.minDistanceMm)
          dy = this.grandchildrenBB.y0 - hsm.settings.minDistanceMm;
        y0 += dy;
        height -= dy;
        df = dy * U.pxPerMm;
        this.children.forEach(child => child.patchRegionGeometry(null, dy));
      } else if (zone.includes("B")) {
        if (height + dy < hsm.settings.stateMinHeightMm) dy = hsm.settings.stateMinHeightMm - height;
        if (y0 + height + dy > pg.height - hsm.settings.minDistanceMm)
          dy = pg.height - height - y0 - hsm.settings.minDistanceMm;
        if (
          this.grandchildrenBB.y1 &&
          height + dy < this.grandchildrenBB.y1 + hsm.settings.minDistanceMm
        )
          dy = this.grandchildrenBB.y1 + hsm.settings.minDistanceMm - height;
        height += dy;
        y0 -= dy;
        this.children.forEach(child => child.setGeometry());
      }
      if (zone.includes("L")) {
        if (width - dx < hsm.settings.stateMinWidthMm) dx = width - hsm.settings.stateMinWidthMm;
        if (x0 + dx < hsm.settings.minDistanceMm) dx = hsm.settings.minDistanceMm - x0;
        if (this.grandchildrenBB.x0 && dx > this.grandchildrenBB.x0 - hsm.settings.minDistanceMm)
          dx = this.grandchildrenBB.x0 - hsm.settings.minDistanceMm;
        x0 += dx;
        width -= dx;
        de = dx * U.pxPerMm;
        this.children.forEach(child => child.patchRegionGeometry(dx, null));
      } else if (zone.includes("R")) {
        if (width + dx < hsm.settings.stateMinWidthMm) dx = hsm.settings.stateMinWidthMm - width;
        if (x0 + width + dx > pg.width - hsm.settings.minDistanceMm)
          dx = pg.width - width - x0 - hsm.settings.minDistanceMm;
        if (
          this.grandchildrenBB.y0 &&
          width + dx < this.grandchildrenBB.x1 + hsm.settings.minDistanceMm
        )
          dx = this.grandchildrenBB.x1 + hsm.settings.minDistanceMm - width;
        width += dx;
        x0 -= dx;
        this.children.forEach(child => child.setGeometry());
      }
    }

    // console.log(
    //   `[Cstate.drag](${ this.id }) type:${ zone; } Cx0:${ dragCtx.x0.toFixed(); } dx:${ dx.toFixed(); } x0:${ x0.toFixed(); } `,
    // );
    // console.log(`[Cstate.drag](${ this.id }) Parent id:${ this.parent.id; } `);

    this.geo.x0 = x0;
    this.geo.y0 = y0;
    this.geo.height = height;
    this.geo.width = width;
    // console.log(`[Cstate.drag](${this.id}) width:${width} `);
    this.paintBorder();
    const mat = {};
    Object.assign(mat, this.geo.mat);
    mat.e = d.mat.e + de;
    mat.f = d.mat.f + df;
    // console.log(`[Cfolio.drag] mat1:${ JSON.stringify(mat) } `);
    this.setGeoFromMat(mat);
    if (!this.isRevertingDrag) {
      if (this.parent.childIntersect(this)) hCtx.setErrorId(this.id);
      else hCtx.setErrorId(null);
    }
    hsm.adjustTrAnchors(this.id);
    this.setGeometry();
  }

  openDialog() {
    hsm.setSelected(this.id);
    hsm.openDialog(StateDialog, this);
  }

  checkOpenDialogAndEndDrag() {
    // console.log(`[Cstate.checkOpenDialogAndEndDrag](${ this.id }) justCreated:${ this.justCreated; } `);
    if (this.justCreated == true) {
      this.openDialog();
      delete this.justCreated;
    }
    hCtx.dragEnd();
  }

  dragRevert(deltaX, deltaY) {
    this.isRevertingDrag = true;
    const dragCtx = hCtx.getDragCtx();
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const totalIterations = Math.ceil(dist / hsm.settings.dragResetSpeed);
    // console.log(`[Cstate.dragRevert] dist:${dist.toFixed()} totalIterations:${totalIterations} `);
    let currentIteration = 0;
    const [changeX, changeY] = [deltaX / totalIterations, deltaY / totalIterations];

    // Restore original segments
    function myCb() {
      const elem = U.getElemById(hCtx.draggedId);
      const ease = Math.pow(currentIteration / totalIterations - 1, 3) + 1;
      // console.log(`[Cstate.dragRevert] #${currentIteration} ease:${ease.toFixed(2)} `);
      const dx = deltaX * (1 - ease);
      const dy = deltaY * (1 - ease);
      hsm.makeIdz;
      elem.drag(dx, dy);
      if (currentIteration > totalIterations) {
        elem.isRevertingDrag = false;
        for (const trId of Object.keys(dragCtx.trsSegments)) {
          const tr = U.getElemById(trId);
          tr.segments = dragCtx.trsSegments[trId.toString()];
        }
        hCtx.setErrorId(null);
        elem.paintBorder();
        elem.checkOpenDialogAndEndDrag();
      } else {
        currentIteration++;
        window.requestIdleCallback(myCb);
      }
      hsm.adjustTrAnchors(elem.id);
      elem.setGeometry();
      hsm.makeIdzP(); // Will set cursor
      // hsm.setCursor(idz); // TODO !
    }

    window.requestAnimationFrame(myCb);
  }

  dragEnd(dxP, dyP) {
    // console.log(`[Cstate.dragEnd] (${this.id})`);
    this.drag(dxP, dyP);
    if (hCtx.getErrorId() == this.id) {
      this.dragRevert(dxP, dyP);
      return false;
    }
    this.checkOpenDialogAndEndDrag();
    return true;
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm of mousePos in this.geo.[x0,y0] frame
    // if (this.id == "S2") console.warn(`[Cstate.makeIdz](${this.id}) [x:${x.toFixed()}, y:${y.toFixed()}] x0:${this.geo.x0} e:${this.geo.mat.e}`);
    const m = (hsm.settings.cursorMarginP / U.pxPerMm) / hCtx.folio.geo.scale;
    const r = hsm.settings.stateRadiusMm;
    if (
      x < - m ||
      x > this.geo.width + m ||
      y < - m ||
      y > this.geo.height + m
    ) {
      return idz;
    }
    let zone = "M";
    if (x <= r) {
      if (y <= r) zone = "TL";
      else if (y >= this.geo.height - r) zone = "BL";
      else if (x <= m) zone = "L";
    } else if (x >= this.geo.width - r) {
      if (y <= r) zone = "TR";
      else if (y >= this.geo.height - r) zone = "BR";
      else if (x >= this.geo.width - m) zone = "R";
    } else if (y <= m) zone = "T";
    else if (y >= this.geo.height - m) zone = "B";
    idz = { id: this.id, zone: zone, x: x, y: y };
    for (let child of this.children) {
      idz = child.makeIdzInParentCoordinates(x, y, idz);
    }
    // console.log(`[Cstate.makeIdz](${this.id}) id:${idz.id} zone:${idz.zone} (xz:${idz.x.toFixed(1)} yz:${idz.y.toFixed(1)})`);
    return idz;
  }

  makeIdzInParentCoordinates(xp, yp, myIdz) {
    [xp, yp] = [xp * U.pxPerMm, yp * U.pxPerMm];
    let [x, y] = applyToPoint(this.geo.matR, [xp, yp]);
    [x, y] = [x / U.pxPerMm, y / U.pxPerMm];
    // if (this.id == "S2") console.warn(`[Cstate.maIIPC](${this.id}) [xp:${xp.toFixed()}, yp:${yp.toFixed()}] => [x:${x.toFixed()}, y:${y.toFixed()}] mat:${JSON.stringify(this.geo.mat)}`);
    const idz = this.makeIdz(x, y, myIdz);
    return idz;
  }

  canInsertNote(idz) {
    if (idz.zone != "M") return false;
    const m = hsm.settings.minDistanceMm;
    const h = hsm.settings.noteMinHeight + m;
    const w = hsm.settings.noteMinWidth + m;
    const t = hsm.settings.stateTitleHeightMm;
    // console.log(`[Cstate.canInsertNote](${ this.id }) idz.y:${ idz.y; } `);
    const [x0, y0] = [idz.x, idz.y];
    if (x0 < m || x0 >= this.geo.width - w - m) return false;
    if (y0 < t + m || y0 >= this.geo.height - h - m) return false;
    for (let child of this.children) {
      for (let grandChild of child.children) {
        let geo = {
          x0: idz.x - this.geo.x0,
          y0: idz.y - this.geo.y0 - t,
          width: w,
          height: h,
        };
        console.log(`[Cstate.canInsertNote](${this.id}) gCId:${child.id} `);
        if (U.rectsIntersect(grandChild.geo, geo)) return false;
      }
    }
    return true;
  }
}
