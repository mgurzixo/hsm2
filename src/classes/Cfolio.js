"use strict";

import * as U from "src/lib/utils";
import * as V from "vue";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { CbaseRegion } from "src/classes/Cregion";
import { Cstate } from "src/classes/Cstate";
import { Ctr } from "src/classes/Ctr";
import { Cnote } from "src/classes/Cnote";
import { setDragOffset } from "src/lib/rootElemListeners";

let noteTo;
const mmInPx = 0.378;

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
    this.trs = [];
    this.notes = [];
    this.myOldScale = 0;
    this.myElem.innerHTML = "<h1>HelloWorldHelloWorldHelloWorld</h1>";
    this.myElem.style.transformOrigin = `top left`;
    this.myElem.style.overflow = `hidden`;
    this.prevTransform = { scale: 1, x0S: 0, y0S: 0 };
    // this.parent.myElem.style.transform = "scale(0.2)";
    // console.log(`[Cfolio.constructor] myElem:${this.myElem}`);
  }

  async wheelP(xS, yS, dyS) {
    const deltas = -dyS / hsm.settings.deltaMouseWheel;
    const s0 = this.geo.scale;
    let s1 = s0 + deltas * hsm.settings.deltaScale;
    if (s1 >= 1.5) s1 += deltas * hsm.settings.deltaScale;
    s1 = Math.min(Math.max(0.1, s1), 5);
    const k = s1 / s0;

    // Compute the new translation to keep (xP, yP) fixed in screen coords
    const t = this.prevTransform;
    // The translation part of a homothetic transform at (xP, yP):
    // [s1 0 0 s1 tx ty] where
    // tx = (1 - k) * xP + k * t.x0S
    // ty = (1 - k) * yP + k * t.y0S
    const txP = (1 - k) * xS + k * t.x0S;
    const tyP = (1 - k) * yS + k * t.y0S;

    this.myElem.style.transform = `matrix(${s1},0,0,${s1},${txP},${tyP})`;
    this.prevTransform = { x0S: txP, y0S: tyP };
    this.geo.scale = s1;
    hsm.draw();
  }

  draw(dCtx) {
    // console.log(`[Cfolio.draw] Drawing ${this.id} this.geo.xx0:${this.geo.xx0} dCtx.xx0: ${dCtx.xx0} ----------------------`);
    const s = this.myElem.style;
    const g = this.geo;
    const l = this.scale;
    this.myElem.style.border = `solid 1px red`;
    // this.myElem.style.transform = `scale(${this.geo.scale})`;
    g.xx0 = dCtx.xx0 + g.x0;
    g.yy0 = dCtx.yy0 + g.y0;
    s.top = g.y0 + "mm";
    s.left = g.x0 + "mm";
    s.width = g.width + "mm";
    s.height = g.height + "mm";
    s.background = hsm.settings.styles.folioBackground;
  }

  // async wheelP(x, y, dyP) {
  //   const deltas = -dyP / hsm.settings.deltaMouseWheel;
  //   const s0 = this.geo.scale;
  //   const x0 = this.geo.x0;
  //   const y0 = this.geo.y0;
  //   let s1 = s0 + deltas * hsm.settings.deltaScale;
  //   if (s1 >= 1.5) s1 += deltas * hsm.settings.deltaScale;
  //   s1 = Math.min(Math.max(0.1, s1), 5);
  //   const k = s1 / s0;
  //   const r = s0 / s1;
  //   this.geo.x0 = r * x0;
  //   console.log(`[Cfolio.wheelP] x0:${x0.toFixed(2)} x:${x.toFixed(2)} xx0:${this.geo.xx0.toFixed(2)} s1:${s1.toFixed(2)} k:${k.toFixed(2)} res:${this.geo.x0.toFixed(2)}`);
  //   this.geo.y0 = y0 + ((k - 1) * y) / k;
  //   // this.geo.x0 = (this.geo.x0 - (rScale - 1) * x) / rScale;
  //   // this.geo.y0 = (this.geo.y0 - (r - 1) * y) / r;
  //   // const r = (1 - (scale / this.geo.scale));
  //   // this.geo.x0 += x * r;
  //   // this.geo.y0 += y * r;
  //   this.geo.scale = s1;
  //   deferredNotesUpdate();
  //   hsm.draw();
  // }

  // oldDraw() {
  //   // console.log(`[Cfolio.draw] Drawing ${ this.id } ----------------------`);
  //   this.drawFolioBackground();
  //   this.geo.xx0 = this.geo.x0;
  //   this.geo.yy0 = this.geo.y0;
  //   // console.log(`[Cfolio.draw] Drawing ${ this.id } y0: ${ this.geo.y0 } geo.yy0: ${ this.geo.yy0 }`);
  //   for (let note of this.notes) {
  //     note.draw(this.geo.xx0, this.geo.yy0);
  //   }
  //   for (let child of this.children) {
  //     child.draw(this.geo.xx0, this.geo.yy0);
  //   }
  //   for (let tr of this.trs) {
  //     tr.draw(0, 0);
  //   }
  // }

  makeIdz(x, y, idz) {
    // console.warn(`[Cfolio.makeIdz] [xP:${xP?.toFixed()}, yP: ${yP?.toFixed()}] xx0:${this.geo.xx0}`);
    // [x,y] in mm of mousePos in this.geo.[x0,y0] frame
    // console.warn(`[Cfolio.makeIdz][x: ${x.toFixed()}, y: ${y.toFixed()}]`);
    if (x < this.geo.x0 || y < this.geo.y0) return idz;
    if (x < this.geo.x0 || y < this.geo.y0) return idz;
    idz = { id: this.id, zone: "M", x: x, y: y };
    // // TODO xP
    // for (let note of this.notes) {
    //   idz = note.makeIdz(x - this.geo.x0, y - this.geo.y0, idz);
    // }
    // for (let child of this.children) {
    //   idz = child.makeIdz(x - this.geo.x0, y - this.geo.y0, idz);
    // }
    // // console.log(`[Cfolio.makeIdz] S id: ${ idz.id; } zone: ${ idz.zone; } `);
    // let bestTIdz = { dist2P: Number.MAX_VALUE };
    // for (let tr of this.trs) {
    //   const tIdz = tr.makeIdz(x, y, idz);
    //   if (tIdz.dist2P <= bestTIdz.dist2P) bestTIdz = tIdz;
    //   // if (tr.id == "T9") console.log(`[Cfolio.makeIdz](${ tIdz.id }) dist2P: ${ tIdz.dist2P.toFixed(); } zone: ${ tIdz.zone; } type: ${ tIdz.type; } `);
    // }
    // if (bestTIdz.dist2P < hsm.settings.cursorMarginP) {
    //   idz = bestTIdz;
    // }
    // // console.log(`[Cfolio.makeIdz] T id: ${ bestTIdz.id; } dist2P: ${ bestTIdz.dist2P.toFixed(); } zone: ${ bestTIdz.zone; } type: ${ bestTIdz.type; } `);
    return idz;
  }

  setSelected(val) {
    // console.log(`[Chsm.setSelected](${ this.id }) } setSelected: ${ val; } `);
    super.setSelected(val);
    for (let note of this.notes) {
      note.setSelected(val);
    }
  }

  async addNote(noteOptions) {
    return; // ICI
    // console.log(`[Cfolio.addNote] noteOptions:${ JSON.stringify(noteOptions); } `);
    const myNote = new Cnote(this, noteOptions, "N");
    await myNote.load(noteOptions);
    this.notes.push(myNote);
    // console.log(`[Cfolio.addNote] id:${ myNote.id; } `);
    return myNote;
  }

  async addTr(trOptions) {
    return; // ICI
    const myTr = new Ctr(this, trOptions, "T");
    this.trs.push(myTr);
    await myTr.load(trOptions);
    return myTr;
  }

  async load(folioOptions) {
    // console.log(`[Cfolio.load] xx0:${this.geo.xx0}`);
    return; // ICI
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
    // console.log(`[Cfolio.onLoaded] xx0:${this.geo.xx0}`);
    return; // ICI
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

  // drawFolioBackground() {
  //   cCtx.fillStyle = hsm.settings.styles.folioBackground;
  //   cCtx.beginPath();
  //   const s = this.scalePhy();
  //   cCtx.rect(
  //     Math.round(this.geo.x0 * s) + 0.5,
  //     Math.round(this.geo.y0 * s) + 0.5,
  //     Math.round(this.geo.width * s) + 0.5,
  //     Math.round(this.geo.height * s) + 0.5,
  //   );
  //   cCtx.fill();
  // }

  async insertState(x, y) {
    return; // ICI
    // console.log(`[Cfolio.insertState] Inserting state x:${ x.toFixed(); } `);
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
      parentElem: this.myElem,
    };
    const myState = new Cstate(this, stateOptions, "S");
    // console.log(`[Cfolio.insertState] New state id:${ myState?.id; } `);
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
    console.log(`[Cfolio.insertNote] New note id:${myNote?.id} `);
    await myNote.onLoaded();
    hsm.draw();
    modeRef.value = "";
    const m = U.pToMmL(hsm.settings.cursorMarginP);
    const newIdz = myNote.makeIdz(x - this.geo.x0 - m, y - this.geo.y0 - m, this.idz());
    hCtx.setIdz(newIdz);
    hsm.setCursor(newIdz);
    await myNote.dragStart(); // Will create dragCtx
  }

  async dragStart(xS, yS) {
    const idz = this.idz();
    // const [x, y] = [idz.x, idz.y];
    const [x, y] = [U.pxToMm(xS), U.pxToMm(yS)];
    // console.log(`[Cfolio.dragStart] idz:${ JSON.stringify(idz)} `);
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
    console.log(`[Cfolio.dragStart] matrix:${this.myElem.style.transform} `);
  }

  drag(dxS, dyS) {
    // dxS, dyS are in screen (pixel) space
    const t = this.prevTransform;
    const s = this.geo.scale;
    // Only update DOM transform for visual feedback
    const newX0S = t.x0S + dxS;
    const newY0S = t.y0S + dyS;
    this.myElem.style.transform = `matrix(${s},0,0,${s},${newX0S},${newY0S})`;
  }

  dragEnd(dxS, dyS) {
    // On drag end, commit the translation to geo.x0/y0 and reset DOM transform
    const t = this.prevTransform;
    const s = this.geo.scale;
    // Commit logical translation in mm (screen delta divided by scale)
    this.geo.x0 += U.pxToMm(dxS) / s;
    this.geo.y0 += U.pxToMm(dyS) / s;
    // Reset DOM transform to new base (no translation, just scale)
    this.myElem.style.transform = `matrix(${s},0,0,${s},0,0)`;
    this.prevTransform = { ...t, x0S: 0, y0S: 0 };
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
    // console.log(`[Cfolio.updateNotes]`);
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

  canInsertState(idz) {
    // console.log(`[Cfolio.canInsertState](${ this.id }) idz.x:${ idz.x; } `);
    const m = hsm.settings.minDistanceMm;
    const h = hsm.settings.stateMinHeight + m;
    const w = hsm.settings.stateMinWidth + m;
    const [x0, y0] = [idz.x - this.geo.x0, idz.y - this.geo.y0];
    if (x0 < w || x0 >= this.geo.width - m) return false;
    if (y0 < h || y0 >= this.geo.height - m) return false;
    for (let child of this.children) {
      let geo = { x0: idz.x - w, y0: idz.y - this.geo.y0 - h, width: w, height: h };
      // console.log(`[Cfolio.canInsertState](${ this.id }) gCId:${ child.id; } `);
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
    // console.log(`[Cfolio.canInsertNote](${ this.id }) idz.y:${ idz.y; } `);
    const [x0, y0] = [idz.x - this.geo.x0, idz.y - this.geo.y0];
    if (x0 < m || x0 >= this.geo.width - w - m) return false;
    if (y0 < t + m || y0 >= this.geo.height - h - m) return false;
    return true;
  }
};;;
