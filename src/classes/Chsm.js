"use strict";

import * as V from "vue";
import * as U from "src/lib/utils";
import { fText } from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { ChElems } from "src/classes/ChElems";
import { ChCtx } from "src/classes/ChCtx";
import { Cfolio } from "src/classes/Cfolio";
import { setDoubleClickTimeout, mousePos } from "src/lib/rootElemListeners";
import { applyToPoint } from 'transformation-matrix';
import { setCursor } from "src/lib/cursor";

export let hsm = null;
export let cCtx = null; // canvas context
export let hCtx = null; // hsm context
export let hElems = null;
export let modeRef = V.ref(""); // "inserting-state", "inserting-trans"...

// export let cursor = V.ref("default");
export let ctxMenu = V.ref(null);

export class Chsm extends CbaseElem {
  constructor(parent, options) {
    super(null, options, "M");
    this.settings = {};
    this.sernum = 2;
    this.hElems = new ChElems();
    this.hCtx = new ChCtx();
    hCtx = this.hCtx;
    this.canvas = options.canvas; // TODO
    this.setCanvas(this.canvas);
    hsm = this;
    this.inhibitDrag = false;
    hElems = this.hElems;
    // console.log(`[Chsm.constructor]  myElem:${this.myElem} [xx0:${this.geo.xx0.toFixed(2)}, yy0:${this.geo.yy0.toFixed(2)}]`);
  }


  destroy() {
    super.destroy();
    delete this.activeFolio;
    hCtx.folio = null;
    this.canvas = null;
    hsm = null;
  }

  checkSernum(num) {
    if (this.sernum <= num) this.sernum = num + 1;
  }

  newSernum() {
    return this.sernum++;
  }

  setCanvas(myCanvas) { // TODO
    this.canvas = myCanvas;
    cCtx = this.canvas.getContext("2d");
  }

  addFolio(folioOptions) {
    const foEl = document.createElement("div");
    this.childElem.append(foEl);
    folioOptions.myElem = foEl;
    // console.log(`[Chsm.addFolio]`);
    const myFolio = new Cfolio(this, folioOptions);
    this.children.push(myFolio);
  }

  load(hsmOptions) {
    this.hCtx.clear();
    this.settings = hsmOptions.settings;
    this.status = hsmOptions.status;
    this.serNum = hsmOptions.serNum;
    this.hElems.clearElems();
    this.hElems.insertElem(this);

    setDoubleClickTimeout(hsmOptions.settings.doubleClickTimeoutMs);
    for (let folioOptions of hsmOptions.folios) {
      this.addFolio(folioOptions);
    }
    hCtx.folio = this.hElems.getElemById(this.status.activeFolio);
    hCtx.folio.setFolioDisplay(true);
    // console.log(`[Chsm.load] id:${this.status.activeFolio} Active folio: ${folio?.id}`);
    hCtx.folio.onLoaded();
    this.makeIdzP();
    return null;
  }

  save() { }

  adjustTrAnchors(changedId) {
    // console.log(`[CbaseElem.adjustTrAnchors] id:${this.id} TODO`);
    hCtx.folio.adjustTrAnchors(changedId);
  }

  clearSelections() {
    // console.log(`[Chsm.clearSelections]`);
    hCtx.setSelectedId(null);
    hCtx.folio.setSelected(null);
  }

  setSelected(id) {
    if (hCtx.getSelectedId()) this.clearSelections();
    const newElem = this.hElems.getElemById(id);
    newElem.setSelected(true);
    hCtx.setSelectedId(newElem.id);
  }

  handleClick(xDown, yDown) {
    // console.log(`[Chsm.click] (xDown:${xDown}, yDown:${yDown})`);
    let idz = this.makeIdzP(xDown, yDown);
    hCtx.setIdz(idz);
    if (idz.id == this.id) {
      this.clearSelections();
      return;
    }
    const newElem = this.hElems.getElemById(idz.id);
    let oldElem = null;
    if (hCtx.getSelectedId()) oldElem = U.getElemById(hCtx.getSelectedId());
    // console.log(`[Chsm.click] newElem:${newElem?.id} SelectedId:${hCtx.getSelectedId()}`);
    // console.log(`[Chsm.click] got click on:${newElem?.id} SelectedId:${hCtx.getSelectedId()} oldElem:${oldElem}`);
    if (oldElem) {
      this.clearSelections();
    }
    else {
      newElem.setSelected(true);
      hCtx.setSelectedId(newElem.id);
    }
    idz = this.makeIdzP(xDown, yDown);
  }

  handleDoubleClick(xDown, yDown, rawMouseX, rawMouseY) {
    let idz = this.makeIdzP(xDown, yDown);
    hCtx.setIdz(idz);
    if (idz.id == this.id) return;
    const elem = this.hElems.getElemById(idz.id);
    elem?.openDialog();
  }

