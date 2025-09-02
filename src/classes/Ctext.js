"use strict";

import * as U from "src/lib/utils";
import { R, RR } from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { textStyles } from "src/lib/styles";
import NoteDialog from "src/components/NoteDialog.vue";
import { fromString, inverse, toCSS, compose, transform, applyToPoint } from 'transformation-matrix';

export class Ctext extends CbaseElem {
  serialise() {
    const obj = super.serialise();
    obj.text = this.text;
    obj.togetherSelected = this.togetherSelected;
    obj.styles = this.styles;
    obj.font = this.font;
    obj.scale = this.scale;
    obj.widthAuto = this.widthAuto;
    obj.visibility = this.visibility;
    return obj;
  }
  constructor(parent, textOptions, type = "X") {
    super(parent, textOptions, type);
    // console.log(`[Cnote] New note id:${this.id} parent:${this.parent.id} ${textOptions.container?.id}`);
    // console.log(`[Cnote] New note id:${this.id} textOptions:${JSON.stringify(textOptions)}`);
    // this.container = textOptions?.container ? textOptions.container : parent;
    this.togetherSelected = textOptions?.togetherSelected;
    // console.log(`[Ctext.constructor] (${this.id}) text:${textOptions.text}`);
    // console.log(`[Ctext.constructor] textOptions:${textOptions}`);
    const g = this.geo;
    this.geo.mat = { a: 1, b: 0, c: 0, d: 1, e: g.x0 * U.pxPerMm, f: g.y0 * U.pxPerMm };
    g.width = textOptions.geo.width || 20;
    g.height = hsm.settings.styles.text.sizeMm + 2 * (hsm.settings.styles.text.marginVMm);
    this.styles = textOptions.tagStyle ? textOptions.tagStyle : textStyles(this.color || hsm.settings.styles.defaultColor);
    this.setGeoFromMat();
    this.setFont(textOptions?.font || hsm.settings.styles.text.defaultFont);
    this.setScale(textOptions?.scale || 1);
    this.text = textOptions?.text || "";
    this.widthAuto = textOptions?.widthAuto || true;
    this.container = textOptions.container || this.parent;
    this.visibility = textOptions.visibility || true;

    this.setGeometry();
    const s = this.myElem.style;
    s.textOverflow = "ellipsis";
    s.overflow = "hidden";
    s.whiteSpace = "nowrap";
  }

  async onLoaded(options) {
    // console.log(`[Ctext.onLoaded] (${this.id}) text:${this.text}`);
    await this.setText(this.text);
  }

  setContainer(container) {
    // console.log(`[Ctext.setContainer] (${this.id}) container:${container?.id}`);
    this.container = container;
  }

  setGeometry() {
    // console.log(`[Ctext.setGeometry]`);
    const s = this.myElem.style;
    const g = this.geo;
    s.top = "0px";
    s.left = "0px";
    if (this.widthAuto) s.width = "auto";
    else s.width = g.width + "mm";
    s.height = g.height + "mm";
    this.paint();
  }

  setGeoFromMat(mat = this.geo.mat) {
    this.geo.mat = mat;
    const matR = inverse(mat);
    this.geo.matR = matR;
    this.geo.x0 = mat.e / U.pxPerMm;
    this.geo.y0 = mat.f / U.pxPerMm;
    this.myElem.style.transform = toCSS(this.geo.mat);
    // console.log(`[Ctext.setGeoFromMat] (${this.id}) geo:${this.geo} mat:${JSON.stringify(mat)}`);
  }

  setScale(scale) {
    this.scale = scale;
  }

  async setText(text) {
    this.text = text;
    this.paint();
  }

  setFont(font) {
    this.font = font;
  }

  setVisibility(visibility) {
    this.visibility = visibility;
    this.paint();
  }

