"use strict";

import * as U from "src/lib/utils";
import { R, RR } from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { Cregion } from "src/classes/Cregion";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { stateStyles } from "src/lib/styles";
import { Cnote } from "src/classes/Cnote";
import { setDragOffset } from "src/lib/canvasListeners";

class CbaseState extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
    this.isBaseState = true;
    this.isRevertingDrag = false;
    // console.log(`[Cstate] New state id:${this.id} parent:${this.parent.id}`);
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
  }

  async addNote(noteOptions) {
    // console.log(`[Cstate.addNote] noteOptions:${JSON.stringify(noteOptions)}`);
    const myNote = new Cnote(this, noteOptions, "N");
    hsm.hElems.insertElem(myNote);
    await myNote.load(noteOptions);
    this.notes.push(myNote);
    // console.log(`[Cstate.addNote] id:${myNote.id}`);
    return myNote;
  }

  async addRegion(regionOptions) {
    const myRegion = new Cregion(this, regionOptions);
    hsm.hElems.insertElem(myRegion);
    this.children.push(myRegion);
    await myRegion.load(regionOptions);
    myRegion.geo.y0 = hsm.settings.stateTitleHeightMm;
    myRegion.geo.height = myRegion.parent.geo.height - hsm.settings.stateTitleHeightMm;
  }

  async load(stateOptions) {
    // console.log(`[Cstate.load] regions:${stateOptions?.regions}`);
    if (!stateOptions?.regions) return;
    for (let id of Object.keys(stateOptions.regions)) {
      // console.log(`[Cstate.load] RegionId:${id}`);
      const regionOptions = stateOptions.regions[id];
      this.addRegion(regionOptions);
    }
    if (stateOptions.notes) {
      for (let noteOptions of stateOptions.notes) {
        await this.addNote(noteOptions);
      }
    }
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

  async insertState(x, y) {
    // console.log(`[Cstate.insertState] Inserting state x:${x.toFixed()}`);
    if (!this.children[0]) {
      const rid = "R" + hsm.newSernum();
      const regionOptions = {
        id: rid,
        name: "Region " + rid,
        geo: {
          x0: 0,
          y0: 0,
          width: 0,
          height: 0,
        },
        states: [],
      };
      this.addRegion(regionOptions);
    }
    const h = hsm.settings.stateMinHeight;
    const w = hsm.settings.stateMinWidth;
    const t = hsm.settings.stateTitleHeightMm;
    const id = "S" + hsm.newSernum();
    const stateOptions = {
      id: id,
      name: "State " + id,
      color: "blue",
      geo: {
        x0: x - this.geo.x0 - w,
        y0: y - this.geo.y0 - t - h,
        width: w,
        height: h,
      },
      justCreated: true,
    };
    const myState = new Cstate(this.children[0], stateOptions, "S");
    // console.log(`[Cstate.insertState] New state id:${myState?.id} parent:${myState.parent}`);
    hsm.hElems.insertElem(myState);

    this.children[0].children.push(myState);
    modeRef.value = "";
    hsm.draw();
    const m = U.pToMmL(hsm.settings.cursorMarginP);

    const newIdz = myState.makeIdz(x - this.geo.x0 - m, y - this.geo.y0 - t - m, this.idz());
    hCtx.setIdz(newIdz);
    hsm.setCursor(newIdz);
    await myState.dragStart();
  }

  async insertNote(x, y) {
    // console.log(`[Cstate.insertState] Inserting note x:${x.toFixed()}`);
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
    console.log(`[Cfolio.insertNote] New note id:${myNote?.id}`);
    await myNote.onLoaded();
    hsm.draw();
    modeRef.value = "";
    const m = U.pToMmL(hsm.settings.cursorMarginP);
    const newIdz = myNote.makeIdz(x - this.geo.x0 - m, y - this.geo.y0 - m, this.idz());
    hCtx.setIdz(newIdz);
    hsm.setCursor(newIdz);
    await myNote.dragStart(); // Will create dragCtx
  }

  // Returns [x,y] of (side,pos)
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
    // console.log(`[Cstate.makeTrXY] side:${side} pos:${pos.toFixed(2)} (x:${x.toFixed(1)} y:${y.toFixed(1)})`);
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
    // console.log(`[Cstate.insertTr] idz:${JSON.stringify(this.idz())}`);
    const idz = this.idz();
    const side = idz.zone;
    const pos2 = this.makeTrPos(side, x, y);
    // console.log(`[Cstate.insertTr] pos2:${pos2.toFixed(2)}`);
    let [xp, yp] = [x, y];
    if (side == "L" || side == "R") yp -= hsm.settings.initialTransLength;
    else xp -= hsm.settings.initialTransLength;
    const pos1 = this.makeTrPos(side, xp, yp);
    // console.log(`[Cstate.insertTr] (x:${(x - this.geo.x0).toFixed(1)} y:${(y - this.geo.y0).toFixed(1)})`);
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
    let [xx0, yy0] = [0, 0];
    for (let parent = this.parent; parent; parent = parent.parent) {
      xx0 += parent.geo.x0;
      yy0 += parent.geo.y0;
    }
    console.log(`[Cstate.insertTr] (${this.id}) it.id:${myTr?.id}`);
    const dragCtx = {
      id: myTr.id,
      zone: "TO",
      type: "A",
      xx0: xx0 + x,
      yy0: yy0 + y,
    };
    console.log(`[Cstate.insertTr] dragCtx:${JSON.stringify(dragCtx)}`);
    hCtx.setDragCtx(dragCtx);


    // const m = U.pToMmL(hsm.settings.cursorMarginP);
    // const newIdz = myTr.makeIdz(x, y, this.idz());
    const newIdz = {
      id: myTr.id,
      zone: "TO", x: x, y: y
    };
    hCtx.setIdz(newIdz);
    modeRef.value = "";
    hsm.draw();
    hsm.setCursor(newIdz);
  }

  async dragStart() {
    const idz = this.idz();
    const [x, y] = [idz.x, idz.y];
    // [x,y] in mm in this.geo.x/y frame
    // console.log(`[Cstate.dragStart] (${this.id}) x:${x?.toFixed()}`);
    // console.log(
    //   `[Cstate.dragStart] ${this.id} yy:${yy?.toFixed()} y:${y?.toFixed()} y0:${this.geo.y0}`,
    // );
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
    };
    for (let tr of hCtx.folio.trs) {
      if ((tr.from.id == this.id) || (tr.to.id == this.id)) {
        dragCtx.segments0[tr.id] = structuredClone(tr.segments);
        // console.log(`[Cstate.dragStart] trId:${tr.id} segments:${dragCtx.segments0[tr.id]}`);
      }
    }
    // console.log(`[Cstate.dragStart] dragCtx:${JSON.stringify(dragCtx)}`);
    hCtx.setDragCtx(dragCtx);
    this.parent.raiseChildR(this.id);
    hsm.adjustChange(this.id);
    return this;
  }

  drag(dx, dy) {
    const idz = this.idz();
    // console.log(`[Cstate.drag] (${this.id}) dx:${dx.toFixed()} dy:${dy.toFixed()}`);
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
    //   `[Cstate.drag] (${this.id}) type:${idz.zone} Cx0:${dragCtx.x0.toFixed()} dx:${dx.toFixed()} x0:${x0.toFixed()}`,
    // );
    // console.log(`[Cstate.drag] (${this.id}) Parent id:${this.parent.id}`);
    this.geo.x0 = x0;
    this.geo.y0 = y0;
    this.geo.height = height;
    this.geo.width = width;
    if (!this.isRevertingDrag) {
      if (this.parent.childIntersect(this)) hCtx.setErrorId(this.id);
      else hCtx.setErrorId(null);
    }
    hsm.adjustChange(this.id);
  }

  checkOpenDialogAndEndDrag() {
    // console.log(`[Cstate.checkOpenDialogAndEndDrag] (${this.id}) justCreated:${this.justCreated}`);
    if (this.justCreated == true) {
      hsm.openDialog(this);
      delete this.justCreated;
    }
    hCtx.dragEnd();
  }

  dragRevert(deltaX, deltaY) {
    this.isRevertingDrag = true;
    const dragCtx = hCtx.getDragCtx();
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const totalIterations = Math.ceil(dist / hsm.settings.dragResetSpeed);
    // console.log(`[Cstate.dragRevert] dist:${dist.toFixed()} totalIterations:${totalIterations}`);
    let currentIteration = 0;
    const [changeX, changeY] = [deltaX / totalIterations, deltaY / totalIterations];
    // Restore original segments
    function myCb() {
      const ease = Math.pow(currentIteration / totalIterations - 1, 3) + 1;
      // console.log(`[Cstate.dragRevert] #${currentIteration} ease:${ease.toFixed(2)}`);
      const dx = deltaX * (1 - ease);
      const dy = deltaY * (1 - ease);
      hsm.drag(dx, dy);
      if (currentIteration >= totalIterations) {
        const elem = U.getElemById(hCtx.draggedId);
        elem.isRevertingDrag = false;
        for (const trId of Object.keys(dragCtx.segments0)) {
          const tr = U.getElemById(trId);
          tr.segments = dragCtx.segments0[trId.toString()];
        }
        hCtx.setErrorId(null);
        elem.checkOpenDialogAndEndDrag();
      } else {
        currentIteration++;
        window.requestIdleCallback(myCb);
      }
      hsm.draw();
      const idz = hCtx.getIdz(); // This is not defined...
      hsm.setCursor(idz);
    }
    window.requestAnimationFrame(myCb);
  }

  dragEnd(dx, dy) {
    // console.log(`[Cstate.dragEnd]`);
    this.drag(dx, dy);
    if (hCtx.getErrorId() == this.id) {
      this.dragRevert(dx, dy);
      return false;
    }
    this.checkOpenDialogAndEndDrag();
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

  draw(xx0, yy0) {
    // console.log(`[Cstate.draw] Drawing ${this.id} xx0:${xx0} yy0:${yy0}`);
    // console.log(`[canvas.drawState] State:${state.name}`);
    this.geo.xx0 = xx0 + this.geo.x0;
    this.geo.yy0 = yy0 + this.geo.y0;
    // console.log(`[Cstate.draw] Drawing ${this.id} yy0:${yy0} geo.y0:${this.geo.y0} geo.yy0:${this.geo.yy0}`);
    let silhouetteWidth = hsm.settings.styles.stateSilhouetteWidth;
    if (hCtx.getErrorId() == this.id) {
      silhouetteWidth = hsm.settings.styles.silhouetteErrorWidth;
    }
    const x0P = RR(U.mmToPL(this.geo.xx0), silhouetteWidth);
    const y0P = RR(U.mmToPL(this.geo.yy0));
    const widthP = R(U.mmToPL(this.geo.width));
    const heightP = R(U.mmToPL(this.geo.height));
    let th = hsm.settings.stateTitleHeightMm;
    if (th < hsm.settings.stateRadiusMm) th = hsm.settings.stateRadiusMm;
    let titleHeightP = R(U.mmToPL(th));
    const stateRadiusP = R(U.mmToPL(hsm.settings.stateRadiusMm));
    if (titleHeightP < hsm.settings.stateRadiusMm) titleHeightP = hsm.settings.stateRadiusMm;
    const styles = stateStyles(this.color || hsm.settings.styles.defaultColor);
    // Draw state background
    cCtx.fillStyle = styles.bg;
    U.pathRoundedRectP(x0P, y0P, widthP, heightP, stateRadiusP);
    cCtx.fill();
    // Draw state title background
    // console.log(`[Cstate.draw] titleBgs[0]:${styles.titleBgs[0]} titleBgs[1]:${styles.titleBgs[1]}`);
    const titleGradient = cCtx.createLinearGradient(x0P, y0P, x0P, y0P + titleHeightP);
    titleGradient.addColorStop(1, styles.titleBgs[0]);
    titleGradient.addColorStop(0, styles.titleBgs[1]);
    cCtx.fillStyle = titleGradient;
    this.pathTitle(x0P, y0P, widthP, titleHeightP, stateRadiusP);
    cCtx.fill();
    // Draw border
    cCtx.lineWidth = styles.borderWidth;
    cCtx.strokeStyle = styles.border;
    if (hCtx.getErrorId() == this.id) {
      cCtx.strokeStyle = styles.borderError;
      cCtx.lineWidth = styles.borderErrorWidth;
    } else if (this.isSelected) {
      // console.log(`[Cstate.draw] Selected:${this.isSelected}`);
      cCtx.lineWidth = styles.borderSelectedWidth;
    }
    // cCtx.rect(x0P, y0P, widthP, heightP);
    U.pathRoundedRectP(x0P, y0P, widthP, heightP, stateRadiusP);
    cCtx.stroke();
    // Draw title line
    cCtx.lineWidth = styles.titleLineWidth;
    cCtx.strokeStyle = styles.titleLine;
    cCtx.beginPath();
    cCtx.moveTo(x0P, y0P + titleHeightP);
    cCtx.lineTo(x0P + widthP, y0P + titleHeightP);
    cCtx.stroke();
    // Draw title text
    cCtx.font = `${Math.round((styles.titleTextSizePc / 100) * titleHeightP)}px ${styles.titleTextFont}`;
    cCtx.fillStyle = styles.titleText;
    cCtx.textBaseline = "middle";
    cCtx.textAlign = "center";
    cCtx.fillText(
      `${this.id}: ${this.name}`,
      x0P + widthP / 2,
      y0P + titleHeightP / 2,
      widthP - 1 * stateRadiusP,
    );
    for (let note of this.notes) {
      note.draw(this.geo.xx0, this.geo.yy0);
    }
    for (let child of this.children) {
      child.draw(this.geo.xx0, this.geo.yy0);
    }
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm of mousePos in this.geo.[x0,y0] frame
    // console.log(`[Cstate.makeIdz] (${this.id}) x:${x} y:${y}`);
    const m = U.pToMmL(hsm.settings.cursorMarginP);
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
    for (let note of this.notes) {
      idz = note.makeIdz(x - this.geo.x0, y - this.geo.y0, idz);
    }
    for (let child of this.children) {
      idz = child.makeIdz(x - this.geo.x0, y - this.geo.y0, idz);
    }
    // console.log(`[Cstate.makeIdz] (${this.id}) id:${id} zone:${zone} (x:${x.toFixed(1)} y:${y.toFixed(1)})`);
    return idz;
  }

  canInsertState(idz) {
    if (idz.zone != "M") return false;
    const m = hsm.settings.minDistanceMm;
    const h = hsm.settings.stateMinHeight + m;
    const w = hsm.settings.stateMinWidth + m;
    const t = hsm.settings.stateTitleHeightMm;
    // console.log(`[Cstate.canInsertState] (${this.id}) idz.y:${idz.y}`);
    const [x0, y0] = [idz.x - this.geo.x0, idz.y - this.geo.y0];
    if (x0 < w || x0 >= this.geo.width - m) return false;
    if (y0 < h + t || y0 >= this.geo.height - m) return false;
    for (let child of this.children) {
      for (let grandChild of child.children) {
        let geo = {
          x0: idz.x - this.geo.x0 - w,
          y0: idz.y - this.geo.y0 - t - h,
          width: w,
          height: h,
        };
        // console.log(`[Cstate.canInsertState] (${this.id}) gCId:${child.id}`);
        if (U.rectsIntersect(grandChild.geo, geo)) return false;
      }
    }
    return true;
  }

  canInsertNote(idz) {
    if (idz.zone != "M") return false;
    const m = hsm.settings.minDistanceMm;
    const h = hsm.settings.noteMinHeight + m;
    const w = hsm.settings.noteMinWidth + m;
    const t = hsm.settings.stateTitleHeightMm;
    // console.log(`[Cstate.canInsertNote] (${this.id}) idz.y:${idz.y}`);
    const [x0, y0] = [idz.x - this.geo.x0, idz.y - this.geo.y0];
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
        console.log(`[Cstate.canInsertNote] (${this.id}) gCId:${child.id}`);
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
    const [x0, y0] = [idz.x - this.geo.x0, idz.y - this.geo.y0];
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

  async updateAllNoteCanvas() {
    for (let note of this.notes) {
      await note.makeCanvas();
    }
    for (let child of this.children) {
      await child.updateAllNoteCanvas();
    }
  }


}
