"use strict";

import * as U from "src/lib/utils";
import { R, RR } from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { noteStyles } from "src/lib/styles";
import { mdToCanvas } from "src/lib/md";

export class Cnote extends CbaseElem {
  constructor(parent, noteOptions, type = "N") {
    super(parent, noteOptions, type);
    // console.log(`[Cnote] New note id:${this.id} parent:${this.parent.id} ${noteOptions.container?.id}`);
    // console.log(`[Cnote] text:${noteOptions.text}`);
    this.text = noteOptions?.text || "";
    this.scale = noteOptions?.scale || 1;
    this.container = noteOptions?.container ? noteOptions.container : parent;
    this.togetherSelected = noteOptions?.togetherSelected;
    this.canvasScale = 0;
  }

  async load(noteOptions) {
    // console.log(`[Cnote.load] noteOptions:${noteOptions}`);

  }

  async onLoaded() {
    // this.makeCanvas();
  }

  setSelected(val) {
    this.isSelected = val;
    // console.log(`[Cnote.dragStart] (${this.id}) togetherSelected:${this.togetherSelected}`);
    if (this.togetherSelected) {
      if (this.parent.isSelected != val) this.parent.setSelected(val);
    }
  }

  openDialog() {
    if (this.togetherSelected) this.parent.openDialog();
    else hsm.openDialog(this);
  }

  async dragStart() {
    const idz = this.idz();
    const [x, y] = [idz.x, idz.y];
    // [x,y] in mm in this.geo.x/y frame
    // console.log(`[Cnote.dragStart] (${this.id}) x:${x?.toFixed()} containerId:${this.container.id}`);
    // console.log(
    //   `[Cnote.dragStart] ${this.id} yy:${yy?.toFixed()} y:${y?.toFixed()} y0:${this.geo.y0}`,
    // );
    const dragCtx = {
      id: this.id,
      x0: this.geo.x0,
      y0: this.geo.y0,
      xx0: this.geo.xx0,
      yy0: this.geo.yy0,
      width: this.geo.width,
      height: this.geo.height,
    };
    // console.log(`[Cnote.dragStart] dragCtx:${JSON.stringify(dragCtx)}`);
    hCtx.setDragCtx(dragCtx);
    // this.parent.raiseChildR(this.id); // TODO
    return this;
  }

  drag(dx, dy) {
    const idz = this.idz();
    const container = this.container ? this.container : this.parent;
    // console.log(`[Cnote.drag] (${this.id}) Container:${this.container?.id} ContainerId:${container.id}`);
    // console.log(`[Cnote.drag] (${this.id}) dx:${dx.toFixed()} dy:${dy.toFixed()}`);
    // console.log(`[Cnote.drag] (${this.id}) parentId:${this.parent.id}`);
    const dragCtx = hCtx.getDragCtx();
    let x0 = dragCtx.x0;
    let y0 = dragCtx.y0;
    let xx0 = dragCtx.xx0;
    let yy0 = dragCtx.yy0;
    let width = dragCtx.width;
    let height = dragCtx.height;
    const m = hsm.settings.minDistanceMm;
    // console.log(`[Cnote.drag] dragCtx:${JSON.stringify(dragCtx)}`);
    if (idz.zone == "M") {
      // console.log(`[Cnote.drag] id:${this.id} idz.zone:${idz.zone}`);
      // console.log(`[Cnote.drag] container.geo.xx0:${container.geo.xx0}`);
      if (xx0 + dx < container.geo.xx0 + m) dx = container.geo.xx0 + m - xx0;
      if (xx0 + width + dx > container.geo.xx0 + container.geo.width - m) {
        dx = container.geo.xx0 + container.geo.width - m - xx0 - width;
      }
      if (yy0 + dy < container.geo.yy0 + m) dy = container.geo.yy0 + m - yy0;
      if (yy0 + height + dy > container.geo.yy0 + container.geo.height - m) {
        dy = container.geo.yy0 + container.geo.height - m - yy0 - height;
      }
      x0 += dx;
      y0 += dy;
    } else {
      if (idz.zone.includes("T")) {
        if (height - dy < hsm.settings.noteMinHeight) dy = height - hsm.settings.noteMinHeight;
        if (y0 + dy < hsm.settings.minDistanceMm) dy = hsm.settings.minDistanceMm - y0;
        // console.log(
        //   `[Cnote.drag] id:${this.id} y0:${y0} dy:${dy} BB.y0:${this.grandchildrenBB.y0}`,
        // );
        y0 += dy;
        height -= dy;
      } else if (idz.zone.includes("B")) {
        if (height + dy < hsm.settings.noteMinHeight) dy = hsm.settings.noteMinHeight - height;
        if (y0 + height + dy > container.geo.height - hsm.settings.minDistanceMm)
          dy = container.geo.height - height - y0 - hsm.settings.minDistanceMm;
        height += dy;
      }
      if (idz.zone.includes("L")) {
        if (width - dx < hsm.settings.noteMinWidth) dx = width - hsm.settings.noteMinWidth;
        if (x0 + dx < hsm.settings.minDistanceMm) dx = hsm.settings.minDistanceMm - x0;
        x0 += dx;
        width -= dx;
      } else if (idz.zone.includes("R")) {
        if (width + dx < hsm.settings.noteMinWidth) dx = hsm.settings.noteMinWidth - width;
        if (x0 + width + dx > container.geo.width - hsm.settings.minDistanceMm)
          dx = container.geo.width - width - x0 - hsm.settings.minDistanceMm;
        width += dx;
      }
    }
    // console.log(
    //   `[Cnote.drag] (${this.id}) type:${idz.zone} Cx0:${dragCtx.x0.toFixed()} dx:${dx.toFixed()} x0:${x0.toFixed()}`,
    // );
    this.geo.x0 = x0;
    this.geo.y0 = y0;
    this.geo.height = height;
    this.geo.width = width;
  }

