"use strict";

const inchInMm = 25.4;

export class ChElems {
  constructor(obj) {
    this.elems = {};
    this.hoveredId = "";
    this.selectedId = "";
    this.errorId = "";
    this.draggedId = "";
    this.dragCtx = {};
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

  setErrorId(id) {
    this.errorId = id;
  }

  getErrorId() {
    return this.errorId;
  }

  getDraggedId() {
    return this.draggedId;
  }

  getDragCtx() {
    return this.dragCtx;
  }

  setDragCtx(id, dragCtx) {
    this.selectedId = id;
    this.errorId = null;
    this.hoveredId = null;
    if (!id) {
      this.draggedId = null;
    } else this.draggedId = id;
    this.dragCtx = dragCtx;
  }

  drag(mouseDx, mouseDy) {
    this.mouseDx = mouseDx;
    this.mouseDy = mouseDy;
  }

  dragEnd() {
    this.draggedId = "";
  }
}
