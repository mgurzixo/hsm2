"use strict";

const inchInMm = 25.4;

let hElems = null;
export let canvas = null;
export let ctx = null;
export let hsm = null;
export let folio = null;

function rectsIntersect(r1, r2) {
  if (r1.x0 + r1.width < r2.x0) return false;
  if (r2.x0 + r2.width < r1.x0) return false;
  if (r1.y0 + r1.height < r2.y0) return false;
  if (r2.y0 + r2.height < r1.y0) return false;
  return true;
}

function rect2InRect1(r1, r2) {
  if (!rectsIntersect(r1, r2)) return false;
  if (r2.x0 < r1.x0) return false;
  if (r2.x0 + r2.width > r1.x0 + r1.width) return false;
  if (r2.y0 < r1.y0) return false;
  if (r2.y0 + r2.height > r1.y0 + r1.height) return false;
  return true;
}

function pointInRect(x, y, r) {
  if (x < r.x0 || x > r.x0 + r.width || y < r.y0 || y > r.y0 + r.height) {
    // console.log(
    //   `[Chsm.pointInRect] (${x.toFixed()}, ${y.toFixed()}) in (${r.x0.toFixed()}, ${r.y0.toFixed()}) w:${r.width} h:${r.height} FALSE`,
    // );
    return false;
  }
  // console.log(
  //   `[Chsm.pointInRect] (${x.toFixed()}, ${y.toFixed()}) in (${r.x0.toFixed()}, ${r.y0.toFixed()}) w:${r.width} h:${r.height} TRUE`,
  // );
  return true;
}

function pointInWH(x, y, r) {
  if (x < 0 || x > r.width || y < 0 || y > r.height) {
    //   console.log(
    //     `[Chsm.pointInWH] (${x.toFixed()}, ${y.toFixed()}) in (${r.x0.toFixed()}, ${r.y0.toFixed()}) w:${r.width} h:${r.height} FALSE`,
    // );
    return false;
  }
  // console.log(
  //   `[Chsm.pointInWH] (${x.toFixed()}, ${y.toFixed()}) in (${r.x0.toFixed()}, ${r.y0.toFixed()}) w:${r.width} h:${r.height} TRUE`,
  // );
  return true;
}

