"use strict";

import * as U from "src/lib/utils";
import { R, RR } from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { textStyles } from "src/lib/styles";

export class Ctext extends CbaseElem {
  constructor(parent, options) {
    super(parent, options, "X");
    // console.log(`[Ctext] New state id:${this.id} parent:${this.parent.id}`);
    // console.log(`[Ctext] text:${options.text}`);
    this.text = options?.text || "";
    this.scale = options?.scale || 1;
    this.geo.width = options?.width || 20;
    this.geo.height = hsm.settings.styles.text.text.sizeMm + 2 * (hsm.settings.styles.text.text.marginVMm);
    console.log(`[Ctext.load] this.geo.height:${this.geo.height}`);
  }

  async load(textOptions) {
    // console.log(`[Ctext.load] textOptions:${textOptions}`);
  }

  async dragStart() {
    const idz = this.idz();
    const [x, y] = [idz.x, idz.y];
    // [x,y] in mm in this.geo.x/y frame
    console.log(`[Ctext.dragStart] (${this.id}) x:${x?.toFixed()}`);
    // console.log(
    //   `[Ctext.dragStart] ${this.id} yy:${yy?.toFixed()} y:${y?.toFixed()} y0:${this.geo.y0}`,
    // );
    const dragCtx = {
      id: this.id,
      x0: this.geo.x0,
      y0: this.geo.y0,
      width: this.geo.width,
      height: this.geo.height,
    };
    // console.log(`[Ctext.dragStart] dragCtx:${JSON.stringify(dragCtx)}`);
    hCtx.setDragCtx(dragCtx);
    // this.parent.raiseChildR(this.id); // TODO
    return this;
  }

  drag(dx, dy) {
    const idz = this.idz();
    // console.log(`[Ctext.drag] (${this.id}) dx:${dx.toFixed()} dy:${dy.toFixed()}`);
    const dragCtx = hCtx.getDragCtx();
    let x0 = dragCtx.x0;
    let y0 = dragCtx.y0;
    let width = dragCtx.width;
    let height = dragCtx.height;
    // console.log(`[Ctext.drag] dragCtx:${JSON.stringify(dragCtx)}`);
    if (idz.zone == "M") {
      // console.log(`[Ctext.drag] id:${this.id} idz.zone:${idz.zone}`);
      if (this.parent.geo.width && this.parent.geo.height) {
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
      }
      x0 += dx;
      y0 += dy;
    } else {
      if (idz.zone.includes("T")) {
        if (height - dy < hsm.settings.textMinHeight) dy = height - hsm.settings.textMinHeight;
        if (y0 + dy < hsm.settings.minDistanceMm) dy = hsm.settings.minDistanceMm - y0;
        // console.log(
        //   `[Ctext.drag] id:${this.id} y0:${y0} dy:${dy} BB.y0:${this.grandchildrenBB.y0}`,
        // );
        y0 += dy;
        height -= dy;
      } else if (idz.zone.includes("B")) {
        if (height + dy < hsm.settings.textMinHeight) dy = hsm.settings.textMinHeight - height;
        if (this.parent.geo.height) {
          if (y0 + height + dy > this.parent.geo.height - hsm.settings.minDistanceMm)
            dy = this.parent.geo.height - height - y0 - hsm.settings.minDistanceMm;
        }
        height += dy;
      }
      if (idz.zone.includes("L")) {
        if (width - dx < hsm.settings.textMinWidth) dx = width - hsm.settings.textMinWidth;
        if (x0 + dx < hsm.settings.minDistanceMm) dx = hsm.settings.minDistanceMm - x0;
        x0 += dx;
        width -= dx;
      } else if (idz.zone.includes("R")) {
        if (width + dx < hsm.settings.textMinWidth) dx = hsm.settings.textMinWidth - width;
        if (this.parent.geo.width) {
          if (x0 + width + dx > this.parent.geo.width - hsm.settings.minDistanceMm)
            dx = this.parent.geo.width - width - x0 - hsm.settings.minDistanceMm;
        }
        width += dx;
      }
    }
    // console.log(
    //   `[Ctext.drag] (${this.id}) type:${idz.zone} Cx0:${dragCtx.x0.toFixed()} dx:${dx.toFixed()} x0:${x0.toFixed()}`,
    // );
    // console.log(`[Ctext.drag] (${this.id}) Parent id:${this.parent.id}`);
    this.geo.x0 = x0;
    this.geo.y0 = y0;
    this.geo.height = height;
    this.geo.width = width;
  }

