"use strict";

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

  draw(mouseX, mouseY) {}

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
  }
}

class Chsm {
  constructor(options) {
    objects = new Cobjects();
    this.activeFolio = null;
    this.cCanvas = null;
  }

  load(obj) {}

  save() {}

  setCanvas(myCanvas) {
    if (canvas && this.resizeObserver) this.unobserve();
    canvas = myCanvas;
    ctx = canvas.getContext("2d");
    const bindedAdjustSizes = this.draw.bind(this);
    this.resizeObserver = new ResizeObserver(bindedAdjustSizes);
    this.observe();
    this.adjustSizes();
  }

  observe() {
    this.resizeObserver.observe(canvas);
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
    if (!this.folio) return;
  }

  adjustSizes() {
    const cpe = canvas.parentElement;
    const bb = cpe.getBoundingClientRect();
    const height = window.innerHeight - bb.top;
    cpe.style.height = height - 0 + "px";
    const width = window.innerWidth - bb.left;
    cpe.style.width = width - 0 + "px";
    console.log(`[Chsm.adjustSizes] height:${height}`);
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