  checkOpenDialogAndEndDrag() {
    // console.log(`[Cnote.checkOpenDialogAndEndDrag] (${this.id}) justCreated:${this.justCreated}`);
    if (this.justCreated == true) {
      hsm.openDialog(this);
      delete this.justCreated;
    }
    hCtx.dragEnd();
  }

  dragEnd(dx, dy) {
    // console.log(`[Cnote.dragEnd]`);
    this.drag(dx, dy);
    this.checkOpenDialogAndEndDrag();
    return true;
  }

  async makeCanvas(text) {
    // console.warn(`[Cnote.makeCanvas] 0 (${this.id}) scale:${this.scale.toFixed(2)} geoScale:${hCtx.folio.geo.scale.toFixed(3)}`);
    const canvasScale = this.scale * hCtx.folio.geo.scale;
    const styles = noteStyles(this.color || hsm.settings.styles.defaultColor);

    // console.log(`[Cnote.makeCanvas] (${this.id}) canvasScale:${canvasScale.toFixed(2)} text:${text}`);
    this.canvas = mdToCanvas(this.text, canvasScale, styles.textColor, styles.bg);
    this.canvasScale = canvasScale;
    // console.log(`[Cnote.makeCanvas] 1 (${this.id}) canvas:${this.canvas}`);
  }

  deleteCanvas() {
    // console.warn(`[Cnote.deleteCanvas] (${this.id})`);
    delete this.canvas;
  }

