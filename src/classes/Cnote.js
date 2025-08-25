"use strict";

import * as U from "src/lib/utils";
import { R, RR } from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { noteStyles } from "src/lib/styles";
import { mdToCanvas } from "src/lib/md";
import NoteDialog from "src/components/NoteDialog.vue";
import { fromString, inverse, toCSS, compose, transform, applyToPoint } from 'transformation-matrix';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { unified } from 'unified';
import FolioDialog from "src/components/FolioDialog.vue";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm) // Support GFM (tables, autolinks, tasklists, strikethrough)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeKatex)
  .use(rehypeStringify);

export class Cnote extends CbaseElem {
  constructor(parent, noteOptions, type = "N") {
    super(parent, noteOptions, type);
    // console.log(`[Cnote] New note id:${this.id} parent:${this.parent.id} ${noteOptions.container?.id}`);
    this.container = noteOptions?.container ? noteOptions.container : parent;
    this.myElem.classList.add("markdown-body");
    this.togetherSelected = noteOptions?.togetherSelected;
    this.canvasScale = 0;
    this.mdHTML = "";
    // console.log(`[Cnote.constructor] (${this.id}) text:${noteOptions.text}`);
    // console.log(`[Cnote.constructor] noteOptions:${noteOptions}`);
    const g = this.geo;
    this.geo.mat = { a: 1, b: 0, c: 0, d: 1, e: g.x0 * U.pxPerMm, f: g.y0 * U.pxPerMm };
    this.styles = this.tagStyle ? this.tagStyle : noteStyles(this.color || hsm.settings.styles.defaultColor);
    this.setGeoFromMat();
    this.setFont(noteOptions?.font || hsm.settings.styles.note.defaultFont);
    this.setScale(noteOptions?.scale || 1);
    this.text = noteOptions?.text || "";
    this.setGeometry();
  }

  async onLoaded() {
    // console.log(`[Cnote.onLoaded] (${this.id}) text:${this.text}`);
    await this.setText(this.text);
    this.paint();
  }

  setGeometry() {
    // console.log(`[Cnote.setGeometry]`);
    const s = this.myElem.style;
    const g = this.geo;
    s.top = "0px";
    s.left = "0px";
    s.width = g.width + "mm";
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
    // console.log(`[Cnote.setGeoFromMat] (${this.id}) geo:${this.geo} mat:${JSON.stringify(mat)}`);
  }

  setScale(scale) {
    this.scale = scale;
  }

  async setText(text) {
    this.text = text;
    this.mdHTML = String(await processor.process(this.text));
  }

  setFont(font) {
    this.font = font;
  }

  paint() {
    // console.log(`[Cnote.paint] text:"${this.text}"`);
    const s = this.myElem.style;
    const g = this.geo;
    const styles = this.styles;
    let lw = styles.borderWidth;
    let ss = styles.borderColor;
    if (this.isSelected || this.id == hCtx.selectedId || (this.togetherSelected && this.parent.id == hCtx.selectedId)) {
      lw = styles.borderSelectedWidth;
      ss = styles.borderSelectedColor;
    }
    this.myElem.replaceChildren();
    s.fontSize = this.scale + "em";
    s.fontFamily = this.font;
    this.myElem.innerHTML = this.mdHTML;
    s.border = `solid ${lw + "px"} ${ss}`;
    s.transform = toCSS(g.mat);
  }

  setSelected(val) {
    this.isSelected = val;
    // console.log(`[Cnote.dragStart] (${this.id}) togetherSelected:${this.togetherSelected}`);
    super.setSelected(val);
    if (val) this.raise();
    this.paint();
    if (this.togetherSelected) {
      if (this.parent.isSelected != val) this.parent.setSelected(val);
    }
  }

  openDialog() {
    // if (this.togetherSelected) this.parent.openDialog();
    // else hsm.openDialog(NoteDialog, this);
    hsm.setSelected(this.id);
    hsm.openDialog(NoteDialog, this);
    // hsm.openDialog(FolioDialog, this);
  }


  dragStart(xP, yP) {
    const idz = this.idz();
    const [x, y] = [U.pxToMm(xP), U.pxToMm(yP)];
    hsm.setSelected(this.id);
    this.setDragOrigin();
    const dragCtx = {
      id: this.id,
      x0: this.geo.x0,
      y0: this.geo.y0,
      width: this.geo.width,
      height: this.geo.height,
      mat: { ...this.geo.mat },
    };
    hCtx.setDragCtx(dragCtx);
    this.raise();
    return this;
  }


