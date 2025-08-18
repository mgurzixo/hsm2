"use strict";

import * as U from "src/lib/utils";
import { hsm, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { CbaseElem } from "src/classes/CbaseElem";
import { Cstate } from "src/classes/Cstate";
import { fromString, inverse, toCSS, compose, transform, applyToPoint } from 'transformation-matrix';
import { Cnote } from "src/classes/Cnote";
import { setDragOffset } from "src/lib/rootElemListeners";

export class CbaseRegion extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
  }
}

export class CregionWithStates extends CbaseRegion {
  constructor(parent, options, type) {
    super(parent, options, type);
    const g = this.geo;
    // console.log(`[CbaseRegion.constructor] New region (${this.id}) parent:${this.parent.id} x0:${g.x0} y0:${g.y0}`);
    // console.log(`[Cregion.constructor] (${this.id}) mat:${JSON.stringify(g.mat)}`);
    this.setGeometry();
    // this.myElem.innerHTML = `<div>${this.id} of state ${this.parent.id}</div>`;
    this.notes = [];

    if (options.states) {
      for (let stateOptions of options.states) {
        const myState = new Cstate(this, stateOptions);
        this.children.push(myState);
      }
    }
    return; // ICI
    for (let noteOptions of options.notes) {
      this.addNote(noteOptions);
    }
  }

  setGeometry() {
    // console.log(`[Cregion.setGeometry] (${this.id})`);
    const s = this.myElem.style;
    const g = this.geo;
    g.y0 = hsm.settings.stateTitleHeightMm;
    g.height = this.parent.geo.height - hsm.settings.stateTitleHeightMm;
    g.width = this.parent.geo.width;
    g.mat.f = g.y0 * U.pxPerMm;
    this.geo.matR = inverse(g.mat);
    this.myElem.style.transform = toCSS(this.geo.mat);
    // console.warn(`[CbaseElem.setGeometry] (${this.id}) geo:${this.geo} mat:${JSON.stringify(mat)}`);
    s.top = "0px";
    s.left = "0px";
    s.width = g.width + "mm";
    s.height = g.height + "mm";
    // s.background = "#ff000030";
    s.background = "transparent";
  }

  setSelected(val) {
    // console.log(`[Chsm.setSelected](${ this.id }) } setSelected: ${ val; } `);
    super.setSelected(val);
    for (let note of this.notes) {
      note.setSelected(val);
    }
  }

  async addNote(noteOptions) {
    return; // ICI
    // console.log(`[Cregion.addNote] noteOptions:${ JSON.stringify(noteOptions); } `);
    const myNote = new Cnote(this, noteOptions, "N");
    // await myNote.load(noteOptions);
    this.notes.push(myNote);
    // console.log(`[Cregion.addNote] id:${ myNote.id; } `);
    return myNote;
  }

  async addState(stateOptions) {
    const myState = new Cstate(this, stateOptions);
    this.children.push(myState);
    await myState.load(stateOptions);
  }

  // Returns childrenBB in parent origin
  getChildrenBB(bb) {
    if (this.id.startsWith("E")) return bb;
    // console.log(`[Cregion.getChildrenBB] geo.y0:${this.geo.y0}`);
    for (let child of this.children) {
      // console.log(`[Cregion.getChildrenBB] ${child.id}.geo.y0:${child.geo.y0}`);
      let u = child.geo.x0;
      if (bb.x0 == null) bb.x0 = u;
      else if (u < bb.x0) bb.x0 = u;
      u = child.geo.y0;
      if (bb.y0 == null) bb.y0 = u;
      else if (u < bb.y0) bb.y0 = u;
      u = this.geo.x0 + child.geo.x0 + child.geo.width;
      if (bb.x1 == null) bb.x1 = u;
      else if (u > bb.x1) bb.x1 = u;
      u = this.geo.y0 + child.geo.y0 + child.geo.height;
      if (bb.y1 == null) bb.y1 = u;
      else if (u > bb.y1) bb.y1 = u;
    }
    return bb;
  }

  childIntersect(son) {
    for (let child of this.children) {
      if (child == son) continue;
      if (U.rectsIntersect(child.geo, son.geo)) return true;
    }
    return false;
  }

  setGrandChildrenDragOrigin() {
    // console.log(`[Cregion.setChildrenDragOrigin] myId:${this.id}`);
    for (let child of this.children) {
      child.setDragOrigin();
    }
  }

  patchRegionGeometry(dx0, dy0) {
    this.setGeometry();
    for (let child of this.children) {
      child.patchSelfFromDragOrigin(dx0, dy0);
    }
  }

