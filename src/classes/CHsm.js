"use strict";

const inchInMm = 25.4;

let objects = null;
export let canvas = null;
export let ctx = null;
export let hsm = null;
let sernum = 0;

class Cobjects {
  constructor(obj) {
    this.objects = {};
    this.selectedId = "";
    this.draggedId = "";
    this.mouseDownX = 0;
    this.mouseDownY = 0;
    this.mouseDx = 0;
    this.mouseDy = 0;
    this.mouseX = 0;
    this.mouseY = 0;
  }

  insert(obj) {
    this.objects[obj.id] = obj;
  }

  removeById(id) {
    delete this.objects[id];
  }

  clear() {
    this.objects = {};
  }

  setSelected(id) {
    this.selectedId = id;
  }

  isSelected(id) {
    return this.selectedId == id;
  }

  dragStart(id, mouseDownX, mouseDownY) {
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

class CsimpleObject {
  constructor(obj, type) {
    const id = type + ++sernum;
    this.id = id;
    this.name = obj.name;
    this.parent = null;
    this.children = [];
  }

  link(parent) {
    this.parent = parent;
    parent.insertChild(this);
    objects.add(this);
  }

  unlink() {
    this.parent = null;
    this.parent.excludeChild(this);
    objects.removeById(this.id);
  }

  highlight(mouseX, mouseY) {}

  draw(mouseX, mouseY) {
    console.log(`[Chsm.CsimpleObject.draw]`);
  }

  dragStart(downX, downY) {}
  dragEnd(downX, downY) {}
  dragCancel(downX, downY) {}
}

class Cnote extends CsimpleObject {
  constructor(options) {
    super(options, "N");
  }

  getText() {}

  setText() {}
}

class CbaseState extends CsimpleObject {
  constructor(options, type) {
    super(options, type);
  }
}

class CentrySstate extends CbaseState {
  constructor(options) {
    super(options, "E");
  }
}

class CexitSstate extends CbaseState {
  constructor(options) {
    super(options, "X");
  }
}

class Csstate extends CbaseState {
  constructor(options) {
    super(options, "S");
    this.rect = options.rect;
  }

  draw(mouseX, mouseY) {
    console.log(`[Chsm.Cstate.draw]`);
  }
}
class Cchoice extends CsimpleObject {
  constructor(options) {
    super(options, "O");
    this.transTrue = options.transTrue;
    this.transFalse = options.transFalse;
    this.test = options.test;
  }
}

class Cjunction extends CsimpleObject {
  constructor(options) {
    super(options, "J");
  }
}

class CbaseTrans extends CsimpleObject {
  constructor(options, type) {
    super(options, type);
  }
}

class CtransLine extends CbaseTrans {
  constructor(options) {
    super(options, "T");
  }
}

class CtransBezier extends CbaseTrans {
  constructor(options) {
    super(options, "B");
  }
}

class CbaseRegion extends CsimpleObject {
  constructor(options, type) {
    super(options, type);
  }
}

class CExternalRegion extends CbaseRegion {
  constructor(options) {
    super(options, "E");
  }
}

class CRegion extends CbaseRegion {
  constructor(options) {
    super(options, "R");
  }
}

class Cfolio extends CbaseRegion {
  constructor(options) {
    super(options, "F");
    this.rect = options.rect;
    this.viewport = options.vp;
    for (let stateId of Object.keys(options.states)) {
      const stateOption = options.states[stateId];
      const state = new Csstate(stateOption);
      this.children.push(state);
    }
    console.log(`[Cfolio.load] scale:${options.vp.scale}`);
    this.viewport = options.vp;
  }

  scalePhy() {
    console.log(`[Cfolio.Cfolio] scale:${this.viewport.scale}`);
    return this.viewport.scale * (hsm.settings.screenDpi / inchInMm);
  }

  TX(xMm) {
    return Math.round((xMm - this.viewport.x0) * this.scalePhy()) + 0.5;
  }

  TY(yMm) {
    return Math.round((yMm - this.viewport.y0) * this.scalePhy()) + 0.5;
  }

  TL(lMm) {
    return Math.round(lMm * this.scalePhy());
  }

  RTX(xP) {
    return xP / this.scalePhy() + this.viewport.x0;
  }

  RTY(yP) {
    return yP / this.scalePhy() + this.viewport.y0;
  }

  RTL(lP) {
    return lP / this.scalePhy();
  }

  drawFolioBackground() {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    // if (folio.drag) {
    //   folio.rect.x0 = folio.drag.oldRect.x0 + folio.drag.dx;
    //   folio.rect.y0 = folio.drag.oldRect.y0 + folio.drag.dy;
    // }
    console.log(`[Chsm.Cfolio.drawFolioBackground] scale:${this.scalePhy()}`);

    ctx.rect(
      this.TX(this.rect.x0),
      this.TY(this.rect.y0),
      this.TL(this.rect.width),
      this.TL(this.rect.height),
    );
    ctx.fill();
  }

  draw(mouseX, mouseY) {
    console.log(`[Chsm.Cfolio.draw]`);
    this.drawFolioBackground();
    for (let child of this.children) {
      child.draw(mouseX, mouseY);
    }
  }
}

class Chsm {
  constructor(options) {
    objects = new Cobjects();
    this.activeFolio = null;
    this.cCanvas = null;
    this.folios = {};
    this.folioActive = null;
    this.FoliosOrder = [];
    this.settings = {};
  }

  load(obj) {
    this.settings = obj.settings;
    this.FoliosOrder = obj.folios.order;
    for (let folioId of this.FoliosOrder) {
      const folioOptions = obj.folios[folioId];
      this.folios[folioId] = new Cfolio(folioOptions);
    }
    this.folioActive = this.folios[obj.folios.active];
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
    console.log(`[Chsm.draw]`);
    // Clear canvas
    ctx.fillStyle = "#ccc";
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();
    if (!this.folioActive) return;
    this.folioActive.draw(0, 0);
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

  addFolio() {}

  setActiveFolio(folioId) {}
}

hsm = new Chsm();
