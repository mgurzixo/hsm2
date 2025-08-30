import { CbaseElem } from "src/classes/CbaseElem";
import { hsm, hCtx } from "src/classes/Chsm";
import JunctionDialog from "src/components/JunctionDialog.vue";
import { inverse, toCSS, applyToPoint } from 'transformation-matrix';
import * as U from "src/lib/utils";
import Color from "colorjs.io";
import { Ctext } from "src/classes/Ctext";

export class Cjunction extends CbaseElem {
  constructor(parent, options = {}, type = "J") {
    super(parent, options, type);
    const g = this.geo;
    this.makeStyles();
    const j = this.styles;
    this.id = options.id || hsm.newSernum("J");
    this.name = options.name || "";
    this.include = options.include || "";
    this.comment = options.comment || "";
    this.orientation = options.orientation || "vertical"; // or "horizontal"
    this.thickness = options.thickness || j.thicknessMm;
    this.length = options.length || j.minLengthMm;
    this.geo.mat = { a: 1, b: 0, c: 0, d: 1, e: g.x0 * U.pxPerMm, f: g.y0 * U.pxPerMm };
    const tagEl = document.createElement("div");
    this.childElem.append(tagEl);
    this.myElem.style.overflow = "visible"; // Ensure tag visibility
    this.tag = new Ctext(this, {
      myElem: tagEl,
      geo: { x0: -5, y0: -5, width: 20 },
      text: "",
      togetherSelected: true,
      tagStyle: this.styles,
      container: parent,
      widthAuto: true,
    });
    this.children.push(this.tag);
    this.makeTag();
    this.setGeoFromMat();
    this.setGeometry();
    // console.log(`[Cjunction.constructor] (${this.id}) geo:${JSON.stringify(this.geo)}`);
  }

  async onLoaded() {
    this.tag.setContainer(this.parent);
    this.makeTag();
  }

  makeStyles() {
    const j = hsm.settings.styles.junction;
    let color = new Color(j.color);
    color.lch.c = j.bgChroma;
    color.lch.l = j.bgLight;
    let bgColor = color.to("srgb") + "";
    color.lch.c = j.tagBgChroma;
    color.lch.l = j.tagBgLight;
    const tagBgColor = color.to("srgb") + "";
    color.lch.c = j.tagBorderChroma;
    color.lch.l = j.tagBorderLight;
    const tagBorderColor = color.to("srgb") + "";
    this.styles = {
      backgroundColor: bgColor,
      thicknessMm: j.thicknessMm,
      minLengthMm: j.minLengthMm,

      tagBorderWidth: "1",
      tagBorderColor: tagBorderColor,
      tagBorderSelectedWidth: "1",
      tagBorderSelectedColor: bgColor,
      tagTextColor: bgColor,
      tagTextFont: "sans-serif",
      tagTextSize: j.tagTextSizeMm,
      tagBg: tagBgColor,
      tagBgOpacity: j.tagBgOpacity,
      // tagBg: `tcolor-mix(in srgb, ${tagBgColor} 95%, transparent 5%)`,
    };
  }

  makeTag() {
    let text = this.name;
    if (this.text == text) return;
    this.text = text;
    this.tag.setText(text);
    // console.log(`[Ctr.makeTag](${this.id}) } text: ${text} `);
  }

  setGeometry() {
    const s = this.myElem.style;
    const g = this.geo;
    const j = this.styles;
    // s.position = "absolute";
    s.background = j.backgroundColor;
    s.borderRadius = "3px";
    if (this.orientation === "vertical") {
      g.width = this.thickness;
      s.width = this.thickness + "mm";
      g.height = this.length;
      s.height = this.length + "mm";
    } else {
      g.width = this.length;
      s.width = this.length + "mm";
      g.height = this.thickness;
      s.height = this.thickness + "mm";
    }
    s.top = "0px";
    s.left = "0px";
    this.paint();
  }

  setGeoFromMat(mat = this.geo.mat) {
    this.geo.mat = mat;
    const matR = inverse(mat);
    this.geo.matR = matR;
    this.geo.x0 = mat.e / U.pxPerMm;
    this.geo.y0 = mat.f / U.pxPerMm;
    this.geo.scale = mat.a;
    this.myElem.style.transform = toCSS(this.geo.mat);
    // console.log(`[Cjunction.setGeoFromMat](${ this.id }) geo:${ this.geo; } mat:${ JSON.stringify(mat); } `);
  }

  setSelected(val) {
    // console.log(`[Cjunction.setSelected](${ this.id });  } setSelected: ${ val; } `);
    super.setSelected(val);
    if (val) this.raise();
    if (this.tag.isSelected != val) this.tag.setSelected(val);
    this.paint();
  }

