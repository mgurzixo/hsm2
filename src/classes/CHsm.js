"use strict";

const inchInMm = 25.4;

let hElems = null;
export let canvas = null;
export let ctx = null;
export let hsm = null;
export let folio = null;

class ChElems {
  constructor(obj) {
    this.elems = {};
    this.hoveredId = "";
    this.selectedId = "";
    this.draggedId = "";
    this.mouseDownX = 0;
    this.mouseDownY = 0;
  }

  insert(obj) {
    console.log(`[ChElems.insert] Inserting:${obj.id}`);
    this.elems[obj.id] = obj;
  }

  removeById(id) {
    delete this.elems[id];
  }

  getById(id) {
    return this.elems[id];
  }

  clear() {
    this.elems = {};
  }

  setSelected(id) {
    this.selectedId = id;
  }

  getSelectedId() {
    return this.selectedId;
  }

  dragStart(id, mouseDownX, mouseDownY) {
    this.selectedId = null;
    this.hoveredId = null;
    this.draggedId = id;
    this.mouseDownX = mouseDownX;
    this.mouseDownY = mouseDownY;
  }

  drag(mouseDx, mouseDy) {
    this.mouseDx = mouseDx;
    this.mouseDy = mouseDy;
  }

  dragStop() {
    this.draggedId = "";
  }

  isDragged(id) {
    return {
      mouseDownX: this.mouseDownX,
      mouseDownY: this.mouseDownY,
      mouseDx: this.mouseDx,
      mouseDy: this.mouseDy,
    };
  }
}

class CbaseElem {
  static sernum = 0;

  constructor(parent, obj, type) {
    let id = obj.id;
    if (!id) id = type + ++CbaseElem.sernum;
    this.id = id;
    this.name = obj.name;
    this.parent = parent;
    this.children = [];
    this.geo = { x0: 0, y0: 0 }; // Offset from parent
  }

  link(parent) {
    this.parent = parent;
    parent.insertChild(this);
    hElems.add(this);
  }

  unlink() {
    this.parent = null;
    this.parent.excludeChild(this);
    hElems.removeById(this.id);
  }

  load(options) {
    console.log(`[Chsm.CbaseElem.load] id:${options?.id}`);
  }

  draw() {
    console.log(`[Chsm.CbaseElem.draw] id:${this.id}`);
  }

  hover(mouseX, mouseY) {}
  click(mouseX, mouseY) {}
  doubleClick(mouseX, mouseY) {}
  drag(deltaX, deltaY) {}

  dragStart(mouseX, mouseY) {}
  dragEnd(mouseX, mouseY) {}
  dragCancel(mouseX, mouseY) {}

  scalePhy() {
    return folio.geo.scale * (hsm.settings.screenDpi / inchInMm);
  }

  TX(xMm) {
    return Math.round((this.parent.geo.x0 + xMm) * this.scalePhy()) + 0.5;
  }

  TY(yMm) {
    return Math.round((this.parent.geo.y0 + yMm) * this.scalePhy()) + 0.5;
  }

  TL(lMm) {
    return Math.round(lMm * this.scalePhy());
  }

  RTX(xP) {
    return xP / this.scalePhy() - this.parent.geo.x0;
  }

  RTY(yP) {
    return yP / this.scalePhy() - this.parent.geo.y0;
  }

  RTL(lP) {
    return lP / this.scalePhy();
  }

  PathRoundedRectP(px, py, pwidth, pheight, pradius) {
    ctx.beginPath();
    ctx.moveTo(px + pradius, py);
    ctx.lineTo(px + pwidth - pradius, py);
    ctx.quadraticCurveTo(px + pwidth, py, px + pwidth, py + pradius);
    ctx.lineTo(px + pwidth, py + pheight - pradius);
    ctx.quadraticCurveTo(px + pwidth, py + pheight, px + pwidth - pradius, py + pheight);
    ctx.lineTo(px + pradius, py + pheight);
    ctx.quadraticCurveTo(px, py + pheight, px, py + pheight - pradius);
    ctx.lineTo(px, py + pradius);
    ctx.quadraticCurveTo(px, py, px + pradius, py);
    ctx.closePath();
  }
}

class Cnote extends CbaseElem {
  constructor(parent, options) {
    super(parent, options, "N");
  }

  getText() {}

  setText() {}
}

class CbaseState extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
  }
}

class CentrySstate extends CbaseState {
  constructor(parent, options) {
    super(parent, options, "E");
  }
}

class CexitSstate extends CbaseState {
  constructor(parent, options) {
    super(parent, options, "X");
  }
}

class Cstate extends CbaseState {
  constructor(parent, options) {
    super(parent, options, "S");
    this.geo = options.geo;
  }

  draw() {
    console.log(`[Chsm.Cstate.draw]`);
    // console.log(`[canvas.drawState] State:${state.name}`);
    const x0 = this.TX(this.geo.x0);
    const y0 = this.TY(this.geo.y0);
    const width = this.TL(this.geo.width);
    const height = this.TL(this.geo.height);
    // console.log(`[Chsm.Cstate.draw] x0:${theFolio.rect.x0 + state.rect.x0} x0P:${x0}`);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    // theCtx.rect(x0, y0, width, height);
    const stateRadiusP = this.TL(hsm.settings.stateRadiusMm);
    this.PathRoundedRectP(x0, y0, width, height, stateRadiusP);
    ctx.fill();
    ctx.stroke();
  }
}