  async insertState(xS, yS) {
    // const [x, y] = [U.pxToMm(xS), U.pxToMm(yS)];
    const idz = this.idz();
    const [x, y] = [idz.x, idz.y];
    // console.log(`[Cregion.insertState] Inserting state x:${x.toFixed()} y:${y.toFixed()}`);
    const h = hsm.settings.stateMinHeight;
    const w = hsm.settings.stateMinWidth;
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
    const myState = new Cstate(this, stateOptions, "S");
    // console.log(`[Cregion.insertState] New state id:${ myState?.id; } `);
    this.children.push(myState);
    modeRef.value = "";
    setDragOffset([U.mmToPx(w), U.mmToPx(h)]);
    const newIdz = { id: myState.id, zone: "BR", x: 0, y: 0 };
    // console.log(`[Cregion.insertState] newIdz:${JSON.stringify(newIdz)} `);
    hCtx.setIdz(newIdz);
    await myState.dragStart(xS, yS); // Will create dragCtx
  }

  canInsertState(idz) {
    const m = hsm.settings.minDistanceMm;
    const h = hsm.settings.stateMinHeight;
    const w = hsm.settings.stateMinWidth;
    const [x0, y0] = [idz.x, idz.y];
    // console.log(`[Cregion.canInsertState](${this.id}) idz.y:${idz.y.toFixed()} x0:${x0.toFixed()} y0:${y0.toFixed()}`);
    if (x0 < m || x0 >= this.geo.width - m - w) return false;
    if (y0 < m || y0 >= this.geo.height - m - h) return false;
    for (let child of this.children) {
      let geo = { x0: idz.x, y0: idz.y, width: w, height: h };
      // console.log(`[Cregion.canInsertState](${ this.id }) gCId:${ child.id; } `);
      if (U.rectsIntersect(child.geo, geo)) return false;
    }
    return true;
  }

  async dragStart(xS, yS) {
    console.log(`[Cregion.dragStart]`);
    const idz = this.idz();
    // const [x, y] = [idz.x, idz.y];
    // const [x, y] = [U.pxToMm(xS), U.pxToMm(yS)];
    const [x, y] = [idz.x, idz.y];
    console.log(`[Cregion.dragStart] xS:${xS?.toFixed()} x:${x.toFixed()} `);
    switch (modeRef.value) {
      case "inserting-state": {
        this.insertState(xS, yS);
        return;
      }
      case "inserting-note": {
        await this.insertNote(x, y);
        return;
      }
      default:
        modeRef.value = "";
    }
    hCtx.setDragCtx({ id: this.id, x0: this.geo.x0, y0: this.geo.y0, type: "M", mat: this.geo.mat });
    // console.log(`[Cregion.dragStart] dragCtx:${JSON.stringify(hCtx.getDragCtx())}`);
    // console.log(`[Cregion.dragStart] matrix:${getComputedStyle(this.myElem).transform} `);
  }

  drag(dxS, dyS) {
    // dxS, dyS are in screen (pixel) space
    const g = this.geo;
    const d = hCtx.getDragCtx();
    const mat = {};
    Object.assign(mat, this.geo.mat);
    mat.e = d.mat.e + dxS;
    mat.f = d.mat.f + dyS;
    // console.log(`[Cregion.drag] mat1:${JSON.stringify(mat)}`);
    this.setMat(mat);
  }

  dragEnd(dxS, dyS) {
    this.drag(dxS, dyS);
  }


  makeIdz(x, y, idz) {
    // [x,y] in mm of mousePos in this.geo.[x0,y0] frame
    const bak = Object.assign({}, idz);
    const m = U.pxToMm(hsm.settings.cursorMarginP);
    // console.log(`[Cregion.makeIdz] (${this.id} (${this.parent.id})) x:${x.toFixed()}  y:${y.toFixed()} x0:${this.geo.x0}`);
    if (
      x < - m ||
      x > this.geo.width + m ||
      y < - m ||
      y > this.geo.height + m
    ) {
      // console.log(`[Cregion.makeIdz] (${this.id} (${this.parent.id})) returning`);
      return idz;
    }
    if (modeRef.value == "inserting-state") {
      // console.log(`[Cregion.makeIdz] 1 (${this.id} (${this.parent.id})) x:${x.toFixed()}  y:${y.toFixed()} x0:${this.geo.x0}`);
      idz = { id: this.id, zone: "M", x: x, y: y };
    }
    for (let child of this.children) {
      // console.log(`[Cregion.makeIdz](${this.id}) calling ${child.id}`);
      idz = child.makeIdzInParentCoordinates(x, y, idz);
    }
    return idz;
  }

  makeIdzInParentCoordinates(xp, yp, myIdz) {
    [xp, yp] = [xp * U.pxPerMm, yp * U.pxPerMm];
    let [x, y] = applyToPoint(this.geo.matR, [xp, yp]);
    [x, y] = [x / U.pxPerMm, y / U.pxPerMm];
    // console.log(`[Cregion.makeIdzInParentCoordinates](${this.id} (${this.parent.id})) yp:${yp.toFixed()} y:${y.toFixed()} f:${this.geo.mat.f.toFixed()}`);
    const idz = this.makeIdz(x, y, myIdz);
    return idz;
  }
}

export class CExternalRegion extends CbaseRegion {
  constructor(parent, options) {
    super(parent, options, "E");
  }
}

export class Cregion extends CregionWithStates {
  constructor(parent, options) {
    super(parent, options, "R");
  }


}
