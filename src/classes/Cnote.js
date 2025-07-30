"use strict";

import * as U from "src/lib/utils";
import { R, RR } from "src/lib/utils";
import { CbaseElem } from "src/classes/CbaseElem";
import { Cregion } from "src/classes/Cregion";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { noteStyles } from "src/lib/styles";


export class Cnote extends CbaseElem {
  constructor(parent, options) {
    super(parent, options, "N");
    // console.log(`[Cnote] New state id:${this.id} parent:${this.parent.id}`);
  }

  load(noteOptions) {
    // console.log(`[Cnote.load] regions:${noteOptions?.regions}`);
    this.text = noteOptions?.text || "Coucou!";
  }

  // dragStart() {
  //   const idz = this.idz();
  //   const [x, y] = [idz.x, idz.y];
  //   // [x,y] in mm in this.geo.x/y frame
  //   // console.log(`[Cnote.dragStart] (${this.id}) x:${x?.toFixed()}`);
  //   // console.log(
  //   //   `[Cnote.dragStart] ${this.id} yy:${yy?.toFixed()} y:${y?.toFixed()} y0:${this.geo.y0}`,
  //   // );
  //   switch (modeRef.value) {
  //     case "inserting-state": {
  //       this.insertState(x, y);
  //       return;
  //     }
  //     case "inserting-trans": {
  //       this.insertTr(x, y);
  //       return;
  //     }
  //     default:
  //       modeRef.value = "";
  //   }
  //   this.grandchildrenBB = this.getGrandchildrenBB();
  //   this.setGrandchildrenDragOrigin();
  //   const dragCtx = {
  //     id: this.id,
  //     x0: this.geo.x0,
  //     y0: this.geo.y0,
  //     width: this.geo.width,
  //     height: this.geo.height,
  //     segments0: {},
  //   };
  //   for (let tr of hCtx.folio.trs) {
  //     if ((tr.from.id == this.id) || (tr.to.id == this.id)) {
  //       dragCtx.segments0[tr.id] = structuredClone(tr.segments);
  //       // console.log(`[Cnote.dragStart] trId:${tr.id} segments:${dragCtx.segments0[tr.id]}`);
  //     }
  //   }
  //   // console.log(`[Cnote.dragStart] dragCtx:${JSON.stringify(dragCtx)}`);
  //   hCtx.setDragCtx(dragCtx);
  //   this.parent.raiseChildR(this.id);
  //   hsm.adjustChange(this.id);
  //   return this;
  // }

  // drag(dx, dy) {
  //   const idz = this.idz();
  //   // console.log(`[Cnote.drag] (${this.id}) dx:${dx.toFixed()} dy:${dy.toFixed()}`);
  //   const dragCtx = hCtx.getDragCtx();
  //   let x0 = dragCtx.x0;
  //   let y0 = dragCtx.y0;
  //   let width = dragCtx.width;
  //   let height = dragCtx.height;
  //   // console.log(`[Cnote.drag] dragCtx:${JSON.stringify(dragCtx)}`);
  //   if (idz.zone == "M") {
  //     // console.log(`[Cnote.drag] id:${this.id} idz.zone:${idz.zone}`);
  //     dx = U.myClamp(
  //       dx,
  //       x0,
  //       this.geo.width + hsm.settings.minDistanceMm,
  //       hsm.settings.minDistanceMm,
  //       this.parent.geo.width - hsm.settings.minDistanceMm,
  //     );
  //     dy = U.myClamp(
  //       dy,
  //       y0,
  //       this.geo.height + hsm.settings.minDistanceMm,
  //       hsm.settings.minDistanceMm,
  //       this.parent.geo.height - hsm.settings.minDistanceMm,
  //     );
  //     x0 += dx;
  //     y0 += dy;
  //   } else {
  //     if (idz.zone.includes("T")) {
  //       if (height - dy < hsm.settings.stateMinHeight) dy = height - hsm.settings.stateMinHeight;
  //       if (y0 + dy < hsm.settings.minDistanceMm) dy = hsm.settings.minDistanceMm - y0;
  //       // console.log(
  //       //   `[Cnote.drag] id:${this.id} y0:${y0} dy:${dy} BB.y0:${this.grandchildrenBB.y0}`,
  //       // );
  //       if (this.grandchildrenBB.y0 && dy > this.grandchildrenBB.y0 - hsm.settings.minDistanceMm)
  //         dy = this.grandchildrenBB.y0 - hsm.settings.minDistanceMm;
  //       y0 += dy;
  //       height -= dy;
  //       for (let child of this.children) {
  //         child.patchChildrenOrigin(null, dy);
  //       }
  //     } else if (idz.zone.includes("B")) {
  //       if (height + dy < hsm.settings.stateMinHeight) dy = hsm.settings.stateMinHeight - height;
  //       if (y0 + height + dy > this.parent.geo.height - hsm.settings.minDistanceMm)
  //         dy = this.parent.geo.height - height - y0 - hsm.settings.minDistanceMm;
  //       if (
  //         this.grandchildrenBB.y1 &&
  //         height + dy < this.grandchildrenBB.y1 + hsm.settings.minDistanceMm
  //       )
  //         dy = this.grandchildrenBB.y1 + hsm.settings.minDistanceMm - height;
  //       height += dy;
  //     }
  //     if (idz.zone.includes("L")) {
  //       if (width - dx < hsm.settings.stateMinWidth) dx = width - hsm.settings.stateMinWidth;
  //       if (x0 + dx < hsm.settings.minDistanceMm) dx = hsm.settings.minDistanceMm - x0;
  //       if (this.grandchildrenBB.x0 && dx > this.grandchildrenBB.x0 - hsm.settings.minDistanceMm)
  //         dx = this.grandchildrenBB.x0 - hsm.settings.minDistanceMm;
  //       x0 += dx;
  //       width -= dx;
  //       for (let child of this.children) {
  //         child.patchChildrenOrigin(dx, null);
  //       }
  //     } else if (idz.zone.includes("R")) {
  //       if (width + dx < hsm.settings.stateMinWidth) dx = hsm.settings.stateMinWidth - width;
  //       if (x0 + width + dx > this.parent.geo.width - hsm.settings.minDistanceMm)
  //         dx = this.parent.geo.width - width - x0 - hsm.settings.minDistanceMm;
  //       if (
  //         this.grandchildrenBB.y0 &&
  //         width + dx < this.grandchildrenBB.x1 + hsm.settings.minDistanceMm
  //       )
  //         dx = this.grandchildrenBB.x1 + hsm.settings.minDistanceMm - width;
  //       width += dx;
  //     }
  //   }

