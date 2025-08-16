"use strict";

const inchInMm = 25.4;

export class ChCtx {
  constructor(obj) {
    this.clear();
  }

  clear() {
    this.folio = null;
    this.hoveredId = "";
    this.selectedId = "";
    this.errorId = "";
    this.draggedId = "";
    this.dragCtx = {};
    this.idz = { id: "", zone: "", x: 0, y: 0 };
  }

  setSelectedId(id) {
    this.selectedId = id;
  }

  getSelectedId() {
    return this.selectedId;
  }

  setIdz(idz) {
    this.idz = idz;
  }

  getIdz() {
    return this.idz;
  }

  setErrorId(id) {
    // console.warn(`[Chctx.setErrorId] errorId:${id}`);
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

  setDragCtx(dragCtx) {
    const id = dragCtx.id;
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
    this.dragCtx = null;
  }

}