function myClamp(dx, x0, len0, x1, len1) {
  if (x0 + dx < x1) dx = x1 - x0;
  if (x0 + dx + len0 > x1 + len1) dx = x1 + len1 - x0 - len0;
  return dx;
}

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
    return [this.startX, this.startY];
  }

  dragStart(id, startX, startY) {
    this.selectedId = null;
    this.hoveredId = null;
    if (!id) {
      this.draggedId = null;
    } else this.draggedId = id;
    this.startX = startX;
    this.startY = startY;
  }

  drag(mouseDx, mouseDy) {
    this.mouseDx = mouseDx;
    this.mouseDy = mouseDy;
  }

  dragEnd() {
    this.draggedId = "";
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
    if (obj.geo) this.geo = obj.geo;
    else this.geo = { x0: 0, y0: 0, x00: 0, y00: 0 }; // Offset from parent

    // console.log(`[CbaseElem.constructor] Created:${this.id}`);
  }

  destroy() {
    // console.log(`[CbaseElem.destroy] this:${this.id}`);
    for (let child of this.children) {
      // console.log(`[CbaseElem.destroy] this:${this.id} child:${child} childId:${child.id}`);
      child.destroy();
    }
    hElems.removeById(this.id);
    delete this.id;
    delete this.name;
    delete this.parent;
    delete this.children;
    delete this.geo;
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
    console.warn(`[CbaseElem.load] this:${this.id}`);
  }

  draw() {
    console.warn(`[CbaseElem.draw] Drawing ${this.id}`);
  }

  hover(x, y) {}
  click(x, y) {}
  doubleClick(x, y) {}
  dragStart(x, y) {
    return null;
  }
  drag(dx, dy) {}
  dragEnd(dx, dy) {}
  dragCancel(dx, dy) {}

  getXY0InFolio() {
    let [x, y] = [0, 0];
    for (let elem = this; elem; elem = elem.parent) {
      [x, y] = [x + elem.geo.x0, y + elem.geo.y0];
      // console.log(`[CbaseElem.getXY0InFolio] id:${elem.id} x:${x?.toFixed()}`);
    }
    return [x, y];
  }

  setGeo00() {
    [this.geo.x00, this.geo.y00] = this.getXY0InFolio();
  }

  setGeo00X() {
    for (let child of this.children) {
      [child.geo.x00, child.geo.y00] = [this.geo.x00 + child.geo.x0, this.geo.y00 + child.geo.y0];
      child.setGeo00X();
    }
  }

  setGeo00R() {
    this.setGeo00();
    this.setGeo00X();
  }

  updateGeo00() {
    [this.geo.x00, this.geo.y00] = [
      this.parent.geo.x00 + this.geo.x0,
      this.parent.geo.y00 + this.geo.y00,
    ];
  }

  scalePhy() {
    return folio.geo.scale * (hsm.settings.screenDpi / inchInMm);
  }

  pToMm(xP, yP) {
    return [xP / this.scalePhy() - this.geo.x0, yP / this.scalePhy() - this.geo.y0];
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

  raiseChild(childId) {
    const c = [];
    let found;
    for (let child of this.children) {
      if (child.id != childId) c.push(child);
      else found = child;
    }
    if (found) c.push(found);
    this.children = c;
  }

  raiseChildR(childId) {
    this.raiseChild(childId);
    this.parent?.raiseChildR(this.id);
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
  }

  addRegion(regionOptions) {
    const myRegion = new Cregion(this, regionOptions);
    hElems.insert(myRegion);
    this.children.push(myRegion);
    myRegion.load(regionOptions);
  }

  load(stateOptions) {
    // console.log(`[Cstate.load] regions:${stateOptions?.regions}`);
    if (!stateOptions?.regions) return;
    for (let id of Object.keys(stateOptions.regions)) {
      // console.log(`[Cstate.load] RegionId:${id}`);
      const regionOptions = stateOptions.regions[id];
      this.addRegion(regionOptions);
    }
    this.updateGeo00();
  }

  click(xx, yy) {
    // (xx, yy) in mm from parent origin
    if (!pointInRect(xx, yy, this.geo)) return null;
    // Inside us
    let elem;
    const [x, y] = [xx - this.geo.x0, yy - this.geo.y0];
    for (let child of this.children) {
      // Is it inside a child
      elem = child.click(x, y);
      if (elem) break;
    }
    if (elem) return elem;
    // For us
    // console.log(`[Cstate.click] Raising ${this.id}`);
    this.parent.raiseChildR(this.id);
    return this;
  }

  dragStart(xx, yy) {
    // (xx, yy) in mm from parent origin
    // Inside us
    let elem;
    const [x, y] = [xx - this.geo.x0, yy - this.geo.y0];
    console.log(`[Cstate.dragStart] ${this.id} xx:${xx?.toFixed()} x:${x?.toFixed()}`);
    if (!pointInWH(x, y, this.geo)) return null;
    for (let child of this.children.toReversed()) {
      // Is it inside a child
      elem = child.dragStart(x, y);
      if (elem) break;
    }
    if (elem) return elem;
    // For us
    this.parent.raiseChildR(this.id);
    hElems.dragStart(this.id, this.geo.x0, this.geo.y0);
    return this;
  }

  drag(dx, dy) {
    if (hElems.getDraggedId() != this.id) {
      for (let child of this.children.toReversed()) {
        child.drag(dx, dy);
      }
      return;
    }
    // console.log(`[Cstate.drag] dx:${dx} dy:${dy}`);
    const [x0, y0] = hElems.getDragStart();
    dx = myClamp(dx, x0, this.geo.width, 0, this.parent.geo.width);
    dy = myClamp(dy, y0, this.geo.height, 0, this.parent.geo.height);
    this.geo.x0 = x0 + dx;
    this.geo.y0 = y0 + dy;
    hsm.draw();
  }

  dragEnd(dx, dy) {
    if (hElems.getDraggedId() != this.id) {
      for (let child of this.children.toReversed()) {
        child.dragEnd(dx, dy);
      }
      return;
    }
    this.drag(dx, dy);
    // console.log(`[Cfolio.dragEnd]`);
    hElems.dragEnd();
    hsm.draw();
  }

  draw() {
    // console.log(`[Cstate.draw] Drawing ${this.id}`);
    // console.log(`[canvas.drawState] State:${state.name}`);
    // const x0 = this.TX(this.geo.x0);
    // const y0 = this.TY(this.geo.y0);
    let [x0, y0] = this.getXY0InFolio();
    // console.log(`[Cstate.draw] x0:${x0}`);
    x0 = this.TL(x0);
    y0 = this.TL(y0);
    const width = this.TL(this.geo.width);
    const height = this.TL(this.geo.height);
    // console.log(`[Cstate.draw] x0:${theFolio.rect.x0 + state.rect.x0} x0P:${x0}`);
    ctx.fillStyle = "#ff0";
    ctx.strokeStyle = "#000";
    // theCtx.rect(x0, y0, width, height);
    const stateRadiusP = this.TL(hsm.settings.stateRadiusMm);
    this.PathRoundedRectP(x0, y0, width, height, stateRadiusP);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, y0 + 1.5 * stateRadiusP);
    ctx.lineTo(x0 + width, y0 + 1.5 * stateRadiusP);
    ctx.stroke();

    for (let child of this.children) {
      child.draw();
    }
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

class Cregion extends CbaseRegion {
  constructor(parent, options) {
    super(parent, options, "R");
  }

  addState(stateOptions) {
    const myState = new Cstate(this, stateOptions);
    hElems.insert(myState);
    this.children.push(myState);
    myState.load(stateOptions);
  }

  dragStart(xx, yy) {
    // (xx, yy) in mm from parent origin
    // Inside us
    let elem;
    const [x, y] = [xx - this.geo.x0, yy - this.geo.y0];
    console.log(`[Cregion.dragStart] ${this.id} xx:${xx?.toFixed()} x:${x?.toFixed()}`);
    if (!pointInWH(x, y, this.geo)) return null;
    for (let child of this.children.toReversed()) {
      // Is it inside a child
      elem = child.dragStart(x - this.geo.x0, y - this.geo.yo);
      if (elem) break;
    }
    if (elem) return elem;
    // For now, the region is not draggable
    // this.parent.raiseChildR(this.id);
    // hElems.dragStart(this.id, this.geo.x0, this.geo.y0);
    // return this;
    return null;
  }

  drag(dx, dy) {
    if (hElems.getDraggedId() != this.id) {
      for (let child of this.children.toReversed()) {
        child.drag(dx, dy);
      }
      return;
    }
    // console.log(`[Cstate.drag] dx:${dx} dy:${dy}`);
    const [x0, y0] = hElems.getDragStart();
    dx = myClamp(dx, x0, this.geo.width, 0, this.parent.geo.width);
    dy = myClamp(dy, y0, this.geo.height, 0, this.parent.geo.height);
    this.geo.x0 = x0 + dx;
    this.geo.y0 = y0 + dy;
    hsm.draw();
  }

  draw() {
    // console.log(`[Cregion.draw] Drawing ${this.id}`);
    // For now, no region background
    // console.log(`[Cregion.draw]`);
    for (let child of this.children) {
      child.draw();
    }
  }

  load(regionOptions) {
    // console.log(`[Cregion.load] states:${regionOptions?.states}`);
    for (let id of Object.keys(regionOptions.states)) {
      const stateOption = regionOptions.states[id];
      const myState = new Cstate(this, stateOption);
      hElems.insert(myState);
      this.children.push(myState);
      myState.load(stateOption);
    }
    this.updateGeo00();
  }
}

class Cfolio extends CbaseRegion {
  constructor(parent, options) {
    super(parent, options, "F");
    this.geo = options.geo;
    // console.log(`[Cfolio.constructor] scale:${options.geo.scale}`);
  }

  load(folioOptions) {
    for (let stateOption of folioOptions.states) {
      const myState = new Cstate(this, stateOption);
      hElems.insert(myState);
      this.children.push(myState);
      myState.load(stateOption);
    }
    this.updateGeo00();
  }

  drawFolioBackground() {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    const s = this.scalePhy();
    ctx.rect(
      Math.round(this.geo.x0 * s) + 0.5,
      Math.round(this.geo.y0 * s) + 0.5,
      Math.round(this.geo.width * s) + 0.5,
      Math.round(this.geo.height * s) + 0.5,
    );
    ctx.fill();
  }

  draw() {
    // console.log(`[Cfolio.draw] Drawing ${this.id}`);
    this.drawFolioBackground();
    for (let child of this.children) {
      child.draw();
    }
  }

  hoverP(xP, yP) {
    const [x, y] = this.pToMm(xP, yP);
  }

  clickP(xP, yP) {
    const [xx, yy] = [xP / this.scalePhy(), yP / this.scalePhy()];
    // (xx, yy) in mm from parent origin
    if (!pointInRect(xx, yy, this.geo)) return null;
    // Inside us
    let elem;
    const [x, y] = [xx - this.geo.x0, yy - this.geo.y0];
    for (let child of this.children.toReversed()) {
      // Is it inside a child
      elem = child.click(x, y);
      if (elem) break;
    }
    if (elem) return elem;
    // For us
    this.parent.raiseChildR(this.id);
    return this;
  }

  dragStartP(xP, yP) {
    const [xx, yy] = [xP / this.scalePhy(), yP / this.scalePhy()];
    // (xx, yy) in mm from canvas origin
    // Inside us
    let elem;
    const [x, y] = [xx - this.geo.x0, yy - this.geo.y0];
    console.log(`[Cfolio.dragStartP] xx:${xx.toFixed()} x:${x.toFixed()}`);
    if (!pointInWH(x, y, this.geo)) return null;
    for (let child of this.children.toReversed()) {
      // Is it inside a child
      elem = child.dragStart(x, y);
      if (elem) break;
    }
    if (elem) return elem;
    // For us
    this.parent.raiseChildR(this.id);
    hElems.dragStart(this.id, this.geo.x0, this.geo.y0);
    return this;
  }

  dragP(dxP, dyP) {
    const dx = dxP / this.scalePhy();
    const dy = dyP / this.scalePhy();
    if (hElems.getDraggedId() != this.id) {
      for (let child of this.children.toReversed()) {
        child.drag(dx, dy);
      }
      return;
    }
    // console.log(`[Cfolio.dragP] dx:${dx} dy:${dy}`);
    const [x0, y0] = hElems.getDragStart();
    this.geo.x0 = x0 + dx;
    this.geo.y0 = y0 + dy;
    hsm.draw();
  }

  dragEndP(dxP, dyP) {
    const dx = dxP / this.scalePhy();
    const dy = dyP / this.scalePhy();
    if (hElems.getDraggedId() != this.id) {
      for (let child of this.children.toReversed()) {
        child.dragEnd(dx, dy);
      }
      return;
    }
    this.dragP(dxP, dyP);
    // console.log(`[Cfolio.dragEndP]`);
    hElems.dragEnd();
    hsm.draw();
  }

  dragCancelP(dxP, dyP) {
    this.dragEndP(dxP, dyP);
  }

  raiseChildR(id) {
    super.raiseChildR(id);
    hsm.draw();
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
    this.settings = {};
    this.isDirty = false;
    hsm = this;
  }

  setdirty() {
    this.isDirty = true;
  }

  addFolio(folioOptions) {
    const myFolio = new Cfolio(this, folioOptions);
    hElems.insert(myFolio);
    this.children.push(myFolio);
    myFolio.load(folioOptions);
  }

  load(hsmOptions) {
    this.settings = hsmOptions.settings;
    this.state = hsmOptions.state;
    for (let folioOptions of hsmOptions.folios) {
      this.addFolio(folioOptions);
    }
    folio = hElems.getById(this.state.activeFolio);
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
}
