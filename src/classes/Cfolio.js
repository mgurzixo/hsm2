"use strict";

import * as U from "src/lib/utils";
import * as V from "vue";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { CbaseRegion } from "src/classes/Cregion";
import { Cstate } from "src/classes/Cstate";
import { Ctr } from "src/classes/Ctr";
import { Cnote } from "src/classes/Cnote";
import { setDragOffset } from "src/lib/canvasListeners";


let noteTo;

function deferredNotesUpdate() {
  if (noteTo) clearTimeout(noteTo);
  noteTo = setTimeout(async () => {
    await hCtx.folio.updateNotes();
    hsm.draw();
  }, 100);
}

export class Cfolio extends CbaseRegion {
  constructor(parent, options) {
    super(parent, options, "F");
    this.geo = options.geo;
    this.trs = [];
    this.notes = [];
    this.myOldScale = 0;
    // console.log(`[Cfolio.constructor] scale:${options.geo.scale}`);
  }


  setSelected(val) {
    // console.log(`[Chsm.setSelected] (${this.id}) } setSelected:${val}`);
    super.setSelected(val);
    for (let note of this.notes) {
      note.setSelected(val);
    }
  }

  async addNote(noteOptions) {
    // console.log(`[Cfolio.addNote] noteOptions:${JSON.stringify(noteOptions)}`);
    const myNote = new Cnote(this, noteOptions, "N");
    await myNote.load(noteOptions);
    this.notes.push(myNote);
    // console.log(`[Cfolio.addNote] id:${myNote.id}`);
    return myNote;
  }

  async addTr(trOptions) {
    const myTr = new Ctr(this, trOptions, "T");
    this.trs.push(myTr);
    await myTr.load(trOptions);
    return myTr;
  }

  async load(folioOptions) {
    for (let stateOption of folioOptions.states) {
      const myState = new Cstate(this, stateOption);
      this.children.push(myState);
      await myState.load(stateOption);
    }
    for (let trOptions of folioOptions.trs) {
      await this.addTr(trOptions);
    }
    for (let noteOptions of folioOptions.notes) {
      await this.addNote(noteOptions);
    }
    return true;
  }

  async onLoaded() {
    for (let child of this.children) {
      await child.onLoaded();
    }
    for (let tr of this.trs) {
      await tr.onLoaded();
    }
    for (let note of this.notes) {
      await note.onLoaded();
    }
  }

  drawFolioBackground() {
    cCtx.fillStyle = hsm.settings.styles.folioBackground;
    cCtx.beginPath();
    const s = this.scalePhy();
    cCtx.rect(
      Math.round(this.geo.x0 * s) + 0.5,
      Math.round(this.geo.y0 * s) + 0.5,
      Math.round(this.geo.width * s) + 0.5,
      Math.round(this.geo.height * s) + 0.5,
    );
    cCtx.fill();
  }

  draw() {
    // console.log(`[Cfolio.draw] Drawing ${this.id} ----------------------`);
    this.drawFolioBackground();
    this.geo.xx0 = this.geo.x0;
    this.geo.yy0 = this.geo.y0;
    // console.log(`[Cfolio.draw] Drawing ${this.id} y0:${this.geo.y0} geo.yy0:${this.geo.yy0}`);
    for (let note of this.notes) {
      note.draw(this.geo.xx0, this.geo.yy0);
    }
    for (let child of this.children) {
      child.draw(this.geo.xx0, this.geo.yy0);
    }
    for (let tr of this.trs) {
      tr.draw(0, 0);
    }
  }

  async insertState(x, y) {
    // console.log(`[Cfolio.insertState] Inserting state x:${x.toFixed()}`);
    const h = hsm.settings.stateMinHeight;
    const w = hsm.settings.stateMinWidth;
    const id = "S" + hsm.newSernum();
    const stateOptions = {
      id: id,
      name: "State " + id,
      color: "blue",
      geo: {
        x0: x - this.geo.x0 - w,
        y0: y - this.geo.y0 - h,
        width: w,
        height: h,
      },
      justCreated: true,
    };
    const myState = new Cstate(this, stateOptions, "S");
    // console.log(`[Cfolio.insertState] New state id:${myState?.id}`);
    this.children.push(myState);
    hsm.draw();
    modeRef.value = "";
    const m = U.pToMmL(hsm.settings.cursorMarginP);

    const newIdz = myState.makeIdz(x - this.geo.x0 - m, y - this.geo.y0 - m, this.idz());
    hCtx.setIdz(newIdz);
    hsm.setCursor(newIdz);
    await myState.dragStart(); // Will create dragCtx
  }

  async insertNote(x, y) {
    console.log(`[Cfolio.dragStartP] Inserting note x:${x.toFixed()}`);
    const id = "N" + hsm.newSernum();
    const w = hsm.settings.noteMinWidth;
    const h = hsm.settings.noteMinHeight;
    const noteOptions = {
      id: id,
      name: "Note " + id,
      color: "blue",
      geo: {
        x0: x - this.geo.x0,
        y0: y - this.geo.y0,
        width: w,
        height: h,
      },
      text: "Text",
      justCreated: true,
    };
    setDragOffset([w, h]);
    const myNote = await this.addNote(noteOptions);
    console.log(`[Cfolio.insertNote] New note id:${myNote?.id}`);
    await myNote.onLoaded();
    hsm.draw();
    modeRef.value = "";
    const m = U.pToMmL(hsm.settings.cursorMarginP);
    const newIdz = myNote.makeIdz(x - this.geo.x0 - m, y - this.geo.y0 - m, this.idz());
    hCtx.setIdz(newIdz);
    hsm.setCursor(newIdz);
    await myNote.dragStart(); // Will create dragCtx
  }