  paint() {
    // console.log(`[Cjunction.paint] text: "${this.text}"`);
    const s = this.myElem.style;
    const g = this.geo;
    const styles = this.styles == "parentStyle" ? this.parent.styles : this.styles;
    s.width = g.width + "mm";
    s.height = `${g.height} mm`;
    if (hCtx.getErrorId() == this.id) s.backgroundColor = "red";
    else s.backgroundColor = this.styles.backgroundColor;
    // console.log(`[Cjunction.paint](${ this.id }) s.width:${ s.width; } s.height:${ s.height; } s.font:${ s.font; } `);
    s.transform = toCSS(g.mat);
    this.tag.paint();
  }

  rePaint() {
    this.paint();
  }

  openDialog() {
    hsm.setSelected(this.id);
    hsm.openDialog(JunctionDialog, this);
  }

  async dragStart(xP, yP) {
    const idz = this.idz();
    const [x, y] = [idz.x, idz.y];
    hsm.setSelected(this.id);
    const dragCtx = {
      id: this.id,
      x0: this.geo.x0,
      y0: this.geo.y0,
      width: this.geo.width,
      height: this.geo.height,
      dx0: x - this.geo.width,
      dy0: y - this.geo.height,
      orientation: this.orientation,
      length: this.length,
      thickness: this.thickness,
      mat: { ...this.geo.mat },
      trsSegments: {},
    };
    for (let tr of hCtx.folio.trs) {
      if ((tr.from.id == this.id) || (tr.to.id == this.id)) {
        dragCtx.trsSegments[tr.id] = structuredClone(tr.segments);
      }
    }
    console.log(`[Cjunction.dragStart](${this.id})(width: ${dragCtx.width.toFixed()}, height: ${dragCtx.height.toFixed()})(x: ${x.toFixed()}, y: ${y.toFixed()}), (x0: ${dragCtx.x0.toFixed()}, y0:${dragCtx.y0.toFixed()}) (dx0: ${dragCtx.dx0.toFixed()}, dy0:${dragCtx.dy0.toFixed()})`);
    hCtx.setDragCtx(dragCtx);
    this.raise();
    this.parent.raiseJunctions();
    return this;
  }

  drag(dxP, dyP) {
    const idz = this.idz();
    const s0 = hCtx.folio.geo.mat.a;
    let [dx, dy] = [dxP / U.pxPerMm / s0, dyP / U.pxPerMm / s0];
    let [de, df] = [0, 0];
    const d = hCtx.getDragCtx();
    let x0 = d.x0;
    let y0 = d.y0;
    // this.geo.x0 = x0;
    // this.geo.y0 = y0;
    // let width = d.width;
    // let height = d.height;
    let length;
    const zone = idz.zone;
    const m = hsm.settings.minDistanceMm;
    const ml = hsm.settings.junctionMinLengthMm;
    const pg = this.parent.geo;
    if (zone == "M") {
      if (x0 + dx < m) dx = m - x0;
      if (x0 + dx + this.geo.width > pg.width - m) dx = pg.width - m - x0 - this.geo.width;
      if (y0 + dy < m) dy = m - y0;
      if (y0 + dy + this.geo.height > pg.height - m) dy = pg.height - m - y0 - this.geo.height;
      x0 = d.x0 + dx;
      y0 = d.y0 + dy;
      [de, df] = [dx * U.pxPerMm, dy * U.pxPerMm];
    } else {
      const ww = d.width + dx;
      const hh = d.height + dy;
      if (d.width + dx > d.height + + dy) this.orientation = "horizontal";
      else this.orientation = "vertical";

      if (this.orientation == "horizontal") {
        if (d.width + dx < ml) dx = ml - d.width;
        if (x0 + d.width + dx > pg.width - m) dx = pg.width - m - d.width - x0;
        this.length = d.width + dx;
      }
      else {
        if (d.height + dy < ml) dy = ml - d.height;
        if (y0 + d.height + dy > pg.height - m) dy = pg.height - m - d.height - y0;
        this.length = d.height + dy;
      }
    }
    this.geo.x0 = x0;
    this.geo.y0 = y0;
    // console.log(`[Cjunction.drag](${ this.id }) width:${ width; } `);
    const mat = {};
    Object.assign(mat, this.geo.mat);
    mat.e = d.mat.e + de;
    mat.f = d.mat.f + df;
    // console.log(`Cjunction.drag]mat1:${ JSON.stringify(mat); } `);
    this.setGeoFromMat(mat);
    if (!this.isRevertingDrag) {
      if (this.parent.childIntersect(this)) hCtx.setErrorId(this.id);
      else hCtx.setErrorId(null);
    }
    this.setGeometry();
    hsm.adjustTrAnchors(this.id);
    if (!this.isRevertingDrag) {
      if (this.parent.childIntersect(this)) hCtx.setErrorId(this.id);
      else hCtx.setErrorId(null);
    }
  }

