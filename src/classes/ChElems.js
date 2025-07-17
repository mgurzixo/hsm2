"use strict";

const inchInMm = 25.4;

export class ChElems {
  constructor(obj) {
    this.elems = {};
  }

  insertElem(obj) {
    // console.log(`[ChElems.insert] Inserting:${obj.id}`);
    this.elems[obj.id] = obj;
  }

  removeElemById(id) {
    delete this.elems[id];
  }

  getElemById(id) {
    return this.elems[id];
  }

  clearElems() {
    this.elems = {};
  }
}