  draw(xx0, yy0, text = this.text) {
    if (!text) text = this.parent.id;
    // console.log(`[Cnote.draw] Drawing ${this.id} xx0:${xx0} yy0:${yy0} ge0.x0:${this.geo.x0}`);
    // console.log(`[Cnote.draw] Drawing ${this.id} text:${text}`);
    if (xx0 != undefined) {
      this.geo.xx0 = xx0 + this.geo.x0;
      this.geo.yy0 = yy0 + this.geo.y0;
    }
    const styles = this.tagStyle ? this.tagStyle : noteStyles(this.color || hsm.settings.styles.defaultColor);
    const x0P = R(U.mmToPL(this.geo.xx0), styles.borderWidth);
    const y0P = R(U.mmToPL(this.geo.yy0));
    const widthP = R(U.mmToPL(this.geo.width));
    const heightP = R(U.mmToPL(this.geo.height));
    // console.log(`[Cnote.draw] Drawing ${this.id} xx0:${xx0} geo.xx0:${this.geo.xx0} X0P:${x0P}`);
    // Draw border
    let lw = styles.borderWidth;
    let ss = styles.borderColor;
    if (this.isSelected || this.id == hCtx.selectedId || (this.togetherSelected && this.parent.id == hCtx.selectedId)) {
      lw = styles.borderSelectedWidth;
      ss = styles.borderSelectedColor;
    } else {
      cCtx.lineWidth = styles.borderWidth;
      cCtx.strokeStyle = styles.borderColor;
    }
    cCtx.lineWidth = lw;
    cCtx.strokeStyle = ss;
    if (this.id.startsWith("X")) {
      // console.log(`[Cnote.draw] (${this.id}) strokeStyle:${cCtx.strokeStyle} lineWidth:${cCtx.lineWidth} styles.borderWidth:${styles.borderWidth}`);
      // console.log(`[Cnote.draw] (${this.id}) x0P:${x0P} y0P:${y0P} widthP:${widthP} heightP:${heightP}`);
      // console.log(`[Cnote.draw] (${this.id}) height:${this.geo.height} lw:${lw}`);
    }
    // if (lw > 0) { // beware of clip() below!
    cCtx.beginPath();
    cCtx.rect(x0P, y0P, widthP, heightP);
    cCtx.moveTo(x0P + widthP - styles.cornerP, y0P + heightP);
    cCtx.lineTo(x0P + widthP, y0P + heightP - styles.cornerP);
    if (lw > 0) cCtx.stroke();
    // }
    // Draw note text
    // console.log(`[Cnote.draw] canvas:${this.canvas}`);
    if (!text) return;
    cCtx.save();
    cCtx.clip();
    if (this.canvas) {
      cCtx.drawImage(this.canvas, 0, 0, widthP, heightP, x0P, y0P, widthP, heightP);
    }
    else {
      // console.log(`[Cnote.draw] Redo: canvas:${this.canvas}`);
      this.makeCanvas(text);
    }
    cCtx.restore();
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm of mousePos in this.geo.[x0,y0] frame
    // console.log(`[Cnote.makeIdz] (${this.id}) x:${x} y:${y}`);
    const m = U.pToMmL(hsm.settings.cursorMarginP);
    const r = hsm.settings.noteCornerP;
    if (
      x < this.geo.x0 - m ||
      x > this.geo.x0 + this.geo.width + m ||
      y < this.geo.y0 - m ||
      y > this.geo.y0 + this.geo.height + m
    )
      return idz;
    let id = this.id;
    let zone = "M";
    if (this.justCreated) zone = ("BR");
    else if (x <= this.geo.x0 + m) {
      if (y <= this.geo.y0 + m) zone = "TL";
      else if (y >= this.geo.y0 + this.geo.height - m) zone = "BL";
      else if (x <= this.geo.x0 + m) zone = "L";
    }
    else if (x >= this.geo.x0 + this.geo.width - m) {
      if (y <= this.geo.y0 + m) zone = "TR";
      else if (y >= this.geo.y0 + this.geo.height - m) zone = "BR";
      else if (x >= this.geo.x0 + this.geo.width - m) zone = "R";
    }
    else if (y <= this.geo.y0 + m) zone = "T";
    else if (y >= this.geo.y0 + this.geo.height - m) zone = "B";
    idz = { id: id, zone: zone, x: x, y: y, dist2P: 0 };
    // console.log(`[Cnote.makeIdz] (${this.id}) id:${id} zone:${zone} (x:${x.toFixed(1)} y:${y.toFixed(1)})`);
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
    console.log(`[Ctext.load] this.geo.height:${this.geo.height} ${JSON.stringify(hsm.settings.styles.tag)}`);
  }

  makeIdz(x, y, idz) {
    const newIdz = super.makeIdz(x, y, idz);
    if (newIdz.id == this.id) {
      const m = U.pToMmL(hsm.settings.cursorMarginP);
      if (x >= this.geo.x0 + this.geo.width - m) newIdz.zone = "R";
      else newIdz.zone = "M";
    }
    return newIdz;
  }

  drag(dx, dy) {
    super.drag(dx, dy, hCtx.folio);
  }

  draw(xx0, yy0) {
    if (!this.text) super.draw(xx0, yy0, this.parent.id);
    else super.draw(xx0, yy0);
  }

  async makeCanvas(text) {
    // console.warn(`[Ctext.makeCanvas] 0 (${this.id}) scale:${this.scale.toFixed(2)} geoScale:${hCtx.folio.geo.scale.toFixed(3)}`);
    const canvasScale = this.scale * hCtx.folio.geo.scale;
    // console.log(`[Ctext.makeCanvas] (${this.id}) canvasScale:${canvasScale.toFixed(2)} text:${text}`);
    this.canvas = mdToCanvas(this.text, canvasScale, this.tagStyle.textColor, this.tagStyle.bg);
    this.canvasScale = canvasScale;
    // console.log(`[Ctext.makeCanvas] 1 (${this.id}) canvas:${this.canvas}`);
  }

}
