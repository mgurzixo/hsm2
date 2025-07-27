"use strict";

import * as V from "vue";
import * as U from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { ChElems } from "src/classes/ChElems";
import { ChCtx } from "src/classes/ChCtx";
import { Cfolio } from "src/classes/Cfolio";
import { setDoubleClickTimeout } from "src/lib/canvasListeners";

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
    this.sernum = 1;
    this.hElems = new ChElems();
    this.hCtx = new ChCtx();
    hCtx = this.hCtx;
    this.canvas = options.canvas;
    this.setCanvas(this.canvas);
    hsm = this;
    hElems = this.hElems;
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
    const elem = this.hElems.getElemById(idz.id);
    let val = elem.defineCursor(idz);
    // console.log(`[Chsm.setCursor] cursor:${val}`);
    cursor.value = val;
  }

  addFolio(folioOptions) {
    const myFolio = new Cfolio(this, folioOptions);
    this.hElems.insertElem(myFolio);
    this.children.push(myFolio);
    myFolio.load(folioOptions);
  }

  load(hsmOptions) {
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
    // console.log(`[Chsm.load] id:${this.status.activeFolio} Active folio: ${folio?.id}`);
    this.makeIdz(this.idz.x, this.idz.y);
    hCtx.folio.onLoaded();
    this.draw();
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
    if (!cCtx) return;
    // console.log(`[Chsm.draw] Drawing ${this.id}`);
    // Clear canvas
    cCtx.fillStyle = "#ccc";
    cCtx.beginPath();
    cCtx.rect(0, 0, this.canvas.width, this.canvas.height);
    cCtx.fill();
    if (!hCtx.folio) return;
    hCtx.folio.draw();
  }

  click(xDown, yDown) {
    let idz = this.makeIdz(xDown, yDown);
    hCtx.setIdz(idz);
    if (idz.id == this.id) return;
    const elem = this.hElems.getElemById(idz.id);
    console.log(`[Chsm.click] elem:${elem?.id}`);
    if (hCtx.getSelectedId()) {
      this.setSelected(false);
      hCtx.setSelectedId(null);
    } else {
      this.setSelected(false);
      elem.setSelected(true);
      hCtx.setSelectedId(elem.id);
    }
    for (let tr of hCtx.folio.trs) {
      if (hElems.getElemById(tr.from.id).isSelected && hElems.getElemById(tr.to.id).isSelected) tr.setSelected(true);
      else tr.setSelected(false);
    }
    idz = this.makeIdz(xDown, yDown);
    hCtx.folio.draw();
    this.setCursor();
  }

  handleDoubleClick(xDown, yDown, rawMouseX, rawMouseY) {
    let idz = this.makeIdz(xDown, yDown);
    hCtx.setIdz(idz);
    if (idz.id == this.id) return;
    const elem = this.hElems.getElemById(idz.id);
    this.openDialog(elem);
    // console.log(`[Chsm.doubleClick] elem:${elem?.id}`);
    // this.setSelected(false);
    // if (hCtx.getSelectedId() != elem.id) {
    //   elem.setSelected(true);
    //   hCtx.setSelectedId(elem.id);
    // }
    // else hCtx.setSelectedId(null);
    // for (let tr of hCtx.folio.trs) {
    //   if (hElems.getElemById(tr.from.id).isSelected && hElems.getElemById(tr.to.id).isSelected) tr.setSelected(true);
    //   else tr.setSelected(false);
    // }
    // idz = this.makeIdz(xDown, yDown);
    // hCtx.folio.draw();
    // this.setCursor();
  }

  dragStart(xDown, yDown) {
    const idz = this.makeIdz(xDown, yDown);
    hCtx.setIdz(idz);
    if (idz.id == this.id) return;
    const elem = this.hElems.getElemById(idz.id);
    // console.log(`[Chsm.dragStart] elem:${elem?.id} Mode:'${modeRef.value}'`);
    const mode = modeRef.value;
    switch (mode) {
      case "":
        elem.dragStart();
        break;
      case "inserting-state":
        if (elem.canInsertState(idz)) elem.dragStart();
        break;
      case "inserting-trans":
        if (elem.canInsertTr(idz)) elem.dragStart();
        break;
    }
  }

  drag(dx, dy) {
    if (modeRef.value != "") return;
    const dragCtx = hCtx.getDragCtx();
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
    const idz = hsm.makeIdz(x, y);
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

  makeIdz(x, y, idz = { id: hsm.id, zone: "", x: 0, y: 0 }) {
    idz = hCtx.folio?.makeIdz(x, y, idz);
    // console.log(`[Chsm.makeIdz] id:${idz.id} zone:${idz.zone} draggedId:${hCtx.getDraggedId()}`);
    return idz;
  }
}