class Cchoice extends CbaseElem {
  constructor(parent, options) {
    super(parent, options, "O");
    this.transTrue = options.transTrue;
    this.transFalse = options.transFalse;
    this.test = options.test;
  }
}

class Cjunction extends CbaseElem {
  constructor(parent, options) {
    super(parent, options, "J");
  }
}

class CbaseTrans extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
  }
}

class CtransLine extends CbaseTrans {
  constructor(parent, options) {
    super(parent, options, "T");
  }
}

class CtransBezier extends CbaseTrans {
  constructor(parent, options) {
    super(parent, options, "B");
  }
}

class CbaseRegion extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
  }
}

class CExternalRegion extends CbaseRegion {
  constructor(parent, options) {
    super(parent, options, "E");
  }
}

class CRegion extends CbaseRegion {
  constructor(parent, options) {
    super(parent, options, "R");
  }
}

class Cfolio extends CbaseRegion {
  constructor(parent, options) {
    super(parent, options, "F");
    this.geo = options.geo;

    console.log(`[Cfolio.constructor] scale:${options.geo.scale}`);
  }

  load(options) {
    for (let id of Object.keys(options.states)) {
      const stateOption = options.states[id];
      const myState = new Cstate(this, stateOption);
      hElems.insert(myState);
      this.children.push(myState);
      myState.load(options);
    }
  }

  drawFolioBackground() {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    // if (folio.drag) {
    //   folio.geo.x0 = folio.drag.oldRect.x0 + folio.drag.dx;
    //   folio.geo.y0 = folio.drag.oldRect.y0 + folio.drag.dy;
    // }
    const s = this.scalePhy();
    console.log(`[Chsm.Cfolio.drawFolioBackground] scalePhy:${s}`);

    console.log(
      `[Chsm.Cfolio.drawFolioBackground] folio:${Math.round(this.geo.x0 * s) + 0.5}, ${Math.round(this.geo.y0 * s) + 0.5}, ${Math.round(this.geo.width * s) + 0.5}, ${Math.round(this.geo.height * s) + 0.5}`,
    );

    ctx.rect(
      Math.round(this.geo.x0 * s) + 0.5,
      Math.round(this.geo.y0 * s) + 0.5,
      Math.round(this.geo.width * s) + 0.5,
      Math.round(this.geo.height * s) + 0.5,
    );
    ctx.fill();
  }

  draw() {
    console.log(`[Cfolio.draw]`);
    this.drawFolioBackground();
    for (let child of this.children) {
      child.draw();
    }
  }
}

class Chsm extends CbaseElem {
  constructor(parent, options) {
    super(parent, options, "M");
    hElems = new ChElems();
    this.activeFolio = null;
    this.cCanvas = null;
    this.folioActive = null;
    this.folioIdsOrder = [];
    this.settings = {};
    this.isDirty = false;
  }

  setdirty() {
    this.isDirty = true;
  }

  setActiveFolioById(folioId) {
    const f = hElems.getById(folioId);
    this.folioActive = f;
    folio = this.folioActive;
    console.log(`[Chsm.setActiveFolioById] folioId:${folioId} folioActive:${folio}`);
    this.setdirty();
  }

  addFolio(options) {
    const myFolio = new Cfolio(this, options);
    hElems.insert(myFolio);
    this.children.push(myFolio);
    myFolio.load(options);
  }

  load(obj) {
    this.settings = obj.settings;
    this.folioIdsOrder = obj.folios.idsOrder;
    for (let folioId of this.folioIdsOrder) {
      const folioOptions = obj.folios[folioId];
      this.addFolio(folioOptions);
    }
    this.setActiveFolioById(obj.folios.activeId);
    this.draw();
  }

  save() {}

  setCanvas(myCanvas) {
    if (canvas && this.resizeObserver) this.unobserve();
    canvas = myCanvas;
    ctx = canvas.getContext("2d");
    const bindedAdjustSizes = this.adjustSizes.bind(this);
    this.resizeObserver = new ResizeObserver(bindedAdjustSizes);
    this.observe();
  }

  observe() {
    this.resizeObserver.observe(document.body);
  }

  unobserve() {
    this.resizeObserver.unobserve(canvas);
  }

  draw() {
    if (!ctx) return;
    console.log(`[Chsm.draw] folio=${folio}`);
    // Clear canvas
    ctx.fillStyle = "#ccc";
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();
    if (!folio) return;
    folio.draw();
  }

  adjustSizes() {
    // console.warn(`[Chsm.adjustSizes]`);
    const cpe = canvas.parentElement;
    const bb = cpe.getBoundingClientRect();
    const height = window.innerHeight - bb.top;
    cpe.style.height = height - 0 + "px";
    const width = window.innerWidth - bb.left;
    cpe.style.width = width - 0 + "px";
    // console.log(`[Chsm.adjustSizes] height:${height}`);
    canvas.x0 = bb.top;
    canvas.y0 = bb.left;
    canvas.width = cpe.offsetWidth;
    canvas.height = cpe.offsetHeight;
    this.draw();
  }
}

hsm = new Chsm(null, { name: "Hsm" });
