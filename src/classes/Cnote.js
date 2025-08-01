"use strict";

import * as U from "src/lib/utils";
import { R, RR } from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { noteStyles } from "src/lib/styles";
import { h } from "vue";

export class Cnote extends CbaseElem {
  constructor(parent, options) {
    super(parent, options, "N");
    // console.log(`[Cnote] New state id:${this.id} parent:${this.parent.id}`);
    // console.log(`[Cnote] text:${options.text}`);
  }

  async load(noteOptions) {
    console.warn(`[Cnote.load] noteOptions:${noteOptions}`);
    this.text = noteOptions?.text || "";
    this.scale = noteOptions?.scale || 1;
    this.svgImage = await U.mdToSvg(this.text, "724px", "1024px", this.scale);
  }

  setSelected(val) {
    console.log(`[Cnote.setSelected] (${this.id}) } setSelected:${val}`);
    if (val) hsm.openDialog(this);
    hCtx.setSelectedId(null);
  }

  dragStart() {
    const idz = this.idz();
    const [x, y] = [idz.x, idz.y];
    // [x,y] in mm in this.geo.x/y frame
    // console.log(`[Cnote.dragStart] (${this.id}) x:${x?.toFixed()}`);
    // console.log(
    //   `[Cnote.dragStart] ${this.id} yy:${yy?.toFixed()} y:${y?.toFixed()} y0:${this.geo.y0}`,
    // );
    const dragCtx = {
      id: this.id,
      x0: this.geo.x0,
      y0: this.geo.y0,
      width: this.geo.width,
      height: this.geo.height,
    };
    // console.log(`[Cnote.dragStart] dragCtx:${JSON.stringify(dragCtx)}`);
    hCtx.setDragCtx(dragCtx);
    // this.parent.raiseChildR(this.id); // TODO
    // hsm.adjustChange(this.id);
    return this;
  }

  drag(dx, dy) {
    const idz = this.idz();
    // console.log(`[Cnote.drag] (${this.id}) dx:${dx.toFixed()} dy:${dy.toFixed()}`);
    const dragCtx = hCtx.getDragCtx();
    let x0 = dragCtx.x0;
    let y0 = dragCtx.y0;
    let width = dragCtx.width;
    let height = dragCtx.height;
    // console.log(`[Cnote.drag] dragCtx:${JSON.stringify(dragCtx)}`);
    if (idz.zone == "M") {
      console.log(`[Cnote.drag] id:${this.id} idz.zone:${idz.zone}`);
      dx = U.myClamp(
        dx,
        x0,
        this.geo.width + hsm.settings.minDistanceMm,
        hsm.settings.minDistanceMm,
        this.parent.geo.width - hsm.settings.minDistanceMm,
      );
      dy = U.myClamp(
        dy,
        y0,
        this.geo.height + hsm.settings.minDistanceMm,
        hsm.settings.minDistanceMm,
        this.parent.geo.height - hsm.settings.minDistanceMm,
      );
      x0 += dx;
      y0 += dy;
    } else {
      if (idz.zone.includes("T")) {
        if (height - dy < hsm.settings.stateMinHeight) dy = height - hsm.settings.stateMinHeight;
        if (y0 + dy < hsm.settings.minDistanceMm) dy = hsm.settings.minDistanceMm - y0;
        // console.log(
        //   `[Cnote.drag] id:${this.id} y0:${y0} dy:${dy} BB.y0:${this.grandchildrenBB.y0}`,
        // );
        y0 += dy;
        height -= dy;
      } else if (idz.zone.includes("B")) {
        if (height + dy < hsm.settings.stateMinHeight) dy = hsm.settings.stateMinHeight - height;
        if (y0 + height + dy > this.parent.geo.height - hsm.settings.minDistanceMm)
          dy = this.parent.geo.height - height - y0 - hsm.settings.minDistanceMm;
        height += dy;
      }
      if (idz.zone.includes("L")) {
        if (width - dx < hsm.settings.stateMinWidth) dx = width - hsm.settings.stateMinWidth;
        if (x0 + dx < hsm.settings.minDistanceMm) dx = hsm.settings.minDistanceMm - x0;
        x0 += dx;
        width -= dx;
      } else if (idz.zone.includes("R")) {
        if (width + dx < hsm.settings.stateMinWidth) dx = hsm.settings.stateMinWidth - width;
        if (x0 + width + dx > this.parent.geo.width - hsm.settings.minDistanceMm)
          dx = this.parent.geo.width - width - x0 - hsm.settings.minDistanceMm;
        width += dx;
      }
    }

    // console.log(
    //   `[Cnote.drag] (${this.id}) type:${idz.zone} Cx0:${dragCtx.x0.toFixed()} dx:${dx.toFixed()} x0:${x0.toFixed()}`,
    // );
    // console.log(`[Cnote.drag] (${this.id}) Parent id:${this.parent.id}`);
    this.geo.x0 = x0;
    this.geo.y0 = y0;
    this.geo.height = height;
    this.geo.width = width;
  }

