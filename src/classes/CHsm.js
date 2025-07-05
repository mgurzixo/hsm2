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
    // console.log(`[ChElems.insert] Inserting:${obj.id}`);
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

  getDraggedId() {
    return this.draggedId;
  }

  getDragStart() {
    return [this.mouseDownX, this.mouseDownY];
  }

  dragStart(id, mouseDownX, mouseDownY) {
    this.selectedId = null;
    this.hoveredId = null;
    if (!id) {
      this.draggedId = null;
    } else this.draggedId = id;
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

  destroy() {
    console.warn(`[Chsm.CbaseElem.destroy] this:${this.id}`);
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
    console.warn(`[Chsm.CbaseElem.load] this:${this.id}`);
  }

  draw() {
    console.log(`[Chsm.CbaseElem.draw] this:${this.id}`);
  }

  hover(mouseX, mouseY) {}
  click(mouseX, mouseY) {}
  doubleClick(mouseX, mouseY) {}
  dragStart(mouseX, mouseY) {}
  drag(deltaX, deltaY) {}
  dragEnd(deltaX, deltaY) {}
  dragCancel(deltaX, deltaY) {}

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

  load(stateOptions) {
    // console.log(`[Cstate.load] ${stateOptions?.regions}`);
    if (!stateOptions?.regions) return;
    for (let id of Object.keys(stateOptions.regions)) {
      const regionOption = stateOptions.region[id];
      const myRegion = new CRegion(this, regionOption);
      hElems.insert(myRegion);
      this.children.push(myRegion);
      myRegion.load(regionOption);
    }
  }

  destroy() {
    for (let child of this.children) {
      child.destroy();
    }
    this.geo = null;
    hElems.removeById(this.id);
  }

  draw() {
    // console.log(`[Cstate.draw]`);
    // console.log(`[canvas.drawState] State:${state.name}`);
    const x0 = this.TX(this.geo.x0);
    const y0 = this.TY(this.geo.y0);
    const width = this.TL(this.geo.width);
    const height = this.TL(this.geo.height);
    // console.log(`[Cstate.draw] x0:${theFolio.rect.x0 + state.rect.x0} x0P:${x0}`);
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
    // console.log(`[Cfolio.constructor] scale:${options.geo.scale}`);
  }

  load(options) {
    for (let id of Object.keys(options.states)) {
      const stateOption = options.states[id];
      const myState = new Cstate(this, stateOption);
      hElems.insert(myState);
      this.children.push(myState);
      myState.load(stateOption);
    }
  }

  destroy() {
    for (let child of this.children) {
      child.destroy();
    }
    this.geo = null;
    hElems.removeById(this.id);
  }

  drawFolioBackground() {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    // if (folio.drag) {
    //   folio.geo.x0 = folio.drag.oldRect.x0 + folio.drag.dx;
    //   folio.geo.y0 = folio.drag.oldRect.y0 + folio.drag.dy;
    // }
    const s = this.scalePhy();
    // console.log(`[Chsm.Cfolio.drawFolioBackground] scalePhy:${s}`);

    // console.log(
    //   `[Chsm.Cfolio.drawFolioBackground] folio:${Math.round(this.geo.x0 * s) + 0.5}, ${Math.round(this.geo.y0 * s) + 0.5}, ${Math.round(this.geo.width * s) + 0.5}, ${Math.round(this.geo.height * s) + 0.5}`,
    // );

    ctx.rect(
      Math.round(this.geo.x0 * s) + 0.5,
      Math.round(this.geo.y0 * s) + 0.5,
      Math.round(this.geo.width * s) + 0.5,
      Math.round(this.geo.height * s) + 0.5,
    );
    ctx.fill();
  }

  draw() {
    // console.log(`[Cfolio.draw]`);
    this.drawFolioBackground();
    for (let child of this.children) {
      child.draw();
    }
  }

  pToMm(xP, yP) {
    return [xP / this.scalePhy() - this.geo.x0, yP / this.scalePhy() - this.geo.y0];
  }

  hoverP(xP, yP) {
    const [x, y] = this.pToMm(xP, yP);
  }

  clickP(xP, yP) {
    const [x, y] = this.pToMm(xP, yP);
  }

  dragStartP(xP, yP) {
    const [x, y] = this.pToMm(xP, yP);
    console.log(`[Cfolio.dragStartP] x:${x} y:${y}`);
    hElems.dragStart(this.id, this.geo.x0, this.geo.y0);
  }

  dragP(dxP, dyP) {
    if (hElems.getDraggedId() == this.id) {
      const dx = dxP / this.scalePhy();
      const dy = dyP / this.scalePhy();
      // console.log(`[Cfolio.dragP] dx:${dx} dy:${dy}`);
      const [x0, y0] = hElems.getDragStart();
      this.geo.x0 = x0 + dx;
      this.geo.y0 = y0 + dy;
    } else {
      for (let child of this.children) {
        child.dragP(dxP, dyP);
      }
    }
    hsm.draw();
  }

  dragEndP(dxP, dyP) {
    if (hElems.getDraggedId() == this.id) {
      this.dragP(dxP, dyP);
      console.log(`[Cfolio.dragEndP]`);
      hElems.dragStart();
    } else {
      for (let child of this.children) {
        child.dragEndP(dxP, dyP);
      }
    }
    hsm.draw();
  }

  dragCancelP(dxP, dyP) {
    this.dragEndP(dxP, dyP);
  }

  wheelP(xP, yP, dyP) {
    const [x, y] = this.pToMm(xP, yP);
    const deltas = -dyP / hsm.settings.deltaMouseWheel;
    let scale = this.geo.scale + deltas * hsm.settings.deltaScale;
    scale = Math.min(Math.max(0.1, scale), 10);
    const rScale = scale / this.geo.scale;
    this.geo.scale = scale;
    const x0 = (this.geo.x0 - (rScale - 1) * x) / rScale;
    const y0 = (this.geo.y0 - (rScale - 1) * y) / rScale;
    this.geo.x0 = x0;
    this.geo.y0 = y0;
    hsm.draw();
  }
}

export class Chsm extends CbaseElem {
  constructor(parent, options) {
    super(parent, options, "M");
    hElems = new ChElems();
    this.activeFolio = null;
    this.cCanvas = null;
    this.folioActive = null;
    this.folioIdsOrder = [];
    this.settings = {};
    this.isDirty = false;
    hsm = this;
  }

  setdirty() {
    this.isDirty = true;
  }

  setActiveFolioById(folioId) {
    const f = hElems.getById(folioId);
    this.folioActive = f;
    folio = this.folioActive;
    // console.log(`[Chsm.setActiveFolioById] folioId:${folioId} folioActive:${folio}`);
    this.setdirty();
  }

  addFolio(folioOptions) {
    const myFolio = new Cfolio(this, folioOptions);
    hElems.insert(myFolio);
    this.children.push(myFolio);
    myFolio.load(folioOptions);
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

  destroy() {
    for (let child of this.children) {
      child.destroy();
    }
    this.folioActive = null;
    folio = null;
    hElems.removeById(this.id);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
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
    // console.log(`[Chsm.draw] folio=${folio}`);
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
}
