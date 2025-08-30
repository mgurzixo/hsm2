"use strict";

import * as U from "src/lib/utils";
import { hsm, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { CbaseElem } from "src/classes/CbaseElem";
import { Cstate } from "src/classes/Cstate";
import { inverse, toCSS, applyToPoint } from 'transformation-matrix';
import { Cnote } from "src/classes/Cnote";
import { setDragOffset } from "src/lib/rootElemListeners";
import { Cjunction } from "src/classes/Cjunction";

export class CregionWithStates extends CbaseElem {
  constructor(parent, regionOptions, type) {
    super(parent, regionOptions, type);
    const g = this.geo;
    // console.log(`[Cregion.constructor] (${this.id}) mat:${JSON.stringify(g.mat)}`);
    this.setGeometry();
    // this.myElem.innerHTML = `<div>${this.id} of state ${this.parent.id}</div>`;
    this.junctions = [];
    this.junctionsElem = document.createElement("div");
    this.junctionsElem.id = "junctionsElem_" + this.id;
    this.myElem.prepend(this.junctionsElem);

    this.notes = [];
    this.notesElem = document.createElement("div");
    this.notesElem.id = "notesElem_" + this.id;
    this.myElem.prepend(this.notesElem);
    // console.log(`[Cregion.constructor] (${this.id}) children:"${this.children}"`);

    if (regionOptions.notes) {
      for (let noteOptions of regionOptions.notes) {
        this.addNote(noteOptions);
      }
    }
    if (regionOptions.junctions) {
      for (let junctionOptions of regionOptions.junctions) {
        this.addJunction(junctionOptions);
      }
    }
    if (regionOptions.states) {
      for (let stateOptions of regionOptions.states) {
        this.addState(stateOptions);
      }
    }
  }

  async onLoaded() {
    // console.log(`[Cregion.onLoaded] (${this.id}) this.children:"${this.children}"`);
    await super.onLoaded();
    for (let note of this.notes) {
      await note.onLoaded();
    }
    for (let junction of this.junctions) {
      junction.onLoaded();
    }
  }

  rePaint() {
    for (let note of this.notes) {
      note.rePaint();
    }
    for (let child of this.children) {
      child.rePaint();
    }
  }

  destroy() {
    // console.log(`[Cregion.destroy] (${this.id})`);
    super.destroy();
    this.notesElem.remove();
    this.junctionsElem.remove();
  }

  setSelected(val) {
    // console.log(`[Chsm.setSelected](${ this.id }) } setSelected: ${ val; } `);
    super.setSelected(val);
    for (let note of this.notes) {
      note.setSelected(val);
    }
    for (let junction of this.junctions) {
      junction.setSelected(val);
    }
  }

  raiseStates() {
    this.myElem.append(this.childElem);
  }

  raiseJunctions() {
    this.myElem.append(this.junctionsElem);
  }

  // Returns childrenBB in parent origin
  getChildrenBB(bb) {
    // console.log(`[Cregion.getChildrenBB] (${this.id}) name:${this.name}`);

    const updateBB = (geo) => {
      let u = geo.x0;
      if (bb.x0 == null) bb.x0 = u;
      else if (u < bb.x0) bb.x0 = u;
      u = geo.y0;
      if (bb.y0 == null) bb.y0 = u;
      else if (u < bb.y0) bb.y0 = u;
      u = this.geo.x0 + geo.x0 + geo.width;
      if (bb.x1 == null) bb.x1 = u;
      else if (u > bb.x1) bb.x1 = u;
      u = this.geo.y0 + geo.y0 + geo.height;
      if (bb.y1 == null) bb.y1 = u;
      else if (u > bb.y1) bb.y1 = u;
    };

    for (let child of this.children) {
      // console.log(`[Cregion.getChildrenBB] ${ child.id}.geo.y0:${ child.geo.y0; } `);
      updateBB(child.geo);
    }
    for (let note of this.notes) {
      updateBB(note.geo);
    }
    return bb;
  }

  childIntersect(son) {
    for (let child of this.children) {
      if (child == son) continue;
      if (U.rectsIntersect(child.geo, son.geo)) return true;
    }
    for (let junction of this.junctions) {
      if (junction == son) continue;
      if (U.rectsIntersect(junction.geo, son.geo)) return true;
    }
    return false;
  }

  setChildrenDragOrigin() {
    // console.log(`[Cregion.setChildrenDragOrigin] myId:${ this.id} `);
    for (let state of this.children) {
      state.setDragOrigin();
    }
  }

  patchRegionGeometry(dx0, dy0) {
    this.setGeometry();
    for (let child of this.children) {
      child.patchSelfFromDragOrigin(dx0, dy0);
    }
  }

  async insertState(xP, yP) {
    // const [x, y] = [U.pxToMm(xP), U.pxToMm(yP)];
    const idz = this.idz();
    const [x, y] = [idz.x, idz.y];
    // console.log(`[Cregion.insertState] Inserting state x:${ x.toFixed(); } y:${ y.toFixed(); } `);
    const h = hsm.settings.stateMinHeightMm;
    const w = hsm.settings.stateMinWidthMm;
    const id = "S" + hsm.newSernum();
    const m = hsm.settings.minDistanceMm;
    const stateOptions = {
      id: id,
      name: "State " + id,
      color: "blue",
      geo: {
        x0: x,
        y0: y,
        width: w,
        height: h,
      },
      justCreated: true,
      parentElem: this.myElem,
    };
    const myState = await this.addState(stateOptions);
    console.log(`[Cregion.insertState] New state id:${myState?.id} `);
    modeRef.value = "";
    setDragOffset([U.mmToPx(w), U.mmToPx(h)]);
    const newIdz = { id: myState.id, zone: "BR", x: 0, y: 0 };
    // console.log(`[Cregion.insertState] newIdz:${ JSON.stringify(newIdz); } `);
    hCtx.setIdz(newIdz);
    await myState.dragStart(xP, yP); // Will create dragCtx
  }

  addState(stateOptions) {
    const stEl = document.createElement("div");
    this.childElem.append(stEl);
    stateOptions.myElem = stEl;
    const myState = new Cstate(this, stateOptions);
    this.children.push(myState);
    return myState;
  }

  canInsertState(idz) {
    const m = hsm.settings.minDistanceMm;
    const h = hsm.settings.stateMinHeightMm;
    const w = hsm.settings.stateMinWidthMm;
    const [x0, y0] = [idz.x, idz.y];
    // console.log(`[Cregion.canInsertState](${ this.id }) idz.y:${ idz.y.toFixed(); } x0:${ x0.toFixed(); } y0:${ y0.toFixed(); } `);
    if (x0 < m || x0 >= this.geo.width - m - w) return false;
    if (y0 < m || y0 >= this.geo.height - m - h) return false;
    for (let child of this.children) {
      let geo = { x0: idz.x, y0: idz.y, width: w, height: h };
      // console.log(`[Cregion.canInsertState](${ this.id }) gCId:${ child.id; } `);
      if (U.rectsIntersect(child.geo, geo)) return false;
    }
    return true;
  }

  async insertNote(x, y) {
    console.log(`[Cregion.dragStartP] Inserting note x:${x}`);
    const id = "N" + hsm.newSernum();
    const n = hsm.settings.styles.note;
    const w = n.noteMinWidth;
    const h = n.noteMinHeight;

    const noteOptions = {
      id: id,
      name: "Note " + id,
      color: "blue",
      geo: {
        x0: x,
        y0: y,
        width: w,
        height: h,
      },
      text: "Text",
      scale: 1,
      font: n.defaultFont,
      justCreated: true,
    };
    const myNote = this.addNote(noteOptions);
    console.log(`[Cregion.addNote] New note:${myNote} id:${myNote?.id} `);
    await myNote.onLoaded();
    modeRef.value = "";
    setDragOffset([U.mmToPx(w), U.mmToPx(h)]);
    const newIdz = { id: myNote.id, zone: "BR", x: 0, y: 0 };
    hCtx.setIdz(newIdz);
    await myNote.dragStart(); // Will create dragCtx
  }

  addNote(noteOptions) {
    // console.log(`[Cregion.addNote] noteOptions:${JSON.stringify(noteOptions)} `);
    const noteEl = document.createElement("div");
    this.notesElem.append(noteEl);
    noteOptions.myElem = noteEl;
    const myNote = new Cnote(this, noteOptions, "N");
    this.notes.push(myNote);
    // console.log(`[Cregion.addNote] id:${myNote.id} text:${myNote.text}`);
    return myNote;
  }

  canInsertNote(idz) {
    // console.log(`[Cregion.canInsertNote](${this.id}) idz.y:${idz.y} `);
    if (idz.zone != "M") return false;
    const n = hsm.settings.styles.note;
    const m = hsm.settings.minDistanceMm;
    const h = n.noteMinHeight;
    const w = n.noteMinWidth;
    const [x0, y0] = [idz.x, idz.y];
    if (x0 < m || x0 >= this.geo.width - w - m) return false;
    if (y0 < m || y0 >= this.geo.height - h - m) return false;
    // console.log(`[Cregion.canInsertNote] (${this.id}) Yes!`);
    return true;
  }

  addJunction(junctionOptions) {
    // console.log(`[Cregion.addJunction] junctionOptions:${JSON.stringify(junctionOptions)} `);
    const junctionEl = document.createElement("div");
    this.junctionsElem.append(junctionEl);
    junctionOptions.myElem = junctionEl;
    const myJunction = new Cjunction(this, junctionOptions, "N");
    this.junctions.push(myJunction);
    // console.log(`[Cregion.addJunction] id:${myNote.id} text:${myNote.text}`);
    return myJunction;
  }

  async insertJunction(xP, yP) {
    console.log(`[Cregion.insertJunction]`);
    const idz = this.idz();
    const [x, y] = [idz.x, idz.y];
    const s = hsm.settings.styles.junction;
    const thickness = s.junctionThicknessMm || 1;
    const length = s.junctionMinLengthMm || 10;
    const id = "J" + hsm.newSernum();
    const orientation = "vertical";
    const junctionOptions = {
      id: id,
      name: "Junction " + id,
      orientation,
      thickness,
      length,
      geo: {
        x0: x,
        y0: y,
        width: orientation === "vertical" ? thickness : length,
        height: orientation === "vertical" ? length : thickness,
      },
      justCreated: true,
      parentElem: this.myElem,
    };
    const myJunction = this.addJunction(junctionOptions);
    console.log(`[Cregion.insertJunction] New junction id:${myJunction?.id} `);
    modeRef.value = "";
    setDragOffset([U.mmToPx(junctionOptions.geo.width), U.mmToPx(junctionOptions.geo.height)]);
    const newIdz = { id: myJunction.id, zone: "BR", x: 0, y: 0 };
    hCtx.setIdz(newIdz);
    await myJunction.dragStart(xP, yP);
  }

  canInsertJunction(idz) {
    const m = hsm.settings.minDistanceMm;
    // Default to vertical for test; you may want to check orientation in the future
    const w = hsm.settings.junctionThicknessMm || 6;
    const h = hsm.settings.junctionMinLengthMm || 30;
    const [x0, y0] = [idz.x, idz.y];
    if (x0 < m || x0 >= this.geo.width - m - w) return false;
    if (y0 < m || y0 >= this.geo.height - m - h) return false;
    // for (let child of this.children) {
    //   let geo = { x0: idz.x, y0: idz.y, width: w, height: h };
    //   if (U.rectsIntersect(child.geo, geo)) return false;
    // }
    // console.log(`[Cregion.canInsertJunction] (${this.id}) Can Insert Junction`);
    return true;
  }

  async dragStart(xP, yP) {
    console.log(`[Cregion.dragStart]`);
    const idz = this.idz();
    const [x, y] = [idz.x, idz.y];
    // console.log(`[Cregion.dragStart] xP :${ xP ?.toFixed(); } x:${ x.toFixed(); } `);
    switch (modeRef.value) {
      case "inserting-state": {
        await this.insertState(xP, yP);
        return this;
      }
      case "inserting-note": {
        await this.insertNote(x, y);
        return this;
      }
      case "inserting-junction": {
        await this.insertJunction(xP, yP);
        return this;
      }
      default:
        modeRef.value = "";
    }
    hCtx.setDragCtx({ id: this.id, x0: this.geo.x0, y0: this.geo.y0, type: "M", mat: this.geo.mat });
    // console.log(`[Cregion.dragStart] dragCtx:${JSON.stringify(hCtx.getDragCtx())} `);
    // console.log(`[Cregion.dragStart] matrix:${ getComputedStyle(this.myElem).transform; } `);
    return this;
  }

  drag(dxP, dyP) {
    // dxP, dyP are in screen (pixel) space
    const g = this.geo;
    const d = hCtx.getDragCtx();
    const mat = {};
    Object.assign(mat, this.geo.mat);
    mat.e = d.mat.e + dxP;
    mat.f = d.mat.f + dyP;
    // console.log(`[Cregion.drag] mat1:${ JSON.stringify(mat); } `);
    this.setMat(mat);
  }

  dragEnd(dxP, dyP) {
    this.drag(dxP, dyP);
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm of mousePos in this.geo.[x0,y0] frame
    const bak = Object.assign({}, idz);
    const m = U.pxToMm(hsm.settings.cursorMarginP);
    // console.log(`[Cregion.makeIdz](${ this.id }(${ this.parent.id })) x:${ x.toFixed(); } y:${ y.toFixed(); } x0:${ this.geo.x0; } `);
    if (
      x < - m ||
      x > this.geo.width + m ||
      y < - m ||
      y > this.geo.height + m
    ) {
      // console.log(`[Cregion.makeIdz](${ this.id }(${ this.parent.id })) returning`);
      return idz;
    }
    if (modeRef.value == "inserting-state" || modeRef.value == "inserting-note" || modeRef.value == "inserting-junction") {
      idz = { id: this.id, zone: "M", x: x, y: y };
    }
    for (let note of this.notes) {
      idz = note.makeIdzInParentCoordinates(x, y, idz);
    }
    for (let junction of this.junctions) {
      idz = junction.makeIdzInParentCoordinates(x, y, idz);
    }
    for (let child of this.children) {
      // console.log(`[Cregion.makeIdz](${ this.id }) calling ${ child.id; } `);
      idz = child.makeIdzInParentCoordinates(x, y, idz);
    }
    return idz;
  }

  makeIdzInParentCoordinates(xp, yp, myIdz) {
    [xp, yp] = [xp * U.pxPerMm, yp * U.pxPerMm];
    let [x, y] = applyToPoint(this.geo.matR, [xp, yp]);
    [x, y] = [x / U.pxPerMm, y / U.pxPerMm];
    // console.log(`[Cregion.makeIdzInParentCoordinates](${this.id}(${this.parent.id})) yp:${yp.toFixed()} y: ${y.toFixed()} f:${this.geo.mat.f.toFixed()} `);
    const idz = this.makeIdz(x, y, myIdz);
    return idz;
  }
}

export class CExternalRegion extends CbaseElem {
  constructor(parent, options) {
    super(parent, options, "E");
  }
}

export class Cregion extends CregionWithStates {
  constructor(parent, options) {
    super(parent, options, "R");
    // this.myElem.style.background = "lightgreen";
  }

  setGeometry() {
    // console.log(`[Cregion.setGeometry](${ this.id })`);
    const s = this.myElem.style;
    const g = this.geo;
    g.x0 = 0;
    g.y0 = hsm.settings.stateTitleHeightMm;
    g.height = this.parent.geo.height - hsm.settings.stateTitleHeightMm;
    g.width = this.parent.geo.width;
    g.mat.e = 0;
    g.mat.f = g.y0 * U.pxPerMm;
    this.geo.matR = inverse(g.mat);
    this.myElem.style.transform = toCSS(this.geo.mat);
    // console.warn(`[CbaseElem.setGeometry](${ this.id }) geo:${ this.geo; } mat:${ JSON.stringify(mat); } `);
    s.top = "0px";
    s.left = "0px";
    s.width = g.width + "mm";
    s.height = g.height + "mm";
    // s.background = "#ff000030";
    s.background = "transparent";
  }
};
