"use strict";

import * as V from "vue";
import * as U from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { ChElems } from "src/classes/ChElems";
import { Cfolio } from "src/classes/Cfolio";
import { mousePos } from "src/lib/canvasListeners";

export let canvas = null;
export let ctx = null;
export let hsm = null;
export let folio = null;
export let cursor = V.ref("default");

export class Chsm extends CbaseElem {
  constructor(parent, options) {
    super(parent, options, "M");
    this.hElems = new ChElems();
    this.activeFolio = null;
    this.cCanvas = null;
    this.folioActive = null;
    this.settings = {};
    this.isDirty = false;
    hsm = this;
  }

  setCursor(val) {
    cursor.value = val;
  }

  setdirty() {
    this.isDirty = true;
  }

  addFolio(folioOptions) {
    const myFolio = new Cfolio(this, folioOptions);
    this.hElems.insert(myFolio);
    this.children.push(myFolio);
    myFolio.load(folioOptions);
  }

  load(hsmOptions) {
    this.settings = hsmOptions.settings;
    this.state = hsmOptions.state;
    this.hElems.clear();
    this.hElems.insert(this);
    for (let folioOptions of hsmOptions.folios) {
      this.addFolio(folioOptions);
    }
    folio = this.hElems.getById(this.state.activeFolio);
    // console.log(`[Chsm.load] id:${this.state.activeFolio} Active folio: ${folio?.id}`);
    this.setGeo00();
    this.draw();
  }

  destroy() {
    super.destroy();
    delete this.folioActive;
    folio = null;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      delete this.resizeObserver;
    }
    ctx = null;
    canvas = null;
    hsm = null;
  }

  save() {}

  setCanvas(myCanvas) {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    canvas = myCanvas;

    ctx = canvas.getContext("2d");
    const bindedAdjustSizes = this.adjustSizes.bind(this);
    this.resizeObserver = new ResizeObserver(bindedAdjustSizes);
    this.resizeObserver.observe(canvas.parentElement);
  }

  draw() {
    if (!ctx) return;
    // console.log(`[Chsm.draw] Drawing ${this.id}`);
    // Clear canvas
    ctx.fillStyle = "#ccc";
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();
    if (!folio) return;
    folio.draw();
  }

  adjustSizes() {
    const cpe = canvas.parentElement;
    const bb = cpe.getBoundingClientRect();
    // console.log(`[Chsm.adjustSizes] bb.left:${bb.left.toFixed()} bb.top:${bb.top.toFixed()}`);
    canvas.x0 = bb.left;
    canvas.y0 = bb.top;
    canvas.width = bb.width;
    canvas.height = bb.height;
    this.draw();
  }

  getIdAndZone(x, y, idz = { id: hsm.id, zone: "" }) {
    idz = folio?.getIdAndZone(x, y, idz);
    // console.log(`[Chsm.getIdAndZone] (${this.id}) id:${idz.id} zone:${idz.zone}`);
    return idz;
  }

  setupCursor() {
    const idz = hsm.getIdAndZone(hsm.pToMmL(mousePos.x), hsm.pToMmL(mousePos.y));
    const elem = hsm.hElems.getById(idz.id);
    hsm.hElems.setIdAndZone(idz);
    hsm.setCursor(elem.defineCursor(idz));
  }
}