  drag(dxP, dyP) {
    const idz = this.idz();
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
    const container = this.container ? this.container : this.parent;
    if (zone == "M") {
      if (x0 + dx < m) dx = m - x0;
      if (x0 + dx + width > container.geo.width - m) dx = container.geo.width - m - x0 - width;
      if (y0 + dy < m) dy = m - y0;
      if (y0 + dy + height > container.geo.height - m) dy = container.geo.height - m - y0 - height;
      x0 = d.x0 + dx;
      y0 = d.y0 + dy;
      [de, df] = [dx * U.pxPerMm, dy * U.pxPerMm];
    } else {
      if (zone.includes("T")) {
        if (height - dy < n.noteMinHeight) dy = height - n.noteMinHeight;
        if (y0 + dy < m) dy = m - y0;
        y0 += dy;
        height -= dy;
        df = dy * U.pxPerMm;
      } else if (zone.includes("B")) {
        if (height + dy < n.noteMinHeight) dy = n.noteMinHeight - height;
        if (y0 + height + dy > container.geo.height - m)
          dy = container.geo.height - height - y0 - m;
        height += dy;
      }
      if (zone.includes("L")) {
        if (width - dx < n.noteMinWidth) dx = width - n.noteMinWidth;
        if (x0 + dx < m) dx = m - x0;
        x0 += dx;
        width -= dx;
        de = dx * U.pxPerMm;
      } else if (zone.includes("R")) {
        if (width + dx < n.noteMinWidth) dx = n.noteMinWidth - width;
        if (x0 + width + dx > container.geo.width - m)
          dx = container.geo.width - width - x0 - m;
        width += dx;
      }
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

  checkOpenDialogAndEndDrag() {
    // console.log(`[Cnote.checkOpenDialogAndEndDrag] (${this.id}) justCreated:${this.justCreated}`);
    if (this.justCreated == true) {
      hsm.openDialog(NoteDialog, this);
      delete this.justCreated;
    }
    hCtx.dragEnd();
  }


  dragEnd(dxP, dyP) {
    this.drag(dxP, dyP);
    this.checkOpenDialogAndEndDrag();
    return true;
  }
  setDragOrigin() {
    let mat = {};
    Object.assign(mat, this.geo.mat);
    this.dragOrigin = { x0: this.geo.x0, y0: this.geo.y0, mat: mat };
  }

  makeCanvas(text) {
    // // console.warn(`[Cnote.makeCanvas] 0 (${this.id}) scale:${this.scale.toFixed(2)} geoScale:${hCtx.folio.geo.scale.toFixed(3)}`);
    // const canvasScale = this.scale * hCtx.folio.geo.scale;
    // const styles = noteStyles(this.color || hsm.settings.styles.defaultColor);

    // // console.log(`[Cnote.makeCanvas] (${this.id}) canvasScale:${canvasScale.toFixed(2)} text:${text}`);
    // this.canvas = mdToCanvas(this.text, canvasScale, styles.textColor, styles.bg);
    // this.canvasScale = canvasScale;
    // // console.log(`[Cnote.makeCanvas] 1 (${this.id}) canvas:${this.canvas}`);
  }

  deleteCanvas() {
    // // console.warn(`[Cnote.deleteCanvas] (${this.id})`);
    // delete this.canvas;
  }

  draw(xx0, yy0, text = this.text) {
    // if (!text) text = this.parent.id;
    // // console.log(`[Cnote.draw] Drawing ${this.id} xx0:${xx0} yy0:${yy0} ge0.x0:${this.geo.x0}`);
    // // console.log(`[Cnote.draw] Drawing ${this.id} text:${text}`);
    // if (xx0 != undefined) {
    //   this.geo.xx0 = xx0 + this.geo.x0;
    //   this.geo.yy0 = yy0 + this.geo.y0;
    // }
    // const styles = this.tagStyle ? this.tagStyle : noteStyles(this.color || hsm.settings.styles.defaultColor);
    // const x0P = R(U.mmToPL(this.geo.xx0), styles.borderWidth);
    // const y0P = R(U.mmToPL(this.geo.yy0));
    // const widthP = R(U.mmToPL(this.geo.width));
    // const heightP = R(U.mmToPL(this.geo.height));
    // // console.log(`[Cnote.draw] Drawing ${this.id} xx0:${xx0} geo.xx0:${this.geo.xx0} X0P:${x0P}`);
    // // Draw border
    // let lw = styles.borderWidth;
    // let ss = styles.borderColor;
    // if (this.isSelected || this.id == hCtx.selectedId || (this.togetherSelected && this.parent.id == hCtx.selectedId)) {
    //   lw = styles.borderSelectedWidth;
    //   ss = styles.borderSelectedColor;
    // } else {
    //   cCtx.lineWidth = styles.borderWidth;
    //   cCtx.strokeStyle = styles.borderColor;
    // }
    // cCtx.lineWidth = lw;
    // cCtx.strokeStyle = ss;
    // if (this.id.startsWith("X")) {
    //   // console.log(`[Cnote.draw] (${this.id}) strokeStyle:${cCtx.strokeStyle} lineWidth:${cCtx.lineWidth} styles.borderWidth:${styles.borderWidth}`);
    //   // console.log(`[Cnote.draw] (${this.id}) x0P:${x0P} y0P:${y0P} widthP:${widthP} heightP:${heightP}`);
    //   // console.log(`[Cnote.draw] (${this.id}) height:${this.geo.height} lw:${lw}`);
    // }
    // // if (lw > 0) { // beware of clip() below!
    // cCtx.beginPath();
    // cCtx.rect(x0P, y0P, widthP, heightP);
    // cCtx.moveTo(x0P + widthP - styles.cornerP, y0P + heightP);
    // cCtx.lineTo(x0P + widthP, y0P + heightP - styles.cornerP);
    // if (lw > 0) cCtx.stroke();
    // // }
    // // Draw note text
    // // console.log(`[Cnote.draw] canvas:${this.canvas}`);
    // if (!text) return;
    // cCtx.save();
    // cCtx.clip();
    // if (this.canvas) {
    //   cCtx.drawImage(this.canvas, 0, 0, widthP, heightP, x0P, y0P, widthP, heightP);
    // }
    // else {
    //   // console.log(`[Cnote.draw] Redo: canvas:${this.canvas}`);
    //   this.makeCanvas(text);
    // }
    // cCtx.restore();
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm of mousePos in this.geo.[x0,y0] frame
    // console.log(`[Cnote.makeIdz] (${this.id}) x:${x} y:${y} curId:${idz.id}`);
    const m = (hsm.settings.cursorMarginP / U.pxPerMm) / hCtx.folio.geo.scale;
    const r = hsm.settings.noteCornerP;
    if (
      x < - m ||
      x > this.geo.width + m ||
      y < - m ||
      y > this.geo.height + m
    )
      return idz;
    // console.log(`[Cnote.makeIdz] (${this.id}) In note x:${x} y:${y} curId:${idz.id}`);
    let id = this.id;
    let zone = "M";
    // console.log(`[Cnote.makeIdz] (${this.id}) id:${id} m:${m.toFixed(1)} zone:${zone} (x:${x.toFixed(1)} y:${y.toFixed(1)})`);
    if (x <= m) {
      if (y <= m) zone = "TL";
      else if (y >= this.geo.height - m) zone = "BL";
      else if (x <= m) zone = "L";
    }
    else if (x >= this.geo.width - m) {
      if (y <= m) zone = "TR";
      else if (y >= this.geo.height - m) zone = "BR";
      else if (x >= this.geo.width - m) zone = "R";
    }
    else if (y <= m) zone = "T";
    else if (y >= this.geo.height - m) zone = "B";
    idz = { id: id, zone: zone, x: x, y: y, dist2P: 0 };
    // console.log(`[Cnote.makeIdz] idz:${JSON.stringify(idz)}`);
    return idz;
  }

  makeIdzInParentCoordinates(xp, yp, myIdz) {
    [xp, yp] = [xp * U.pxPerMm, yp * U.pxPerMm];
    let [x, y] = applyToPoint(this.geo.matR, [xp, yp]);
    [x, y] = [x / U.pxPerMm, y / U.pxPerMm];
    // console.log(`[Cnote.makeIdzInParentCoordinates](${this.id}(${this.parent.id})) yp:${yp.toFixed()} y:${y.toFixed()} f:${this.geo.mat.f.toFixed()} `);
    const idz = this.makeIdz(x, y, myIdz);
    return idz;
  }
}

export class Ctext extends Cnote {
  constructor(parent, options) {
    super(parent, options, "X");
    // console.log(`[Cnote.Ctext] New Ctext id:${this.id} parentId:${this.parent.id} containerId:${this.container.id}`);
    this.geo.width = options?.width || 20;
    // console.log(`[Cnote.Ctext] (${this.id}) text:${this.text} scale:${this.scale}`);
    this.geo.height = hsm.settings.styles.tag.sizeMm + 2 * (hsm.settings.styles.tag.marginVMm);
    // console.log(`[Ctext.constructor] this.geo.height:${this.geo.height} ${JSON.stringify(hsm.settings.styles.tag)}`);
  }

  paint() {
    // TODO ICI
  }

  makeIdz(x, y, idz) {
    const newIdz = super.makeIdz(x, y, idz);
    if (newIdz.id == this.id) {
      const m = U.pxToMm(hsm.settings.cursorMarginP);
      if (x >= this.geo.x0 + this.geo.width - m) newIdz.zone = "R";
      else newIdz.zone = "M";
    }
    return newIdz;
  }

  drag(dx, dy) {
    super.drag(dx, dy, hCtx.folio);
  }

  draw(xx0, yy0) {
    // if (!this.text) super.draw(xx0, yy0, this.parent.id);
    // else super.draw(xx0, yy0);
  }

  makeCanvas(text) {
    // // console.warn(`[Ctext.makeCanvas] 0 (${this.id}) scale:${this.scale.toFixed(2)} geoScale:${hCtx.folio.geo.scale.toFixed(3)}`);
    // const canvasScale = this.scale * hCtx.folio.geo.scale;
    // // console.log(`[Ctext.makeCanvas] (${this.id}) canvasScale:${canvasScale.toFixed(2)} text:${text}`);
    // this.canvas = mdToCanvas(this.text, canvasScale, this.tagStyle.textColor, this.tagStyle.bg);
    // this.canvasScale = canvasScale;
    // // console.log(`[Ctext.makeCanvas] 1 (${this.id}) canvas:${this.canvas}`);
  }

}