  paint() {
    function rgbToRgba(rgb, opacity) {
      if (!rgb) return rgb;
      const rgba = rgb.replace(")", ` /${opacity})`);
      // console.log(`[Ctext.rgbToRgba] rgb:"${rgb}" rgba:"${rgba}"`);
      return rgba;
    }
    // console.log(`[Ctext.paint] text:"${this.text}"`);
    const s = this.myElem.style;
    const g = this.geo;
    const styles = this.styles == "parentStyle" ? this.parent.styles : this.styles;
    if (!this.visibility) s.visibility = "hidden";
    else s.visibility = "visible";
    // console.log(`[Ctext.paint] (${this.id}) (${this.styles} parent:${this.parent.id})  styles:${JSON.stringify(styles)}`);
    // console.log(`[Ctext.paint] (${this.id}) (${this.styles} parent:${this.parent.id})  styles:${JSON.stringify(styles)}`);
    let lw = styles?.tagBorderWidth;
    let ss = styles?.tagBorderColor;
    if (this.isSelected || this.id == hCtx.selectedId || (this.togetherSelected && this.parent.id == hCtx.selectedId)) {
      lw = styles?.tagBorderSelectedWidth;
      ss = styles?.tagBorderSelectedColor;
    }
    // console.log(`[Ctext.paint] (${this.id}) lw:${lw} ss:${ss} tagTextFont:${styles?.tagTextFont}`);
    const sz = this.scale * styles?.tagTextSize;
    s.font = `${sz}mm ${styles?.tagTextFont}`;
    s.color = `${styles?.tagTextColor}`;
    if (this.widthAuto) s.width = "auto";
    else s.width = g.width + "mm";
    g.height = sz * 1.5;
    s.height = `${g.height}mm`;
    s.backgroundColor = styles?.tagBgOpacity ? rgbToRgba(styles?.tagBg, styles?.tagBgOpacity) : styles?.tagBg;
    // console.log(`[Ctext.paint] (${this.id}) s.width:${s.width} s.height:${s.height} s.font:${s.font}`);
    s.paddingTop = `${sz * 0.1 + "mm"}`;
    s.paddingLeft = `${sz * 0.2 + "mm"}`;
    s.paddingRight = `${sz * 0.2 + "mm"}`;
    this.myElem.innerHTML = this.text;
    if (hsm.isPrinting) {
      s.border = `solid ${lw + "px"} ${ss}`;
    }
    else s.border = `solid ${lw + "px"} ${ss}`;
    s.transform = toCSS(g.mat);
  }

  rePaint() {
    this.paint();
  }

  setSelected(val) {
    this.isSelected = val;
    // console.log(`[Ctext.dragStart] (${this.id}) togetherSelected:${this.togetherSelected}`);
    super.setSelected(val);
    if (val) this.raise();
    this.paint();
    if (this.togetherSelected) {
      if (this.parent.isSelected != val) this.parent.setSelected(val);
    }
  }

  openDialog() {
    hsm.setSelected(this.id);
    if (this.togetherSelected) this.parent.openDialog();
    else hsm.openDialog(NoteDialog, this);
  }

  async dragStart(xP, yP) {
    const idz = this.idz();
    const [x, y] = [U.pxToMm(xP), U.pxToMm(yP)];
    hsm.setSelected(this.id);

    const s0 = hCtx.folio.geo.mat.a;
    const container = this.container ? this.container : this.parent;
    const bb = this.myElem.getBoundingClientRect();
    const bbCt = container.myElem.getBoundingClientRect();
    let xCt, yCt; // Coord of my origin in mm in container frame
    [xCt, yCt] = [bb.left - bbCt.left, bb.top - bbCt.top];
    [xCt, yCt] = [xCt / U.pxPerMm / s0, yCt / U.pxPerMm / s0];

    const dragCtx = {
      id: this.id,
      x0: this.geo.x0,
      y0: this.geo.y0,
      xCt: xCt,
      yCt: yCt,
      width: bb.width / U.pxPerMm / s0,
      height: bb.height / U.pxPerMm / s0,
      mat: { ...this.geo.mat },
    };
    hCtx.setDragCtx(dragCtx);
    this.raise();
    return this;
  }