  dragStart(xP, yP) {
    // console.log(`[Chsm.click]  (xDown:${xP}, yDown:${xP})`);
    let idz = this.makeIdzP(xP, yP);
    // console.log(`[Chsm.dragStart] idz:${JSON.stringify(idz)}`);
    hCtx.setIdz(idz);
    // if (idz.id == this.id) return;
    const elem = this.hElems.getElemById(idz.id);
    // console.log(`[Chsm.dragStart] elem:${elem?.id} Mode:'${modeRef.value}'`);
    const mode = modeRef.value;
    switch (mode) {
      case "":
        // folio is responsible when dragging background
        if (idz.id == this.id) return hCtx.folio.dragStart(xP, yP);
        else return elem.dragStart(xP, yP);
      // break;
      case "inserting-state":
        if (elem.canInsertState(idz)) return elem.dragStart(xP, yP);
        break;
      case "inserting-trans":
        if (elem.canInsertTr(idz)) return elem.dragStart(xP, yP);
        break;
      case "inserting-note":
        if (elem.canInsertNote(idz)) return elem.dragStart(xP, yP);
        break;
    }
    this.inhibitDrag = true;
  }

  drag(dxP, dyP) {
    if (modeRef.value != "") return;
    if (this.inhibitDrag) return;
    const dragCtx = hCtx.getDragCtx();
    if (!dragCtx) return;
    // console.log(`[Chsm.drag] dragCtx:${JSON.stringify(dragCtx)}`);
    // if (dragCtx.id == this.id) return;
    if (dragCtx.id == this.id) hCtx.folio.drag(dxP, dyP);
    else {
      const elem = this.hElems.getElemById(dragCtx.id);
      elem.drag(dxP, dyP);
    }
    // console.log(`[Chsm.drag] dragCtx:${dragCtx} id:${dragCtx?.id} idz:${this.idz()} zone:${this.idz().zone}`);
  }

  dragEnd(dxP, dyP) {
    if (this.inhibitDrag) {
      this.inhibitDrag = false;
      const idz = this.makeIdzP(mousePos.value.xP, mousePos.value.yP);
      hCtx.setIdz(idz);
      return;
    }
    const [dx, dy] = [dxP * U.getScale(), dyP * U.getScale()];
    // console.warn(`[Chsm.dragEnd] id:${this.id} idz.id:${idz.id}`);
    // if (modeRef.value != "") {
    //   modeRef.value = "";
    //   return;
    // }
    const dragCtx = hCtx.getDragCtx();
    if (!dragCtx) return;
    if (dragCtx.id == this.id) hCtx.folio.dragEnd(dxP, dyP);
    else {
      const elem = this.hElems.getElemById(dragCtx.id);
      if (!elem) console.warn(`[Chsm.dragEnd] id:${this.id} dragCtx.id:${dragCtx.id}`);
      const dragEnded = elem.dragEnd(dxP, dyP);
      if (dragEnded) hCtx.dragEnd();
      // else elem.resetDrag() will reset it
    }
  }

  mouseMove(xL, yL) {
    // console.log(`[Chsm.mouseMove] xL:${xL.toFixed()} yL:${yL.toFixed()}`);
    const idz = this.makeIdzP(xL, yL);
    hCtx.setIdz(idz);
  }

  draw() {
    // if (!hCtx.folio) return;
    // // console.log(`[Chsm.draw] this.geo.xx0:${this.geo.xx0}`);
    // const dCtx = {
    //   xx0: this.geo.xx0,
    //   yy0: this.geo.yy0,
    // };
    // hCtx.folio.draw(dCtx);
  }

  wheelP(xP, yP, dyP) {
    hCtx.folio.wheelP(xP, yP, dyP);
  }

  pxToMm(xP, yP) {
    let [x, y] = applyToPoint(this.geo.matR, [xP, yP]);
    [x, y] = [x / U.pxPerMm, y / U.pxPerMm];
    return [x, y];
  }

  makeIdz(x, y, idz = { id: this.id, zone: "M", x: x, y: y }) {
    // console.warn(`[Chsm.makeIdz] id:${idz.id} (x:${x.toFixed(2)}, y:${y.toFixed(2)}) zone:${idz.zone} draggedId:${hCtx.getDraggedId()}`);
    idz = hCtx.folio.makeIdzInParentCoordinates(x, y, idz); // We are identity
    setCursor(idz);
    return idz;
  }

  makeIdzP(xP = mousePos.xP, yP = mousePos.yP) {
    const [xa, ya] = applyToPoint(this.geo.matR, [xP, yP]);
    const [x, y] = [xa / U.pxPerMm, ya / U.pxPerMm];
    let myIdz = { id: this.id, zone: "M", x: x, y: y };
    let idz = this.makeIdz(x, y, myIdz);
    fText.value = `${idz.id} "${idz.zone}" (x:${x.toFixed()}, y${y.toFixed()}) (xz:${idz.x.toFixed()}, yz:${idz.y.toFixed()})`;
    // fText.value = `${idz.id} "${idz.zone}" (xz:${idz.x.toFixed()}, yz:${idz.y.toFixed()})`;
    // console.log(`[Chsm.makeIdz] matR:${JSON.stringify(this.hCtx.folio.geo.mat)}`);
    return idz;
  }
}

