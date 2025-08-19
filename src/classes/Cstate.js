"use strict";

import * as U from "src/lib/utils";
import { R, RR } from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { Cregion } from "src/classes/Cregion";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { stateStyles } from "src/lib/styles";
import { Cnote } from "src/classes/Cnote";
import { setDragOffset } from "src/lib/rootElemListeners";
import { fromString, inverse, toCSS, compose, transform, applyToPoint } from 'transformation-matrix';
import StateDialog from "src/components/StateDialog.vue";

class CbaseState extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
    const g = this.geo;
    this.isBaseState = true;
    this.isRevertingDrag = false;
    // console.log(`[Cstate.constructor] New state id:${this.id} parent:${this.parent.id} pelId:${this.myElem.parentElement.id} x0:${g.x0} y0:${g.y0}`);
    this.setGeometry();
  }

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
  constructor(parent, options) {
    super(parent, options, "S");
    this.notes = [];
    this.setStyles();
    this.paint();
    if (options.regions) {
      for (let id of Object.keys(options.regions)) {
        // console.log(`[Cstate.load] RegionId:${ id; } `);
        const regionOptions = options.regions[id];
        this.addRegion(regionOptions);
      }
    }
    if (this.children.length == 0) this.addRegion({});
    if (options.notes) {
      for (let noteOptions of options.notes) {
        this.addNote(noteOptions);
      }
    }
  }

  setSelected(val) {
    // console.log(`[Cstate.setSelected] (${this.id}) setSelected:${val}`);
    super.setSelected(val);
    this.paintBorder();
    for (let note of this.notes) {
      note.setSelected(val);
    }
    for (let tr of hCtx.folio.trs) {
      if (tr.from.id == this.id) tr.setSelected(val);
    }
  }

  setStyles() {
    // console.log(`[Cstate.setStyles] id:${this.id}`);
    this.styles = stateStyles(this.color || hsm.settings.styles.defaultColor);
  }

  async addNote(noteOptions) {
    // console.log(`[Cstate.addNote] noteOptions:${JSON.stringify(noteOptions)}`);
    const myNote = new Cnote(this, noteOptions, "N");
    await myNote.load(noteOptions);
    this.notes.push(myNote);
    // console.log(`[Cstate.addNote] id:${myNote.id}`);
    return myNote;
  }

  async addRegion(regionOptions) {
    const myRegion = new Cregion(this, regionOptions);
    // console.log(`[Cstate.addRegion] (${this.id}) #${this.children.length} added region ${myRegion.id}`);
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

  paint() {
    this.myElem.replaceChildren();
    const se = this.myElem.style;
    // const g = this.geo;
    se.borderRadius = hsm.settings.stateRadiusMm + "mm";
    const s = this.styles;
    this.paintBorder();
    // // Draw border
    // let borderWidth = s.borderWidth;
    // if (hCtx.getErrorId() == this.id) borderWidth = s.borderErrorWidth;
    // else if (this.isSelected) borderWidth = s.borderSelectedWidth;
    // let borderColor = s.border;
    // if (hCtx.getErrorId() == this.id) borderColor = s.borderError;
    // se.border = `solid ${borderWidth}px  ${borderColor}`;
    // Draw state background
    se.background = s.bg;
    // console.log(`[Cstate.setGeometry] bg:${s.bg} background:${se.backgroundColor}`);
    // Title elem
    let th = hsm.settings.stateTitleHeightMm;
    if (th < hsm.settings.stateRadiusMm) th = hsm.settings.stateRadiusMm;
    const te = document.createElement("div");
    this.titleElem = te;
    this.myElem.append(te);
    te.style.overflow = "hidden";
    te.style.width = "100%";
    te.style.height = th + "mm";
    te.style.borderBottom = `solid ${s.titleLineWidth}px ${s.titleLine}`;
    // Draw state title background
    const tbg = `linear-gradient(${s.titleBgs[0]}, ${s.titleBgs[1]}`;
    // console.log(`[Cstate.draw] tbg:${tbg}`);
    te.style.backgroundImage = tbg;
    // Draw title text
    te.style.font = s.titleTextFont;
    te.style.fontSize = (s.titleTextSizePc / 100) * th + "mm";
    te.style.color = s.titleText;
    te.innerHTML = `<div style="height:100%; display:flex; align-items: center; justify-content:center; text-wrap: nowrap; ">${this.id}: ${this.name}</div></div>`;
    for (let child of this.children) child.setGeometry();
  }

  async onLoaded() {
    for (let child of this.children) {
      await child.onLoaded();
    }
    for (let note of this.notes) {
      await note.onLoaded();
    }
  }

  setGrandchildrenDragOrigin() {
    for (let child of this.children) {
      child.setGrandChildrenDragOrigin();
    }
  }

  getGrandchildrenBB() {
    let bb = { x0: null, y0: null, x1: null, y1: null };
    for (let child of this.children) {
      bb = child.getChildrenBB(bb);
    }
    // console.log(`[Cstate.getGrandchildrenBB] id:${ this.id; } bb:${ JSON.stringify(bb); } `);
    return bb;
  }

  async insertNote(x, y) {
    // console.log(`[Cstate.insertState] Inserting note x:${ x.toFixed(); } `);
    const id = "N" + hsm.newSernum();
    const w = hsm.settings.noteMinWidth;
    const h = hsm.settings.noteMinHeight;
    const noteOptions = {
      id: id,
      name: "Note " + id,
      color: "blue",
      geo: {
        x0: x - this.geo.x0,
        y0: y - this.geo.y0,
        width: w,
        height: h,
      },
      text: "Text",
      justCreated: true,
    };
    setDragOffset([w, h]);
    const myNote = await this.addNote(noteOptions);
    console.log(`[Cfolio.insertNote] New note id:${myNote?.id} `);
    await myNote.onLoaded();
    modeRef.value = "";
    const m = U.pxToMm(hsm.settings.cursorMarginP);
    const newIdz = myNote.makeIdz(x - this.geo.x0 - m, y - this.geo.y0 - m, this.idz());
    hCtx.setIdz(newIdz);
    await myNote.dragStart(); // Will create dragCtx
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

  makeTrPos(side, x, y) {
    const r = hsm.settings.stateRadiusMm;
    let len = this.geo.width;
    let p0 = this.geo.x0;
    let p1 = x;
    if (side == "L" || side == "R") {
      len = this.geo.height;
      p0 = this.geo.y0;
      p1 = y;
    }
    const pos = (p1 - (p0 + r)) / (len - 2 * r);
    return pos;
  }

  async insertTr(x, y) {
    // console.log(`[Cstate.insertTr] Inserting tr x:${x.toFixed()} y:${y.toFixed()}`);
    // console.log(`[Cstate.insertTr] idz:${ JSON.stringify(this.idz()); } `);
    const idz = this.idz();
    const side = idz.zone;
    const pos2 = this.makeTrPos(side, x, y);
    // console.log(`[Cstate.insertTr] pos2:${ pos2.toFixed(2); } `);
    let [xp, yp] = [x, y];
    if (side == "L" || side == "R") yp -= hsm.settings.initialTransLength;
    else xp -= hsm.settings.initialTransLength;
    const pos1 = this.makeTrPos(side, xp, yp);
    // console.log(`[Cstate.insertTr](x: ${(x - this.geo.x0).toFixed(1)} y: ${(y - this.geo.y0).toFixed(1)})`);
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
    const myTr = await hCtx.folio.addTr(trOptions);
    myTr.onLoaded();
    // let [xx0, yy0] = [0, 0];
    // for (let parent = this.parent; parent; parent = parent.parent) {
    //   xx0 += parent.geo.x0;
    //   yy0 += parent.geo.y0;
    // }
    // console.log(`[Cstate.insertTr] (${this.id}) it.id:${myTr?.id} `);
    // const trDragCtx = {
    //   id: myTr.id,
    //   zone: "TO",
    //   type: "A",
    //   xx0: xx0 + x,
    //   yy0: yy0 + y,
    //   tr0: {
    //     from: structuredClone(myTr.from),
    //     to: structuredClone(myTr.to),
    //     segments: structuredClone(myTr.segments)
    //   }
    // };
    // console.log(`[Cstate.insertTr] trDragCtx:${JSON.stringify(trDragCtx)} `);
    // hCtx.setDragCtx(trDragCtx);


    const newIdz = {
      id: myTr.id,
      zone: "TO", x: x, y: y
    };
    modeRef.value = "";
    hCtx.setIdz(newIdz);
    myTr.dragStart();
  }

  async dragStart(xS, yS) {
    const idz = this.idz();
    const [x, y] = [U.pxToMm(xS), U.pxToMm(yS)];
    // [x,y] in mm in this.geo.x/y frame
    // console.log(`[Cstate.dragStart](${this.id}) x:${x?.toFixed()} `);
    // console.log(
    //   `[Cstate.dragStart] ${ this.id; } yy:${ yy?.toFixed(); } y:${ y?.toFixed(); } y0:${ this.geo.y0; } `,
    // );
    hsm.setSelected(this.id);
    switch (modeRef.value) {
      case "inserting-state": {
        await this.insertState(x, y);
        return;
      }
      case "inserting-trans": {
        await this.insertTr(x, y);
        return;
      }
      case "inserting-note": {
        await this.insertNote(x, y);
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
      segments0: {},
      mat: this.geo.mat,
    };
    // ICI
    // for (let tr of hCtx.folio.trs) {
    //   if ((tr.from.id == this.id) || (tr.to.id == this.id)) {
    //     dragCtx.segments0[tr.id] = structuredClone(tr.segments);
    //     // console.log(`[Cstate.dragStart] trId:${ tr.id; } segments:${ dragCtx.segments0[tr.id]; } `);
    //   }
    // }
    // console.log(`[Cstate.dragStart] dragCtx:${ JSON.stringify(dragCtx); } `);
    hCtx.setDragCtx(dragCtx);
    this.parent.raiseChild(this.id);
    hsm.adjustTrAnchors(this.id);
    return this;
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

  drag(dxS, dyS) {
    const idz = this.idz();
    const s0 = hCtx.folio.geo.mat.a;
    let [dx, dy] = [dxS / U.pxPerMm / s0, dyS / U.pxPerMm / s0];
    let [de, df] = [0, 0];
    const d = hCtx.getDragCtx();
    const m = hsm.settings.minDistanceMm;
    const g = this.geo;
    const pg = this.parent.geo;
    let x0 = d.x0;
    let y0 = d.y0;
    let width = d.width;
    let height = d.height;
    // console.log(`[Cstate.drag] dragCtx:${ JSON.stringify(dragCtx); } `);
    // console.log(`[Cstate.drag] id:${this.id} s0:${s0} x0:${x0} dx:${dx.toFixed()}`);
    if (idz.zone == "M") {
      if (x0 + dx < m) dx = m - x0;
      if (x0 + dx + this.geo.width > this.parent.geo.width - m) dx = this.parent.geo.width - m - x0 - this.geo.width;
      if (y0 + dy < m) dy = m - y0;
      if (y0 + dy + this.geo.height > this.parent.geo.height - m) dy = this.parent.geo.height - m - y0 - this.geo.height;
      // dx = U.myClamp(dx, x0, this.geo.width + m, m, this.parent.geo.width - m);
      // dy = U.myClamp(dy, y0, this.geo.height + m, m, this.parent.geo.height - m);
      x0 = d.x0 + dx;
      y0 = d.y0 + dy;
      [de, df] = [dx * U.pxPerMm, dy * U.pxPerMm];
    } else {
      if (idz.zone.includes("T")) {
        if (height - dy < hsm.settings.stateMinHeight) dy = height - hsm.settings.stateMinHeight;
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
        y0 -= dy;
        this.children.forEach(child => child.setGeometry());
      }
      if (idz.zone.includes("L")) {
        if (width - dx < hsm.settings.stateMinWidth) dx = width - hsm.settings.stateMinWidth;
        if (x0 + dx < hsm.settings.minDistanceMm) dx = hsm.settings.minDistanceMm - x0;
        if (this.grandchildrenBB.x0 && dx > this.grandchildrenBB.x0 - hsm.settings.minDistanceMm)
          dx = this.grandchildrenBB.x0 - hsm.settings.minDistanceMm;
        x0 += dx;
        width -= dx;
        de = dx * U.pxPerMm;
        this.children.forEach(child => child.patchRegionGeometry(dx, null));
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
        x0 -= dx;
        this.children.forEach(child => child.setGeometry());
      }
    }

    // console.log(
    //   `[Cstate.drag](${ this.id }) type:${ idz.zone; } Cx0:${ dragCtx.x0.toFixed(); } dx:${ dx.toFixed(); } x0:${ x0.toFixed(); } `,
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
    hsm.openDialog(StateDialog, this);
  }

  checkOpenDialogAndEndDrag() {
    // console.log(`[Cstate.checkOpenDialogAndEndDrag](${ this.id }) justCreated:${ this.justCreated; } `);
    if (this.justCreated == true) {
      hsm.openDialog(StateDialog, this);
      delete this.justCreated;
    }
    hCtx.dragEnd();
  }

  dragRevert(deltaX, deltaY) {
    this.isRevertingDrag = true;
    const dragCtx = hCtx.getDragCtx();
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const totalIterations = Math.ceil(dist / hsm.settings.dragResetSpeed);
    // console.log(`[Cstate.dragRevert] dist:${ dist.toFixed(); } totalIterations:${ totalIterations; } `);
    let currentIteration = 0;
    const [changeX, changeY] = [deltaX / totalIterations, deltaY / totalIterations];
    // Restore original segments
    function myCb() {
      const elem = U.getElemById(hCtx.draggedId);
      const ease = Math.pow(currentIteration / totalIterations - 1, 3) + 1;
      // console.log(`[Cstate.dragRevert] #${ currentIteration; } ease:${ ease.toFixed(2); } `);
      const dx = deltaX * (1 - ease);
      const dy = deltaY * (1 - ease);
      hsm.drag(dx, dy);
      if (!elem.parent.childIntersect(elem) || currentIteration > totalIterations) {
        elem.isRevertingDrag = false;
        for (const trId of Object.keys(dragCtx.segments0)) {
          const tr = U.getElemById(trId);
          tr.segments = dragCtx.segments0[trId.toString()];
        }
        hCtx.setErrorId(null);
        elem.paintBorder();
        elem.checkOpenDialogAndEndDrag();
      } else {
        currentIteration++;
        window.requestIdleCallback(myCb);
      }
      const idz = hCtx.getIdz(); // This is not defined...
      // hsm.setCursor(idz); // TODO !
    }
    window.requestAnimationFrame(myCb);
  }

  dragEnd(dxS, dyS) {
    // console.log(`[Cstate.dragEnd]`);
    this.drag(dxS, dyS);
    const dragCtx = hCtx.getDragCtx();
    // if (this.children[0]) {
    //   if (this.geo.height != dragCtx.height || this.geo.width != dragCtx.width) {
    //     this.children[0].geo.width += this.geo.width - dragCtx.width;
    //     this.children[0].geo.height += this.geo.height - dragCtx.height;
    //     this.children[0].setGeometry();
    //   }
    //   if (this.geo.height != dragCtx.height || this.geo.width != dragCtx.width) {
    //     this.children[0].geo.width += this.geo.width - dragCtx.width;
    //     this.children[0].geo.height += this.geo.height - dragCtx.height;
    //     this.children[0].setGeometry();
    //   }
    // }
    if (hCtx.getErrorId() == this.id) {
      this.dragRevert(dxS, dyS);
      return false;
    }
    this.checkOpenDialogAndEndDrag();
    return true;
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm of mousePos in this.geo.[x0,y0] frame
    // console.log(`[Cstate.makeIdz](${this.id}) x:${x} y: ${y}`);
    // console.log(`[Cstate.makeIdz](${ this.id})[x: ${ x.toFixed() }, y: ${ y.toFixed() }]`);
    const m = (hsm.settings.cursorMarginP / U.pxPerMm) / hCtx.folio.geo.scale;
    // console.log(`[Cstate.makeIdz](${ this.id }) m:${ m } `);
    // const m = hsm.settings.cursorMarginP;
    const r = hsm.settings.stateRadiusMm;
    if (
      x < - m ||
      x > this.geo.width + m ||
      y < - m ||
      y > this.geo.height + m
    )
      return idz;
    let id = this.id;
    let zone = "M";
    if (modeRef.value == "inserting-state") {
      let th = hsm.settings.stateTitleHeightMm;
      if (y < th) {
        idz = { id: id, zone: zone, x: x, y: y };
        return idz;
      }
      // console.log(`[Cstate.makeIdz](${this.id}) ${this.children?.length} children`);
      for (let child of this.children) {
        // console.log(`[Cstate.makeIdz](${this.id}) calling ${child.id} y:${y.toFixed()} `);
        idz = child.makeIdzInParentCoordinates(x, y, idz);
      }
      return idz;
    }
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
    idz = { id: id, zone: zone, x: x, y: y };
    // for (let note of this.notes) {
    // idz = note.makeIdz(x - this.geo.x0, y - this.geo.y0, idz); // TODO
    // }
    for (let child of this.children) {
      // console.log(`[Cstate.makeIdz](${this.id}) calling ${child.id} y:${y.toFixed()}`);
      idz = child.makeIdzInParentCoordinates(x, y, idz);
    }
    // console.log(`[Cstate.makeIdz] (${ this.id }) id:${ id } zone:${ zone } (x: ${ x.toFixed(1)} y: ${ y.toFixed(1) })`);
    return idz;
  }

  makeIdzInParentCoordinates(xp, yp, myIdz) {
    [xp, yp] = [xp * U.pxPerMm, yp * U.pxPerMm];
    let [x, y] = applyToPoint(this.geo.matR, [xp, yp]);
    [x, y] = [x / U.pxPerMm, y / U.pxPerMm];
    const idz = this.makeIdz(x, y, myIdz);
    return idz;
  }

  // pxToMm(xP, yP) {
  //   let [x, y] = applyToPoint(this.geo.matR, [xP, yP]);
  //   [x, y] = [x / U.pxPerMm, y / U.pxPerMm];
  //   return [x, y];
  // }

  // makeIdzP(xP, yP, myIdz) {
  //   // const [x, y] = this.pxToMm(xP, yP);
  //   // const tabMat = [];
  //   // for (let elem = this; elem.parent; elem = elem.parent) {
  //   //   tabMat.push(this.geo.matR);
  //   //   // tabMat.unshift(this.geo.matR);
  //   // }
  //   // const mat = compose(tabMat);
  //   // const mat = compose(this.parent.geo.mat, this.geo.mat);
  //   let [x, y] = applyToPoint(this.parent.geo.mat, [xP, yP]);
  //   [x, y] = applyToPoint(this.geo.mat, [xP, yP]);
  //   [x, y] = [x / U.pxPerMm, y / U.pxPerMm];
  //   let idz = this.makeIdz(x, y, myIdz);
  //   for (let child of this.children) {
  //     idz = child.makeIdzP(x, y);
  //   }
  //   return idz;
  // }

  // canInsertState(idz) {
  //   if (idz.zone != "M") return false;
  //   const m = hsm.settings.minDistanceMm;
  //   const h = hsm.settings.stateMinHeight + m;
  //   const w = hsm.settings.stateMinWidth + m;
  //   const t = hsm.settings.stateTitleHeightMm;
  //   // console.log(`[Cstate.canInsertState](${ this.id }) idz.y:${ idz.y; } `);
  //   const [x0, y0] = [idz.x, idz.y];
  //   if (x0 < w || x0 >= this.geo.width - m) return false;
  //   if (y0 < h + t || y0 >= this.geo.height - m) return false;
  //   for (let child of this.children) {
  //     for (let grandChild of child.children) {
  //       let geo = {
  //         x0: idz.x - w,
  //         y0: idz.y - h - t,
  //         width: w,
  //         height: h,
  //       };
  //       // console.log(`[Cstate.canInsertState](${ this.id }) gCId:${ child.id; } `);
  //       if (U.rectsIntersect(grandChild.geo, geo)) return false;
  //     }
  //   }
  //   return true;
  // }

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
        console.log(`[Cstate.canInsertNote](${this.id}) gCId:${child.id}`);
        if (U.rectsIntersect(grandChild.geo, geo)) return false;
      }
    }
    return true;
  }

  canInsertTr(idz) {
    if (idz.zone != "T" &&
      idz.zone != "R" &&
      idz.zone != "B" &&
      idz.zone != "L") return false;
    const r = hsm.settings.initialTransLength;
    const [x0, y0] = [idz.x, idz.y];
    switch (idz.zone) {
      case "R":
      case "L":
        if (y0 < r) return false;
        break;
      case "T":
      case "B":
        if (x0 < r) return false;
        break;
    }
    return true;
  }

  updateNotes() {
    for (let note of this.notes) {
      note.deleteCanvas();
    }
    for (let child of this.children) {
      child.updateNotes();
    }
  }


};;;;
