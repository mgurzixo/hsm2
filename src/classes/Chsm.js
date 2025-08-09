"use strict";

import * as V from "vue";
import * as U from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { ChElems } from "src/classes/ChElems";
import { ChCtx } from "src/classes/ChCtx";
import { Cfolio } from "src/classes/Cfolio";
import { setDoubleClickTimeout, mousePos } from "src/lib/canvasListeners";

export let hsm = null;
export let cCtx = null; // canvas context
export let hCtx = null; // hsm context
export let hElems = null;
export let modeRef = V.ref(""); // "inserting-state", "inserting-trans"...

export let cursor = V.ref("default");
export let ctxMenu = V.ref(null);

export class Chsm extends CbaseElem {
  constructor(parent, options) {
    super(parent, options, "M");
    this.settings = {};
    this.sernum = 2;
    this.hElems = new ChElems();
    this.hCtx = new ChCtx();
    hCtx = this.hCtx;
    this.canvas = options.canvas;
    this.setCanvas(this.canvas);
    hsm = this;
    hElems = this.hElems;
    this.parentElem = options.parentElem,
      console.log(`[Chsm.constructor] parentElem:${this.parentElem}`);
    this.myElem = document.createElement("div");
    this.parentElem.append(this.myElem);
    this.myElem.id = this.id;
  }

  checkSernum(num) {
    if (this.sernum <= num) this.sernum = num + 1;
  }

  newSernum() {
    return this.sernum++;
  }

  setCanvas(myCanvas) {
    this.destroyResizeObserver();
    this.canvas = myCanvas;
    cCtx = this.canvas.getContext("2d");
    const bindedAdjustSizes = this.adjustSizes.bind(this);
    this.resizeObserver = new ResizeObserver(bindedAdjustSizes);
    this.resizeObserver.observe(this.canvas.parentElement);
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
    folioOptions.parentElem = this.myElem;
    const myFolio = new Cfolio(this, folioOptions);
    this.children.push(myFolio);
    await myFolio.load(folioOptions);
  }

  async load(hsmOptions) {
    this.settings = hsmOptions.settings;
    this.status = hsmOptions.status;
    this.serNum = hsmOptions.serNum;
    this.hElems.clearElems();
    this.hElems.insertElem(this);
    setDoubleClickTimeout(hsmOptions.settings.doubleClickTimeoutMs);
    for (let folioOptions of hsmOptions.folios) {
      await this.addFolio(folioOptions);
    }
    hCtx.folio = this.hElems.getElemById(this.status.activeFolio);
    // console.log(`[Chsm.load] id:${this.status.activeFolio} Active folio: ${folio?.id}`);
    this.makeIdz(this.idz.x, this.idz.y);
    await hCtx.folio.onLoaded();
    this.draw();
    return null;
  }

  destroyResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      delete this.resizeObserver;
    }
  }

  destroy() {
    super.destroy();
    delete this.activeFolio;
    hCtx.folio = null;
    this.destroyResizeObserver();
    this.canvas = null;
    hsm = null;
  }

  save() { }

  draw() {
    if (!hCtx.folio) return;
    hCtx.folio.draw();
    // console.log(`[Chsm.draw] SelectedId:${hCtx.getSelectedId()}`);
  }

  oldDraw() {
    // if (!cCtx) return;
    // // console.log(`[Chsm.draw] Drawing ${this.id}`);
    // // Clear canvas
    // cCtx.fillStyle = "#ccc";
    // cCtx.beginPath();
    // cCtx.rect(0, 0, this.canvas.width, this.canvas.height);
    // cCtx.fill();
    // if (!hCtx.folio) return;
    // hCtx.folio.draw();
    // // console.log(`[Chsm.draw] SelectedId:${hCtx.getSelectedId()}`);
  }

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
    let idz = this.makeIdz(xDown, yDown);
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
    idz = this.makeIdz(xDown, yDown);
    this.draw();
    this.setCursor();
  }

  handleDoubleClick(xDown, yDown, rawMouseX, rawMouseY) {
    let idz = this.makeIdz(xDown, yDown);
    hCtx.setIdz(idz);
    if (idz.id == this.id) return;
    const elem = this.hElems.getElemById(idz.id);
    elem?.openDialog();
  }

  async dragStart(xDown, yDown) {
    // console.log(`[Chsm.dragStart] Making idz`);
    const idz = this.makeIdz(xDown, yDown);
    // console.log(`[Chsm.dragStart] idz:${JSON.stringify(idz)}`);
    hCtx.setIdz(idz);
    if (idz.id == this.id) return;
    const elem = this.hElems.getElemById(idz.id);
    // console.log(`[Chsm.dragStart] elem:${elem?.id} Mode:'${modeRef.value}'`);
    const mode = modeRef.value;
    switch (mode) {
      case "":
        await elem.dragStart();
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

  drag(dx, dy) {
    if (modeRef.value != "") return;
    const dragCtx = hCtx.getDragCtx();
    if (!dragCtx) return;
    // console.log(`[Chsm.drag] dragCtx:${JSON.stringify(dragCtx)}`);
    if (dragCtx.id == this.id) return;
    const elem = this.hElems.getElemById(dragCtx.id);
    elem.drag(dx, dy);
    this.draw();
    // console.log(`[Chsm.drag] dragCtx:${dragCtx} id:${dragCtx?.id} idz:${this.idz()} zone:${this.idz().zone}`);
    this.setCursor();
  }

  dragEnd(dx, dy) {
    const idz = this.idz();
    // console.warn(`[Chsm.dragEnd] id:${this.id} idz.id:${idz.id}`);
    if (modeRef.value != "") {
      modeRef.value = "";
      this.draw();
      this.setCursor();
      return;
    }
    if (idz.id == this.id) return;
    const elem = this.hElems.getElemById(idz.id);
    const dragEnded = elem.dragEnd(dx, dy);
    if (dragEnded) hCtx.dragEnd();
    // else elem.resetDrag() will reset it
    this.draw();
    this.setCursor();
  }

  mouseMove(x, y) {
    const idz = hsm.makeIdz();
    hCtx.setIdz(idz);
    this.setCursor();
  }

  adjustSizes() {
    const cpe = this.canvas.parentElement;
    const bb = cpe.getBoundingClientRect();
    // console.log(`[Chsm.adjustSizes] bb.left:${bb.left.toFixed()} bb.top:${bb.top.toFixed()}`);
    this.canvas.x0 = bb.left;
    this.canvas.y0 = bb.top;
    this.canvas.width = bb.width;
    this.canvas.height = bb.height;
    this.draw();
  }

  wheelP(xP, yP, dyP) {
    hCtx.folio.wheelP(xP, yP, dyP);
  }

  makeIdz(x = mousePos.value.x, y = mousePos.value.y, idz = { id: hsm.id, zone: "", x: 0, y: 0 }) {
    idz = hCtx.folio?.makeIdz(x, y, idz);
    // console.log(`[Chsm.makeIdz] id:${idz.id} zone:${idz.zone} draggedId:${hCtx.getDraggedId()}`);
    return idz;
  }
}
