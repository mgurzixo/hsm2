"use strict";

import * as U from "src/lib/utils";
import * as V from "vue";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { CregionWithStates } from "src/classes/Cregion";
import { Cstate } from "src/classes/Cstate";
import { Ctr } from "src/classes/Ctr";
import { setDragOffset } from "src/lib/rootElemListeners";
import { fromString, applyToPoint, inverse, toCSS, compose } from 'transformation-matrix';
import FolioDialog from "src/components/FolioDialog.vue";

let noteTo;

function deferredNotesUpdate() {
  if (noteTo) clearTimeout(noteTo);
  noteTo = setTimeout(async () => {
    await hCtx.folio.updateNotes();
  }, 100);
}

export class Cfolio extends CregionWithStates {
  constructor(parent, folioOptions) {
    super(parent, folioOptions, "F");
    this.trs = [];
    // this.myElem.innerHTML = "<h1>HelloWorldHelloWorldHelloWorld</h1>";
    this.myElem.style.overflow = `hidden`;
    // console.log(`[Cfolio.constructor] myElem:${this.myElem}`);
    this.setFolioDisplay(false);
    // Set initial values
    const s = this.myElem.style;
    const g = this.geo;
    this.setGeometry();
    for (let trOptions of folioOptions.trs) {
      this.addTr(trOptions); // BEWARE async
    }
  }

  setFolioDisplay(isActive) {
    if (isActive) this.myElem.style.display = "block";
    else this.myElem.style.display = "none";
  }

  setMat(mat) {
    this.geo.mat = mat;
    const matR = inverse(mat);
    this.geo.matR = matR;
    this.myElem.style.transform = toCSS(this.geo.mat);
    // console.log(`[Cfolio.setMat] (${this.id}) geo:${this.geo} mat:${JSON.stringify(mat)}`);
  }

  setGeometry() {
    // console.log(`[Cfolio.setGeometry]`);
    const s = this.myElem.style;
    const g = this.geo;
    s.top = "0px";
    s.left = "0px";
    s.width = g.width + "mm";
    s.height = g.height + "mm";
    s.background = hsm.settings.styles.folioBackground;
  }

  async wheelP(xS, yS, dyS) {
    const deltas = -dyS / hsm.settings.deltaMouseWheel;
    const g = this.geo;
    const mat0 = fromString(getComputedStyle(this.myElem).transform);
    const s0 = mat0.a;
    let s1 = s0 + deltas * hsm.settings.deltaScale;
    if (s1 >= 1.5) s1 += deltas * hsm.settings.deltaScale;
    s1 = Math.min(Math.max(0.1, s1), 5);
    const k = s1 / s0;
    // Compute the new translation to keep (xS, yS) fixed in screen coords
    // const t = this.prevTransform;
    // The translation part of a homothetic transform at (xP, yP):
    // [s1 0 0 s1 tx ty] where
    // tx = (1 - k) * xP + k * t.xT
    // ty = (1 - k) * yP + k * t.yT
    const matW = { a: k, b: 0, c: 0, d: k, e: xS * (1 - k), f: yS * (1 - k) };
    // console.log(`[Cfolio.wheelP] k:${k} xS:${xS} dxP:${dxP}`);
    const mat1 = compose(matW, mat0);
    this.geo.scale = mat1.a;
    this.setMat(mat1);
  }

  async dragStart(xS, yS) {
    const idz = this.idz();
    const [x, y] = [idz.x, idz.y];
    // const [x, y] = [U.pxToMm(xS), U.pxToMm(yS)];
    console.log(`[Cfolio.dragStart] xS:${xS?.toFixed()} x:${x.toFixed()} `);
    switch (modeRef.value) {
      case "inserting-state": {
        this.insertState(x, y);
        return;
      }
      case "inserting-note": {
        await this.insertNote(x, y);
        return;
      }
      default:
        modeRef.value = "";
    }
    // console.log(`[Cfolio.dragStart] e:${mat.e}`);
    hCtx.setDragCtx({ id: this.id, x0: this.geo.x0, y0: this.geo.y0, type: "M", mat: this.geo.mat });
    // console.log(`[Cfolio.dragStart] matrix:${getComputedStyle(this.myElem).transform} `);
  }

  // drag(dxS, dyS) {
  //   // dxS, dyS are in screen (pixel) space
  //   const g = this.geo;
  //   const d = hCtx.getDragCtx();
  //   const mat = {};
  //   Object.assign(mat, this.geo.mat);
  //   mat.e = d.mat.e + dxS;
  //   mat.f = d.mat.f + dyS;
  //   // console.log(`[Cfolio.drag] mat1:${JSON.stringify(mat)}`);
  //   this.setMat(mat);
  // }

  // dragEnd(dxS, dyS) {
  //   this.drag(dxS, dyS);
  // }

  // setSelected(val) {
  //   // console.log(`[Chsm.setSelected](${ this.id }) } setSelected: ${ val; } `);
  //   super.setSelected(val);
  //   for (let note of this.notes) {
  //     note.setSelected(val);
  //   }
  // }

  // async addNote(noteOptions) {
  //   return; // ICI
  //   // console.log(`[Cfolio.addNote] noteOptions:${ JSON.stringify(noteOptions); } `);
  //   const myNote = new Cnote(this, noteOptions, "N");
  //   // await myNote.load(noteOptions);
  //   this.notes.push(myNote);
  //   // console.log(`[Cfolio.addNote] id:${ myNote.id; } `);
  //   return myNote;
  // }