  checkOpenDialogAndEndDrag() {
    console.log(`[Cnote.checkOpenDialogAndEndDrag] (${this.id}) justCreated:${this.justCreated}`);
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

  pathTitle(px, py, pwidth, pheight, pradius) {
    cCtx.beginPath();
    cCtx.moveTo(px + pradius, py);
    cCtx.lineTo(px + pwidth - pradius, py);
    cCtx.quadraticCurveTo(px + pwidth, py, px + pwidth, py + pradius);
    cCtx.lineTo(px + pwidth, py + pheight);
    cCtx.lineTo(px, py + pheight);
    cCtx.lineTo(px, py + pradius);
    cCtx.quadraticCurveTo(px, py, px + pradius, py);
    cCtx.closePath();
  }

  draw(xx0, yy0) {
    // console.log(`[Cnote.draw] Drawing ${this.id} xx0:${xx0} yy0:${yy0} ge0.x0:${this.geo.x0}`);
    this.geo.xx0 = xx0 + this.geo.x0;
    this.geo.yy0 = yy0 + this.geo.y0;
    const styles = noteStyles(this.color || hsm.settings.styles.defaultColor);
    const x0P = RR(U.mmToPL(this.geo.xx0), styles.borderWidth);
    const y0P = RR(U.mmToPL(this.geo.yy0));
    const widthP = R(U.mmToPL(this.geo.width));
    const heightP = R(U.mmToPL(this.geo.height));
    // console.log(`[Cnote.draw] Drawing ${this.id} xx0:${xx0} geo.xx0:${this.geo.xx0} X0P:${x0P}`);
    // Draw note background
    cCtx.fillStyle = styles.bg;
    U.pathRoundedRectP(x0P, y0P, widthP, heightP, 1);
    cCtx.fill();
    // Draw border
    cCtx.lineWidth = styles.borderWidth;
    cCtx.strokeStyle = styles.borderColor;
    if (this.isSelected) {
      // console.log(`[Cnote.draw] Selected:${this.isSelected}`);
      cCtx.lineWidth = styles.borderSelectedWidth;
    }
    cCtx.rect(x0P, y0P, widthP, heightP);
    cCtx.moveTo(x0P + widthP - styles.cornerP, y0P + heightP);
    cCtx.lineTo(x0P + widthP, y0P + heightP - styles.cornerP);
    // U.pathRoundedRectP(x0P, y0P, widthP, heightP, 2);
    cCtx.stroke();
    // Draw note text
    console.log(`[Cnote.draw] svgImage:${this.svgImage}`);
    cCtx.save();
    cCtx.clip();
    cCtx.drawImage(this.svgImage, x0P, y0P);
    cCtx.restore();
    // cCtx.font = `${styles.textSizeP}px ${styles.textFont}`;
    // // console.log(`[Cnote.draw] Selected:${this.isSelected}`);
    // cCtx.fillStyle = styles.textColor;
    // cCtx.textBaseline = "alphabetic";
    // cCtx.textAlign = "left";
    // cCtx.fillText(
    //   this.text,
    //   x0P,
    //   y0P + styles.textSizeP,
    //   widthP,
    // );
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
    if (x <= this.geo.x0 + m) {
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
    idz = { id: id, zone: zone, x: x, y: y };
    idz = { id: id, zone: zone, x: x, y: y };
    // console.log(`[Cnote.makeIdz] (${this.id}) id:${id} zone:${zone} (x:${x.toFixed(1)} y:${y.toFixed(1)})`);
    return idz;
  }

}