  drag(dxP, dyP) {
    const idz = this.idz();
    // console.log(`[Ctext.drag] (${this.id}) idz:${JSON.stringify(idz)} `);
    const s0 = hCtx.folio.geo.mat.a;
    const n = hsm.settings.styles.note;
    let [dx, dy] = [dxP / U.pxPerMm / s0, dyP / U.pxPerMm / s0];
    let [de, df] = [0, 0];
    const d = hCtx.getDragCtx();
    const m = hsm.settings.minDistanceMm;
    let x0 = d.x0;
    let y0 = d.y0;
    let width = d.width;
    let height = d.height;
    const zone = idz.zone.toString(); // Can be numeric
    const container = this.container;
    // console.log(`[Ctext.drag] (${this.id}) this.container:${this.container?.id}`);
    // console.log(`[Ctext.drag] (${this.id}) (x0:${x0.toFixed()} y0:${y0.toFixed()}) (xCt:${d.xCt.toFixed()} yCt:${d.yCt.toFixed()})`);
    if (zone == "M") {
      if (d.xCt + dx < m) dx = m - d.xCt;
      if (d.xCt + width + dx > container.geo.width - m) dx = container.geo.width - m - d.xCt - width;
      if (d.yCt + dy < m) dy = m - d.yCt;
      if (d.yCt + height + dy > container.geo.height - m) dy = container.geo.height - m - d.yCt - height;

      // if (x0 + xCt + dx + width > container.geo.width - m) dx = container.geo.width - m - x0 - xCt - width;
      // if (y0 + yCt + dy < m) dy = m - y0 - yCt;
      // if (y0 + yCt + dy + height > container.geo.height - m) dy = container.geo.height - m - y0 - yCt - height;
      x0 = d.x0 + dx;
      y0 = d.y0 + dy;
      [de, df] = [dx * U.pxPerMm, dy * U.pxPerMm];
    } else if (zone == "R") {
      if (width + dx < n.noteMinWidth) dx = n.noteMinWidth - width;
      if (x0 + d.xCt + width + dx > container.geo.width - m)
        dx = container.geo.width - width - x0 - d.xCt - m;
      width += dx;
    }
    this.geo.x0 = x0;
    this.geo.y0 = y0;
    this.geo.height = height;
    this.geo.width = width;
    const mat = {};
    Object.assign(mat, this.geo.mat);
    mat.e = d.mat.e + de;
    mat.f = d.mat.f + df;
    this.setGeoFromMat(mat);
    this.setGeometry();
  }

  dragEnd(dxP, dyP) {
    this.drag(dxP, dyP);
    hCtx.dragEnd();
    return true;
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm of mousePos in this.geo.[x0,y0] frame
    // console.log(`[Ctext.makeIdz] (${this.id}) x:${x} y:${y} curId:${idz.id}`);
    const m = (hsm.settings.cursorMarginP / U.pxPerMm) / hCtx.folio.geo.scale;
    const r = hsm.settings.noteCornerP;
    if (
      x < - m ||
      x > this.geo.width + m ||
      y < - m ||
      y > this.geo.height + m
    )
      return idz;

    // console.log(`[Ctext.makeIdz] (${this.id}) In note x:${x} y:${y} curId:${idz.id}`);
    let id = this.id;
    let zone = "M";
    // console.log(`[Ctext.makeIdz] (${this.id}) id:${id} m:${m.toFixed(1)} zone:${zone} (x:${x.toFixed(1)} y:${y.toFixed(1)}) ${this.geo.height}`);
    if (!this.widthAuto) if (x >= this.geo.width - m) zone = "R";
    idz = { id: id, zone: zone, x: x, y: y, dist2: 0 };
    // console.log(`[Ctext.makeIdz] idz:${JSON.stringify(idz)}`);
    return idz;
  }

  makeIdzInParentCoordinates(xp, yp, myIdz) {
    const ps = this.myElem.parentElement.style;
    let xCtP = parseFloat(ps.left);
    let yCtP = parseFloat(ps.top);
    if (isNaN(xCtP)) xCtP = 0;
    if (isNaN(yCtP)) yCtP = 0;
    [xp, yp] = [xp * U.pxPerMm, yp * U.pxPerMm];
    [xp, yp] = [xp - xCtP, yp - yCtP];
    let [x, y] = applyToPoint(this.geo.matR, [xp, yp]);
    [x, y] = [x / U.pxPerMm, y / U.pxPerMm];
    // if (this.id == "X29") console.log(`[Ctext.makeIdzInParentCoordinates](${this.id}(${this.parent.id})) xp:${xp.toFixed()} x:${x.toFixed()} f:${this.geo.mat.e.toFixed()} px:${this.myElem.parentElement.style.left}`);
    const idz = this.makeIdz(x, y, myIdz);
    return idz;
  }
}