  //   // console.log(
  //   //   `[Cnote.drag] (${this.id}) type:${idz.zone} Cx0:${dragCtx.x0.toFixed()} dx:${dx.toFixed()} x0:${x0.toFixed()}`,
  //   // );
  //   // console.log(`[Cnote.drag] (${this.id}) Parent id:${this.parent.id}`);
  //   this.geo.x0 = x0;
  //   this.geo.y0 = y0;
  //   this.geo.height = height;
  //   this.geo.width = width;
  //   if (!this.isRevertingDrag) {
  //     if (this.parent.childIntersect(this)) hCtx.setErrorId(this.id);
  //     else hCtx.setErrorId(null);
  //   }
  //   hsm.adjustChange(this.id);
  // }

  // checkOpenDialogAndEndDrag() {
  //   console.log(`[Cnote.checkOpenDialogAndEndDrag] (${this.id}) justCreated:${this.justCreated}`);
  //   if (this.justCreated == true) {
  //     hsm.openDialog(this);
  //     delete this.justCreated;
  //   }
  //   hCtx.dragEnd();
  // }



  // dragEnd(dx, dy) {
  //   // console.log(`[Cnote.dragEnd]`);
  //   this.drag(dx, dy);
  //   if (hCtx.getErrorId() == this.id) {
  //     this.dragRevert(dx, dy);
  //     return false;
  //   }
  //   this.checkOpenDialogAndEndDrag();
  //   return true;
  // }

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
    console.log(`[Cnote.draw] Drawing ${this.id} xx0:${xx0} yy0:${yy0}`);
    this.geo.xx0 = xx0 + this.geo.x0;
    this.geo.yy0 = yy0 + this.geo.y0;
    // console.log(`[Cnote.draw] Drawing ${this.id} yy0:${yy0} geo.y0:${this.geo.y0} geo.yy0:${this.geo.yy0}`);
    const styles = noteStyles(this.color || hsm.settings.styles.defaultColor);
    const x0P = RR(U.mmToPL(this.geo.xx0), styles.borderWidth);
    const y0P = RR(U.mmToPL(this.geo.yy0));
    const widthP = R(U.mmToPL(this.geo.width));
    const heightP = R(U.mmToPL(this.geo.height));
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
    // U.pathRoundedRectP(x0P, y0P, widthP, heightP, 2);
    cCtx.stroke();
    // Draw note text
    cCtx.font = `${styles.textSizeP}px ${styles.textFont}`;
    // console.log(`[Cnote.draw] Selected:${this.isSelected}`);
    cCtx.fillStyle = styles.textColor;
    cCtx.textBaseline = "middle";
    cCtx.textAlign = "center";
    cCtx.fillText(
      this.text,
      x0P + 40,
      y0P + styles.textSizeP,
      widthP,
    );
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm of mousePos in this.geo.[x0,y0] frame
    // console.log(`[Cnote.makeIdz] (${this.id}) x:${x} y:${y}`);
    const m = U.pToMmL(hsm.settings.cursorMarginP);
    const r = hsm.settings.stateRadiusMm;
    if (
      x < this.geo.x0 - m ||
      x > this.geo.x0 + this.geo.width + m ||
      y < this.geo.y0 - m ||
      y > this.geo.y0 + this.geo.height + m
    )
      return idz;
    let id = this.id;
    let zone = "M";
    if (x <= this.geo.x0 + r) {
      if (y <= this.geo.y0 + r) zone = "TL";
      else if (y >= this.geo.y0 + this.geo.height - r) zone = "BL";
      else if (x <= this.geo.x0 + m) zone = "L";
    } else if (x >= this.geo.x0 + this.geo.width - r) {
      if (y <= this.geo.y0 + r) zone = "TR";
      else if (y >= this.geo.y0 + this.geo.height - r) zone = "BR";
      else if (x >= this.geo.x0 + this.geo.width - m) zone = "R";
    } else if (y <= this.geo.y0 + m) zone = "T";
    else if (y >= this.geo.y0 + this.geo.height - m) zone = "B";
    idz = { id: id, zone: zone, x: x, y: y };
    for (let child of this.children) {
      idz = child.makeIdz(x - this.geo.x0, y - this.geo.y0, idz);
    }
    // console.log(`[Cnote.makeIdz] (${this.id}) id:${id} zone:${zone} (x:${x.toFixed(1)} y:${y.toFixed(1)})`);
    return idz;
  }

}
