"use strict";

import * as V from "vue";
import * as U from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { ChElems } from "src/classes/ChElems";
import { ChCtx } from "src/classes/ChCtx";
import { Cfolio } from "src/classes/Cfolio";

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

  setCursor(idz) {
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
    for (let folioOptions of hsmOptions.folios) {
      this.addFolio(folioOptions);
    }
    hCtx.folio = this.hElems.getElemById(this.status.activeFolio);
    // console.log(`[Chsm.load] id:${this.status.activeFolio} Active folio: ${folio?.id}`);
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
    // console.log(`[Chsm.drag] dragCtx:${dragCtx} id:${dragCtx?.id} idz:${this.idz()}`);
    if (dragCtx.id == this.id) return;
    const elem = this.hElems.getElemById(dragCtx.id);
    elem.drag(dx, dy);
    this.draw();
    hsm.setCursor(this.idz());
  }

  dragEnd(dx, dy) {
    if (modeRef.value != "") return;
    const idz = this.idz();
    if (idz.id == this.id) return;
    const elem = this.hElems.getElemById(idz.id);
    const dragEnded = elem.dragEnd(dx, dy);
    if (dragEnded) hCtx.dragEnd();
    // else elem.resetDrag() will reset it
    this.draw();
    hsm.setCursor(this.idz());
  }

  mouseMove(x, y) {
    const idz = hsm.makeIdz(x, y);
    hCtx.setIdz(idz);
    hsm.setCursor(idz);
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