  dragEnd(dx, dy) {
    // console.log(`[Ctext.dragEnd]`);
    this.drag(dx, dy);
    return true;
  }

  draw(xx0, yy0) {
    // console.log(`[Ctext.draw] Drawing ${this.id} xx0:${xx0} yy0:${yy0} ge0.x0:${this.geo.x0} text:${this.text}`);
    if (xx0 != undefined) {
      this.geo.xx0 = xx0 + this.geo.x0;
      this.geo.yy0 = yy0 + this.geo.y0;
    }
    if (!this.text) return;
    const styles = textStyles(this.color || hsm.settings.styles.defaultColor);
    const x0P = RR(U.mmToPL(this.geo.xx0), styles.borderWidth);
    const y0P = RR(U.mmToPL(this.geo.yy0));
    const widthP = R(U.mmToPL(this.geo.width));
    let heightP = R(U.mmToPL(this.geo.height));
    // console.log(`[Ctext.draw] Drawing ${this.id} xx0:${xx0} geo.xx0:${this.geo.xx0} X0P:${x0P}`);
    // Draw text background
    // cCtx.fillStyle = styles.bg;
    // U.pathRoundedRectP(x0P, y0P, widthP, heightP, 1);
    // cCtx.fill();
    // Draw border
    cCtx.lineWidth = styles.borderWidth;
    cCtx.strokeStyle = styles.borderColor;
    if (this.isSelected) {
      // console.log(`[Ctext.draw] Selected:${this.isSelected}`);
      cCtx.lineWidth = styles.borderSelectedWidth;
      cCtx.strokeStyle = styles.borderSelectedColor;
    }
    cCtx.rect(x0P, y0P, widthP, heightP);
    cCtx.stroke();
    // Draw text text
    cCtx.save();
    cCtx.clip();
    const textSizeP = R(U.mmToPL(styles.textSize));
    cCtx.font = `${textSizeP}px ${styles.textFont}`;
    const textColor = this.color ? this.color : styles.textColor;
    // console.log(`[Ctext.draw] textColor:${textColor} font:${cCtx.font} wP:${widthP} hP:${heightP} marginV:${styles.marginV}`);
    cCtx.fillStyle = textColor;
    cCtx.textBaseline = "alphabetic";
    cCtx.textAlign = "left";
    cCtx.fillText(
      this.text,
      x0P,
      y0P + textSizeP + styles.marginV,
      // widthP,
    );
    cCtx.restore();
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm of mousePos in this.geo.[x0,y0] frame
    // if (this.text) console.log(`[Ctext.makeIdz] (${this.id}) x:${x.toFixed(1)} y:${y.toFixed(1)}`);
    const m = U.pToMmL(hsm.settings.cursorMarginP);
    const r = hsm.settings.textCornerP;
    if (
      x < this.geo.x0 - m ||
      x > this.geo.x0 + this.geo.width + m ||
      y < this.geo.y0 - m ||
      y > this.geo.y0 + this.geo.height + m
    ) {
      return idz;
    }
    let id = this.id;
    let zone = "M";
    if (x >= this.geo.x0 + this.geo.width - m) zone = "R";
    idz = { id: id, zone: zone, x: x, y: y, dist2P: 0 };
    // if (this.text) console.log(`[Ctext.makeIdz] (${this.id}) id:${id} zone:${zone} (x:${x.toFixed(1)} y:${y.toFixed(1)})`);
    return idz;
  }

}
