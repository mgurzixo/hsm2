"use strict";

import * as V from "vue";
import * as U from "src/lib/utils";
import { fText } from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { ChElems } from "src/classes/ChElems";
import { ChCtx } from "src/classes/ChCtx";
import { Cfolio } from "src/classes/Cfolio";
import { setDoubleClickTimeout, mousePos } from "src/lib/rootElemListeners";
import { applyToPoint, fromString, decomposeTSR, inverse } from 'transformation-matrix';

export let hsm = null;
export let cCtx = null; // canvas context
export let hCtx = null; // hsm context
export let hElems = null;
export let modeRef = V.ref(""); // "inserting-state", "inserting-trans"...

export let cursor = V.ref("default");
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
    hElems = this.hElems;
    this.geo.xx0 = 0;
    this.geo.yy0 = 0;
    // console.log(`[Chsm.constructor] myElem:${this.myElem} [xx0:${this.geo.xx0.toFixed(2)}, yy0:${this.geo.yy0.toFixed(2)}]`);
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

  setCursor(idz = this.idz()) {
    // console.log(`[Chsm.setCursor] idz.id:${idz?.id}`);
    const elem = this.hElems.getElemById(idz.id);
    if (elem) {
      let val = elem.defineCursor(idz);
      // console.log(`[Chsm.setCursor] cursor:${val}`);
      cursor.value = val;
    }
  }

  async addFolio(folioOptions) {
    const folioElem = document.createElement("div");
    this.myElem.append(folioElem);
    folioOptions.elem = folioElem;
    const myFolio = new Cfolio(this, folioOptions);
    this.children.push(myFolio);
    await myFolio.load(folioOptions);
  }

  async load(hsmOptions) {
    this.settings = hsmOptions.settings;
    this.status = hsmOptions.status;
    this.serNum = hsmOptions.serNum;
    this.hElems.clearElems();
    this.myElem.textContent = ""; // Clear screen
    this.hElems.insertElem(this);

    setDoubleClickTimeout(hsmOptions.settings.doubleClickTimeoutMs);
    for (let folioOptions of hsmOptions.folios) {
      await this.addFolio(folioOptions);
    }
    hCtx.folio = this.hElems.getElemById(this.status.activeFolio);
    // console.log(`[Chsm.load] id:${this.status.activeFolio} Active folio: ${folio?.id}`);
    this.makeIdz(this.idz().x, this.idz().y);
    await hCtx.folio.onLoaded();
    this.draw();
    return null;
  }


  destroy() { // TODO
    // super.destroy();
    // delete this.activeFolio;
    // hCtx.folio = null;
    // this.destroyResizeObserver();
    // this.canvas = null;
    // hsm = null;
  }

  save() { }

  async draw2() {
    this.draw();
    await V.nextTick();
    this.draw();
  }

  clearSelections() {
    hCtx.setSelectedId(null);
    hCtx.folio.setSelected(null);
  }

  click(xDown, yDown) {
    console.log(`[Chsm.click]  (xDown:${xDown}, yDown:${yDown})`);
    const [xP, yP] = [xDown * U.getScale(), yDown * U.getScale()];
    let idz = this.makeIdzP(xP, yP);
    hCtx.setIdz(idz);
    if (idz.id == this.id) return;
    const newElem = this.hElems.getElemById(idz.id);
    console.log(`[Chsm.click] got click on:${newElem?.id} SelectedId:${hCtx.getSelectedId()}`);
    let oldElem = null;
    if (hCtx.getSelectedId()) oldElem = U.getElemById(hCtx.getSelectedId());
    // console.log(`[Chsm.click] newElem:${newElem?.id} SelectedId:${hCtx.getSelectedId()}`);
    if (oldElem) {
      hCtx.setSelectedId(null);
      oldElem.setSelected(false);
    }
    else {
      hCtx.setSelectedId(newElem.id);
      newElem.setSelected(true);
    }
    idz = this.makeIdzP(xDown, yDown);
    this.draw();
    this.setCursor();
  }

  handleDoubleClick(xDown, yDown, rawMouseX, rawMouseY) {
    let idz = this.makeIdzP(xDown, yDown);
    hCtx.setIdz(idz);
    if (idz.id == this.id) return;
    const elem = this.hElems.getElemById(idz.id);
    elem?.openDialog();
  }

  async dragStart(xP, yP) {
    // console.log(`[Chsm.click]  (xDown:${xDown}, yDown:${yDown})`);
    // const [xP, yP] = [xDown * U.getScale(), yDown * U.getScale()];
    let idz = this.makeIdzP(xP, yP);
    console.log(`[Chsm.dragStart] idz:${JSON.stringify(idz)}`);
    hCtx.setIdz(idz);
    // if (idz.id == this.id) return;
    const elem = this.hElems.getElemById(idz.id);
    // console.log(`[Chsm.dragStart] elem:${elem?.id} Mode:'${modeRef.value}'`);
    const mode = modeRef.value;
    switch (mode) {
      case "":
        // folio is responsible when dragging background
        if (idz.id == this.id) await hCtx.folio.dragStart(xP, yP);
        else await elem.dragStart();
        break;
      case "inserting-state":
        if (elem.canInsertState(idz)) await elem.dragStart();
        break;
      case "inserting-trans":
        if (elem.canInsertTr(idz)) await elem.dragStart();
        break;
      case "inserting-note":
        if (elem.canInsertNote(idz)) await elem.dragStart();
        break;
    }
  }

  drag(dxS, dyS) {
    if (modeRef.value != "") return;
    const [dx, dy] = [dxS * U.getScale(), dyS * U.getScale()];
    // console.log(`[Chsm.drag]  (dx:${dx}, dy:${dy})`);
    const dragCtx = hCtx.getDragCtx();
    if (!dragCtx) return;
    // console.log(`[Chsm.drag] dragCtx:${JSON.stringify(dragCtx)}`);
    // if (dragCtx.id == this.id) return;
    if (dragCtx.id == this.id) hCtx.folio.drag(dxS, dyS);
    else {
      const elem = this.hElems.getElemById(dragCtx.id);
      elem.drag(dxS, dyS);
    }
    this.draw();
    // console.log(`[Chsm.drag] dragCtx:${dragCtx} id:${dragCtx?.id} idz:${this.idz()} zone:${this.idz().zone}`);
    this.setCursor();
  }

  dragEnd(dxS, dyS) {
    const [dx, dy] = [dxS * U.getScale(), dyS * U.getScale()];
    // console.warn(`[Chsm.dragEnd] id:${this.id} idz.id:${idz.id}`);
    if (modeRef.value != "") {
      modeRef.value = "";
      this.draw();
      this.setCursor();
      return;
    }
    const dragCtx = hCtx.getDragCtx();
    if (!dragCtx) return;
    if (dragCtx.id == this.id) hCtx.folio.dragEnd(dxS, dyS);
    else {
      const elem = this.hElems.getElemById(dragCtx.id);
      const dragEnded = elem.dragEnd(dx, dy);
      if (dragEnded) hCtx.dragEnd();
      // else elem.resetDrag() will reset it
    }
    this.draw();
    this.setCursor();
  }

  mouseMove(xL, yL) {
    // console.log(`[Chsm.mouseMove] xL:${xL.toFixed()} yL:${yL.toFixed()}`);
    const idz = this.makeIdzP(xL, yL);
    hCtx.setIdz(idz);
    this.setCursor();
  }

  draw() {
    if (!hCtx.folio) return;
    // console.log(`[Chsm.draw] this.geo.xx0:${this.geo.xx0}`);
    const dCtx = {
      xx0: this.geo.xx0,
      yy0: this.geo.yy0,
    };
    hCtx.folio.draw(dCtx);
  }

  wheelP(xS, yS, dyP) {
    hCtx.folio.wheelP(xS, yS, dyP);
  }

  makeIdz(x, y, idz = { id: this.id, zone: "M", x: x, y: y }) {
    idz = hCtx.folio?.makeIdz(x, y, idz);
    // console.warn(`[Chsm.makeIdz] id:${idz.id} (x:${x.toFixed(2)}, y:${y.toFixed(2)}) zone:${idz.zone} draggedId:${hCtx.getDraggedId()}`);
    return idz;
  }

  makeIdzP(xP, yP, myIdz) {
    const g = hCtx?.folio?.geo;
    const s = g.scale;
    const el = this.hCtx?.folio.myElem;
    const mat = fromString(getComputedStyle(el).transform);
    const matR = inverse(mat);
    const [x, y] = applyToPoint(mat, [xP / U.pxPerMm, yP / U.pxPerMm]);
    // const [x, y] = applyToPoint(mat, [xP, yP]);
    // console.log(`[Chsm.makeIdzP] (xP:${xP.toFixed(2)}, yP:${yP.toFixed(2)})=>(x:${x.toFixed(2)}, y:${yP.toFixed(2)})`);
    const TSR = decomposeTSR(mat);
    // console.log(`[Chsm.makeIdzP] TSR:${JSON.stringify(decomposeTSR(mat))}`);
    console.log(`[Chsm.makeIdzP] Mat:${JSON.stringify(mat)}`);
    const idz = this.makeIdz(x, y, myIdz);
    fText.value = `${idz.id} "${idz.zone}" (xP:${xP.toFixed(0)}, yP:${yP.toFixed(0)}) => (x:${idz.x.toFixed(0)}, y:${idz.y.toFixed(0)}) e*:${(mat.e / U.pxPerMm).toFixed()} TransX:${(TSR.translate.tx / U.pxPerMm).toFixed()} x0:${g.x0.toFixed()}`;
    return idz;
  }
}