  async dragStart() {
    const idz = this.idz();
    const [x, y] = [idz.x, idz.y];
    // console.log(`[Cfolio.dragStart] idz:${JSON.stringify(idz)}`);
    switch (modeRef.value) {
      case "inserting-state": {
        this.insertState(x, y);
        return;
      }
      case "inserting-note": {
        await this.insertNote(x, y);
        return;
      }
      default:
        modeRef.value = "";
    }
    hCtx.setDragCtx({ id: this.id, x0: this.geo.x0, y0: this.geo.y0, type: "M" });
  }

  drag(dx, dy) {
    // console.log(`[Cfolio.dragP] dx:${dx} dy:${dy}`);
    const dragCtx = hCtx.getDragCtx();
    const [x0, y0] = [dragCtx.x0, dragCtx.y0];
    this.geo.x0 = x0 + dx;
    this.geo.y0 = y0 + dy;
    // console.log(`[Cfolio.drag] (${this.id}) id:${idz.id} zone:${idz.zone}`);
  }

  dragEnd(dx, dy) {
    // console.log(`[Cfolio.dragEnd]`);
    this.drag(dx, dy);
    return true;
  }

  raiseChildR(id) {
    super.raiseChildR(id);
    hsm.draw();
  }

  adjustChange(changedId) {
    for (let child of this.children) {
      child.adjustChange(changedId);
    }
    for (let tr of this.trs) {
      tr.adjustChange(changedId);
    }
  }

  updateNotes() {
    // console.log(`[Cfolio.updateNotes] `);
    for (let note of hCtx.folio.notes) {
      note.deleteCanvas();
    }
    for (let child of hCtx.folio.children) {
      child.updateNotes();
    }
    for (let tr of hCtx.folio.trs) {
      tr.updateNotes();
    }
    hsm.draw2();
  }

  async wheelP(xP, yP, dyP) {
    const [x, y] = this.pToMmXY(xP, yP);
    const deltas = -dyP / hsm.settings.deltaMouseWheel;
    let scale = this.geo.scale + deltas * hsm.settings.deltaScale;
    if (scale >= 1.5) scale += deltas * hsm.settings.deltaScale;
    scale = Math.min(Math.max(0.1, scale), 5);
    // console.log(`[Cfolio.wheelP] scale:${scale}`);
    const rScale = scale / this.geo.scale;
    this.geo.scale = scale;
    const x0 = (this.geo.x0 - (rScale - 1) * x) / rScale;
    const y0 = (this.geo.y0 - (rScale - 1) * y) / rScale;
    this.geo.x0 = x0;
    this.geo.y0 = y0;
    deferredNotesUpdate();
    hsm.draw2();
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm of mousePos in this.geo.[x0,y0] frame
    const m = U.pToMmL(hsm.settings.cursorMarginP);
    if (x < this.geo.x0 || y < this.geo.y0) return idz;
    if (x < this.geo.x0 || y < this.geo.y0) return idz;
    idz = { id: this.id, zone: "M", x: x, y: y };
    for (let note of this.notes) {
      idz = note.makeIdz(x - this.geo.x0, y - this.geo.y0, idz);
    }
    for (let child of this.children) {
      idz = child.makeIdz(x - this.geo.x0, y - this.geo.y0, idz);
    }
    // console.log(`[Cfolio.makeIdz] S id:${idz.id} zone:${idz.zone}`);
    let bestTIdz = { dist2P: Number.MAX_VALUE };
    for (let tr of this.trs) {
      const tIdz = tr.makeIdz(x, y, idz);
      if (tIdz.dist2P <= bestTIdz.dist2P) bestTIdz = tIdz;
      // if (tr.id == "T9") console.log(`[Cfolio.makeIdz]  (${tIdz.id}) dist2P:${tIdz.dist2P.toFixed()} zone:${tIdz.zone} type:${tIdz.type}`);
    }
    if (bestTIdz.dist2P < hsm.settings.cursorMarginP) {
      idz = bestTIdz;
    }
    // console.log(`[Cfolio.makeIdz] T id:${bestTIdz.id} dist2P:${bestTIdz.dist2P.toFixed()} zone:${bestTIdz.zone} type:${bestTIdz.type}`);
    return idz;
  }

  canInsertState(idz) {
    // console.log(`[Cfolio.canInsertState] (${this.id}) idz.x:${idz.x}`);
    const m = hsm.settings.minDistanceMm;
    const h = hsm.settings.stateMinHeight + m;
    const w = hsm.settings.stateMinWidth + m;
    const [x0, y0] = [idz.x - this.geo.x0, idz.y - this.geo.y0];
    if (x0 < w || x0 >= this.geo.width - m) return false;
    if (y0 < h || y0 >= this.geo.height - m) return false;
    for (let child of this.children) {
      let geo = { x0: idz.x - w, y0: idz.y - this.geo.y0 - h, width: w, height: h };
      // console.log(`[Cfolio.canInsertState] (${this.id}) gCId:${child.id}`);
      if (U.rectsIntersect(child.geo, geo)) return false;
    }
    return true;
  }

  canInsertNote(idz) {
    if (idz.zone != "M") return false;
    const m = hsm.settings.minDistanceMm;
    const h = hsm.settings.noteMinHeight + m;
    const w = hsm.settings.noteMinWidth + m;
    const t = hsm.settings.stateTitleHeightMm;
    // console.log(`[Cfolio.canInsertNote] (${this.id}) idz.y:${idz.y}`);
    const [x0, y0] = [idz.x - this.geo.x0, idz.y - this.geo.y0];
    if (x0 < m || x0 >= this.geo.width - w - m) return false;
    if (y0 < t + m || y0 >= this.geo.height - h - m) return false;
    return true;
  }
}