  async addTr(trOptions) {
    const myTr = new Ctr(this, trOptions, "T");
    this.trs.push(myTr);
    // await myTr.load(trOptions);
    return myTr;
  }

  async onLoaded() {
    // console.log(`[Cfolio.onLoaded] xx0:${this.geo.xx0}`);
    this.isDirty = true;
    for (let child of this.children) {
      await child.onLoaded();
    }
    return; // ICI
    for (let tr of this.trs) {
      await tr.onLoaded();
    }
    for (let note of this.notes) {
      await note.onLoaded();
    }
  }

  async insertNote(x, y) {
    console.log(`[Cfolio.dragStartP] Inserting note x:${x.toFixed()}`);
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
    const m = U.pToMmL(hsm.settings.cursorMarginP);
    const newIdz = myNote.makeIdz(x - this.geo.x0 - m, y - this.geo.y0 - m, this.idz());
    hCtx.setIdz(newIdz);
    await myNote.dragStart(); // Will create dragCtx
  }

  adjustTrAnchors(changedId) {
    for (let child of this.children) {
      child.adjustTrAnchors(changedId);
    }
    for (let tr of this.trs) {
      tr.adjustTrAnchors(changedId);
    }
  }

  updateNotes() {
    // console.log(`[Cfolio.updateNotes]`);
    for (let note of hCtx.folio.notes) {
      note.deleteCanvas();
    }
    for (let child of hCtx.folio.children) {
      child.updateNotes();
    }
    for (let tr of hCtx.folio.trs) {
      tr.updateNotes();
    }
  }

  // canInsertState(idz) {
  //   // console.log(`[Cfolio.canInsertState](${ this.id }) idz.x:${ idz.x; } `);
  //   const m = hsm.settings.minDistanceMm;
  //   const h = hsm.settings.stateMinHeight + m;
  //   const w = hsm.settings.stateMinWidth + m;
  //   const [x0, y0] = [idz.x - this.geo.x0, idz.y - this.geo.y0];
  //   if (x0 < w || x0 >= this.geo.width - m) return false;
  //   if (y0 < h || y0 >= this.geo.height - m) return false;
  //   for (let child of this.children) {
  //     let geo = { x0: idz.x - w, y0: idz.y - this.geo.y0 - h, width: w, height: h };
  //     // console.log(`[Cfolio.canInsertState](${ this.id }) gCId:${ child.id; } `);
  //     if (U.rectsIntersect(child.geo, geo)) return false;
  //   }
  //   return true;
  // }

  canInsertNote(idz) {
    if (idz.zone != "M") return false;
    const m = hsm.settings.minDistanceMm;
    const h = hsm.settings.noteMinHeight + m;
    const w = hsm.settings.noteMinWidth + m;
    const t = hsm.settings.stateTitleHeightMm;
    // console.log(`[Cfolio.canInsertNote](${ this.id }) idz.y:${ idz.y; } `);
    const [x0, y0] = [idz.x - this.geo.x0, idz.y - this.geo.y0];
    if (x0 < m || x0 >= this.geo.width - w - m) return false;
    if (y0 < t + m || y0 >= this.geo.height - h - m) return false;
    return true;
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm in this.geo.[x0,y0] frame
    // console.log(`[Cfolio.makeIdz][x: ${x.toFixed()}, y: ${y.toFixed()}]`);
    const g = this.geo;
    if (x < 0 || y < 0) return idz;
    if (x > g.width || y > g.height) return idz;
    idz = { id: this.id, zone: "M", x: x, y: y };
    // TODO
    // for (let note of this.notes) {
    //   idz = note.makeIdz(x - this.geo.x0, y - this.geo.y0, idz);
    // }

    // // console.log(`[Cfolio.makeIdz] S id: ${ idz.id; } zone: ${ idz.zone; } `);
    // let bestTIdz = { dist2P: Number.MAX_VALUE };
    // for (let tr of this.trs) {
    //   const tIdz = tr.makeIdz(x, y, idz);
    //   if (tIdz.dist2P <= bestTIdz.dist2P) bestTIdz = tIdz;
    //   // if (tr.id == "T9") console.log(`[Cfolio.makeIdz](${ tIdz.id }) dist2P: ${ tIdz.dist2P.toFixed(); } zone: ${ tIdz.zone; } type: ${ tIdz.type; } `);
    // }
    // if (bestTIdz.dist2P < hsm.settings.cursorMarginP) {
    //   idz = bestTIdz;
    // }
    // console.log(`[Cfolio.makeIdz] T id: ${ bestTIdz.id; } dist2P: ${ bestTIdz.dist2P.toFixed(); } zone: ${ bestTIdz.zone; } type: ${ bestTIdz.type; } `);
    for (let child of this.children) {
      // console.warn(`[Cregion.Cfolio](${this.id}) calling ${child.id}`);
      idz = child.makeIdzInParentCoordinates(idz.x, idz.y, idz);
    }
    return idz;
  }

  makeIdzInParentCoordinates(xp, yp, myIdz) {
    [xp, yp] = [xp * U.pxPerMm, yp * U.pxPerMm];
    let [x, y] = applyToPoint(this.geo.matR, [xp, yp]);
    [x, y] = [x / U.pxPerMm, y / U.pxPerMm];
    const idz = this.makeIdz(x, y, myIdz);
    return idz;
  }

  openDialog() {
    hsm.openDialog(FolioDialog, this);
  }
}