  checkOpenDialogAndEndDrag() {
    // console.log(`Cjunction.checkOpenDialogAndEndDrag](${ this.id; }) justCreated:${ this.justCreated; } `);
    if (this.justCreated == true) {
      this.openDialog();
      delete this.justCreated;
    }
    hCtx.dragEnd();
  }

  dragRevert(deltaX, deltaY) {
    this.isRevertingDrag = true;
    const dragCtx = hCtx.getDragCtx();
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const totalIterations = Math.ceil(dist / hsm.settings.dragResetSpeed);
    // console.log(`Cjunction.dragRevert]dist:${ dist.toFixed(); } totalIterations:${ totalIterations; } `);
    let currentIteration = 0;
    const [changeX, changeY] = [deltaX / totalIterations, deltaY / totalIterations];

    // Restore original segments
    function myCb() {
      const elem = U.getElemById(hCtx.draggedId);
      const ease = Math.pow(currentIteration / totalIterations - 1, 3) + 1;
      // console.log(`Cjunction.dragRevert]#${ currentIteration; } ease:${ ease.toFixed(2); } `);
      const dx = deltaX * (1 - ease);
      const dy = deltaY * (1 - ease);
      hsm.makeIdz;
      elem.drag(dx, dy);
      if (currentIteration > totalIterations) {
        elem.isRevertingDrag = false;
        for (const trId of Object.keys(dragCtx.trsSegments)) {
          const tr = U.getElemById(trId);
          tr.segments = dragCtx.trsSegments[trId.toString()];
        }
        hCtx.setErrorId(null);
        elem.checkOpenDialogAndEndDrag();
      } else {
        currentIteration++;
        window.requestIdleCallback(myCb);
      }
      hsm.adjustTrAnchors(elem.id);
      elem.setGeometry();
      hsm.makeIdzP(); // Will set cursor
      // hsm.setCursor(idz); // TODO !
    }

    window.requestAnimationFrame(myCb);
  }

  dragEnd(dxP, dyP) {
    this.drag(dxP, dyP);
    if (hCtx.getErrorId() == this.id) {
      this.dragRevert(dxP, dyP);
      return false;
    }
    this.checkOpenDialogAndEndDrag();
    return true;
  }
  // Returns [x,y] of (side,pos) in state frame
  makeTrXY(side, pos) {
    const r = 1; // px TODO
    let len;
    let [x, y] = [0, 0];
    if (side == "L" || side == "R") {
      if (this.orientation == "horizontal") return null;
      len = this.geo.height - 2 * r;
      y = r + len * pos;
      if (side == "R") x += this.geo.width;
    }
    else {
      if (this.orientation == "vertical") return null;
      len = this.geo.width - 2 * r;
      x = r + len * pos;
      if (side == "B") y += this.geo.height;
    }
    // console.log(`[Cstate.makeTrXY] side:${ side; } pos:${ pos.toFixed(2); } (x: ${ x.toFixed(1);
    // } y: ${ y.toFixed(1)})`);
    return [x, y];
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm of mousePos in this.geo.[x0,y0] frame
    // console.log(`[Cjunction.makeIdz] (${this.id}) x:${x} y:${y} curId:${idz.id}`);
    const m = (hsm.settings.cursorMarginP / U.pxPerMm) / hCtx.folio.geo.scale;
    const o = this.orientation;
    // if (
    //   x < 0 ||
    //   x > this.geo.width + m ||
    //   y < 0 ||
    //   y > this.geo.height + m
    // ) return idz;

    if (
      x >= 0 &&
      x <= this.geo.width + m &&
      y >= 0 &&
      y <= this.geo.height + m
    ) {
      let id = this.id;
      let zone = "M";
      // console.log(`[Cjunction.makeIdz] (${this.id}) id:${id} m:${m.toFixed(1)} zone:${zone} (x:${x.toFixed(1)} y:${y.toFixed(1)}) ${this.geo.height}`);
      if ((o == "horizontal" && x >= this.geo.width - m) || (o == "vertical" && y >= this.geo.height - m)) zone = "BR";
      idz = { id: id, zone: zone, x: x, y: y, dist2: 0 };
      // console.log(`[Cjunction.makeIdz] idz:${JSON.stringify(idz)}`);
    }
    for (let child of this.children) {
      idz = child.makeIdzInParentCoordinates(x, y, idz);
    }
    return idz;
  }

  makeIdzInParentCoordinates(xp, yp, myIdz) {
    [xp, yp] = [xp * U.pxPerMm, yp * U.pxPerMm];
    let [x, y] = applyToPoint(this.geo.matR, [xp, yp]);
    [x, y] = [x / U.pxPerMm, y / U.pxPerMm];
    // console.log(`[Cregion.makeIdzInParentCoordinates](${this.id}(${this.parent.id})) yp:${yp.toFixed()} y: ${y.toFixed()} f:${this.geo.mat.f.toFixed()} `);
    const idz = this.makeIdz(x, y, myIdz);
    return idz;
  }
}
