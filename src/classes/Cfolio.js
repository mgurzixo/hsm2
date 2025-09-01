"use strict";

import * as U from "src/lib/utils";
import * as V from "vue";
import { hsm, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { CregionWithStates } from "src/classes/Cregion";
import { Ctr } from "src/classes/Ctr";
import { fromString, applyToPoint, inverse, toCSS, compose } from 'transformation-matrix';
import FolioDialog from "src/components/FolioDialog.vue";

export class Cfolio extends CregionWithStates {
  constructor(parent, folioOptions) {
    super(parent, folioOptions, "F");
    this.trs = [];
    this.myElem.style.overflow = `hidden`;
    // console.log(`[Cfolio.constructor] (${this.id}) myElem:${this.myElem}`);
    this.setFolioDisplay(false);
    // Set initial values
    this.trElem = document.createElement("div");
    this.trElem.id = "trElem_" + this.id;
    this.myElem.append(this.trElem);
    if (folioOptions.trs)
      for (let trOptions of folioOptions.trs) {
        this.addTr(trOptions);
      }
  }

  async onLoaded() {
    // console.log(`[Cfolio.onLoaded] (${this.id}) this.children:"${this.children}"`);
    await super.onLoaded();
    for (let tr of this.trs) {
      await tr.onLoaded();
    }
  }

  destroy() {
    super.destroy();
    // console.log(`[Cfolio.destroy]`);
    this.trElem.remove();
  }

  setFolioDisplay(isActive) {
    if (isActive) this.myElem.style.display = "block";
    else this.myElem.style.display = "none";
  }

  setSelected(val) {
    super.setSelected(val);
    for (let tr of this.trs) {
      tr.setSelected(val);
    }
  }

  raiseStates() {
    super.raiseStates();
    this.myElem.append(this.trElem);
  }

  raiseJunctions() {
    super.raiseJunctions();
    this.myElem.append(this.trElem);
  }

  adjustTrAnchors(changedId) {
    // console.log(`[Cfolio.adjustTrAnchors] id:${this.id}
    for (let tr of this.trs) {
      // if (tr.from.id == changedId || tr.to.id == changedId) {
      // TODO only adjust for state and its descendants
      // tr.adjustTrAnchors(changedId);
      tr.adjustTrAnchors();
      tr.paint();
      // }
    }
  }

  setMat(mat) {
    this.geo.mat = mat;
    this.geo.scale = mat.a;
    const matR = inverse(mat);
    this.geo.matR = matR;
    this.myElem.style.transform = toCSS(this.geo.mat);
    // console.log(`[Cfolio.setMat] (${this.id}) geo:${this.geo} mat:${JSON.stringify(mat)}`);
  }

  setGeometry() {
    // console.log(`[Cfolio.setGeometry]`);
    const s = this.myElem.style;
    const g = this.geo;
    s.top = "0px";
    s.left = "0px";
    s.width = g.width + "mm";
    s.height = g.height + "mm";
    s.background = hsm.settings.styles.folioBackground;
  }

  paintTrs() {
    for (let tr of this.trs) {
      tr.paint();
    }
  }

  rePaint() {
    // this.setGeometry();
    super.rePaint();
    this.paintTrs();
  }

  setPrinting(val) {
    if (val) {
      this.savedMat = this.geo.mat;
      this.setMat({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
    }
    else {
      this.setMat(this.savedMat);
    }
    this.geo.scale = this.geo.mat.a;
    this.rePaint();
  }

  wheelP(xP, yP, dyP) {
    const deltas = -dyP / hsm.settings.deltaMouseWheel;
    const mat0 = fromString(getComputedStyle(this.myElem).transform);
    const s0 = mat0.a;
    let s1 = s0 + deltas * hsm.settings.deltaScale;
    if (s1 >= 1.5) s1 += deltas * hsm.settings.deltaScale;
    s1 = Math.min(Math.max(0.1, s1), 5);
    const k = s1 / s0;
    // Compute the new translation to keep (xP, yP) fixed in screen coords
    // const t = this.prevTransform;
    // The translation part of a homothetic transform at (xP, yP):
    // [s1 0 0 s1 tx ty] where
    // tx = (1 - k) * xP + k * t.xT
    // ty = (1 - k) * yP + k * t.yT
    const matW = { a: k, b: 0, c: 0, d: k, e: xP * (1 - k), f: yP * (1 - k) };
    // console.log(`[Cfolio.wheelP] k:${k} xP :${xS} dxP:${dxP}`);
    const mat1 = compose(matW, mat0);
    this.geo.scale = mat1.a;
    // console.log(`[Cfolio.wheelP] (${this.id}) scale:${this.geo.scale.toFixed(2)} `);
    this.setMat(mat1);
    this.paintTrs();
  }

  addTr(trOptions) {
    // Cf. https://stackoverflow.com/questions/57769851/how-do-i-set-the-size-of-an-svg-element-using-javascript
    // const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const trEl = document.createElement("div");
    this.trElem.append(trEl);
    trOptions.myElem = trEl;
    const myTr = new Ctr(this, trOptions, "T");
    this.trs.push(myTr);
    // console.log(`[Cfolio.addTr] new tr:${myTr.id}`);
    return myTr;
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm in this.geo.[x0,y0] frame
    const m = U.pxToMm(hsm.settings.cursorMarginP);
    // console.log(`[Cfolio.makeIdz][x: ${x.toFixed()}, y: ${y.toFixed()}]`);
    // const g = this.geo;
    // if (x < 0 || y < 0) return idz;
    // if (x > g.width || y > g.height) return idz;
    // idz = { id: this.id, zone: "M", x: x, y: y };
    // for (let note of this.notes) {
    //   idz = note.makeIdzInParentCoordinates(x, y, idz);
    // }
    // for (let junction of this.junctions) {
    //   idz = junction.makeIdzInParentCoordinates(x, y, idz);
    // }
    // for (let child of this.children) {
    //   idz = child.makeIdzInParentCoordinates(x, y, idz);
    // }
    idz = super.makeIdz(x, y, idz);
    let bestTIdz = { dist2: Number.MAX_VALUE };
    for (let tr of this.trs) {
      const tIdz = tr.makeIdzInParentCoordinates(x, y, idz);
      if (tIdz.dist2 <= bestTIdz.dist2) {
        bestTIdz = tIdz;
      }
    }
    if (bestTIdz.dist2 < m) {
      idz = bestTIdz;
    }
    // console.log(`[Cfolio.makeIdz] T id: ${bestTIdz.id} dist2: ${bestTIdz.dist2.toFixed()} zone: ${bestTIdz.zone} type: ${bestTIdz.type} `);
    return idz;
  }

  makeIdzInParentCoordinates(xp, yp, myIdz) {
    [xp, yp] = [xp * U.pxPerMm, yp * U.pxPerMm];
    let [x, y] = applyToPoint(this.geo.matR, [xp, yp]);
    [x, y] = [x / U.pxPerMm, y / U.pxPerMm];
    const idz = this.makeIdz(x, y, myIdz);
    return idz;
  }

  openDialog() {
    hsm.openDialog(FolioDialog, this);
  }
}
