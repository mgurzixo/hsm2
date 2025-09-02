"use strict";

import * as U from "src/lib/utils";
import * as T from "src/lib/trUtils";
import { hsm, cCtx, hElems, hCtx, modeRef } from "src/classes/Chsm";
import { CbaseElem } from "src/classes/CbaseElem";
import { Ctext } from "src/classes/Ctext";
// import { Ctext } from "src/classes/Ctext";
import { removeNullSegments, segsNormalise } from "src/lib/segments";
import TrDialog from "src/components/TrDialog.vue";
import { applyToPoint } from 'transformation-matrix';

export class Ctr extends CbaseElem {
  constructor(parent, options, type) {
    super(parent, options, type);
    this.svgElem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svgElem.id = "svgElem_" + this.id;
    this.myElem.prepend(this.svgElem);
    this.lineWidth = 1;
    this.isBaseTr = true;
    this.segments = [];
    this.from = options.from || {};
    this.to = options.to || {};
    this.isInternal = options.isInternal || false;
    if (options.color) this.color = options.color;
    else delete (this.color);
    this.trigger = options.trigger || "";
    this.guard = options.guard || "";
    this.effect = options.effect || "";
    this.include = options.include || "";
    this.comment = options.comment || "";
    this.lineWidth = 1.5;
    this.segments = options.segments;
    this.from = options.from;
    this.to = options.to;
    this.isInternal = options.isInternal || false;
    if (options.color) this.color = options.color;
    else delete (this.color);
    this.trigger = options.trigger;
    this.guard = options.guard;
    this.effect = options.effect;
    this.include = options.include;
    this.comment = options.comment;
    // childElem is positionned @ FROM
    this.childElem.style.position = "absolute";
    const tagEl = document.createElement("div");
    this.childElem.append(tagEl);
    this.tag = new Ctext(this, {
      myElem: tagEl,
      geo: { x0: 1, y0: 1, width: 20 },
      text: "",
      container: hCtx.folio, // Null at that time
      togetherSelected: true,
      tagStyle: "parentStyle",
    });
    this.children.push(this.tag);
    this.makeTag();
    // console.log(`[Ctr.constructor] (${this.id}) from:${this.from.id}  to:${this.to.id}`);
  }

  // Called when hsm has been loaded so that we can get hCtx.folio
  async onLoaded() {
    this.tag.container = hCtx.folio;
    this.makeTag();
    if (!this.segments || this.segments.length == 0) this.segments = this.createSimpleSegments();
    const el = this.svgElem;
    const fx = [hCtx.folio.geo.width, hCtx.folio.geo.height];
    // console.log(`[Ctr.onLoaded] (${this.id}) width:${fx[0]}`);
    el.setAttribute("width", fx[0] + "mm");
    el.setAttribute("height", fx[1] + "mm");
    this.paint();
  }

  serialise() {
    function anchorObj(anchor) {
      return { id: anchor.id, side: anchor.side, pos: anchor.pos };
    }
    // Only save the properties needed for reload and matching Aaa.json5
    const { isInternal, trigger, guard, effect } = this;
    const from = anchorObj(this.from);
    const to = anchorObj(this.to);
    const segments = [];
    for (let segment of this.segments) {
      segments.push({ dir: segment.dir, len: segment.len });
    }
    const obj = { from, to, isInternal, segments };
    if (trigger) obj.trigger = trigger;
    if (guard) obj.guard = guard;
    if (effect) obj.effect = effect;
    return obj;
  }

  paint() {
    const g = hCtx.folio.geo;
    const u = U.pxPerMm;
    const fx = [hCtx.folio.geo.width, hCtx.folio.geo.height];
    const t = hsm.settings.styles.tr;
    const r = t.maxTransRadiusMm;
    const segments = this.segments;

    function svgSegment(dir, len) {
      // console.log(`[Ctr.svgSegment] dir:${dir} len:${len.toFixed()}`);
      let res;
      switch (dir) {
        case "N":
          res = `v ${-len * u}\n`;
          break;
        case "E":
          res = `h ${len * u}\n`;
          break;
        case "S":
          res = `v ${len * u}\n`;
          break;
        case "W":
          res = `h ${-len * u}\n`;
          break;
      }
      return res;
    }

    function svgQuadraticCurveTo(cx, cy, x, y) {
      return `q ${cx * u} ${cy * u} ${x * u} ${y * u}\n`;
    }

    // Make an arrow @ current location in @dir direction
    function svgArrow(dir) {
      const u = U.pxPerMm;
      let lenP = t.arrowLengthMm * u;
      let widthP = t.arrowWidthMm * u;
      let res = "";
      switch (dir) {
        case "N":
          lenP = -lenP;
        // eslint-disable-next-line no-fallthrough
        case "S":
          res += `m ${- widthP} ${- lenP}\n`;
          res += `l ${widthP} ${lenP}\n`;
          res += `l ${widthP} ${-lenP}\n`;
          break;
        case "W":
          lenP = -lenP;
        // eslint-disable-next-line no-fallthrough
        case "E":
          res += `m ${- lenP} ${- widthP}\n`;
          res += `l ${lenP} ${widthP}\n`;
          res += `l ${- lenP} ${widthP}\n`;
          break;
      }
      return res;
    }

    this.styles = hElems.getElemById(this.from.id).styles;
    const s = this.styles;
    // console.log(`[Ctr.paint] (${this.id}) styles:${JSON.stringify(this.styles)}`);
    // console.log(`[Ctr.paint] (${this.id}) startId:${this.from.id} baseColor:${baseColor} ${this.segments.length} segments (x0:${x0}, y0:${y0})`);
    let lineWidth, strokeStyle;
    if (!this.isLegal()) {
      lineWidth = s.trLineErrorWidth;
      strokeStyle = s.trLineError;
      if (this.tag) this.tag.color = s.trLineError;
      // console.log(`[Ctr.paint] (${this.id}) tag.color:${this.tag.color}`);
    }
    else {
      if (this.isSelected || this.id == hCtx.selectedId) lineWidth = s.trLineSelectedWidth;
      else lineWidth = s.trLineWidth;
      strokeStyle = s.trLine;
    }
    let svg = "";
    // console.log(`[Ctr.paint] (${this.id}) ${segments.length} segments len0:${segments[0].len}`);
    let [x0, y0] = T.anchorToXYF(this.from);
    this.childElem.style.top = y0 * U.pxPerMm + "px";
    this.childElem.style.left = x0 * U.pxPerMm + "px";
    // console.log(`[Ctr.paint] (${this.id}) from:${this.from.id} x0:${x0.toFixed()} y0:${y0.toFixed()}`);
    if (!segments.length || (segments.length == 1 && segments[0].len == 0)) {
      // console.log(`[Ctr.paint] (${this.id}) Degenerate`);
      svg = `<svg version="1.1" viewBox="0 0 ${fx[0] * U.pxPerMm} ${fx[1] * U.pxPerMm}"
  xmlns="http://www.w3.org/2000/svg">
  <circle stroke="transparent"  fill="${strokeStyle}" cx="${x0}mm" cy="${y0}mm" r="${t.errorDotRadiusMm}mm" />
  > </svg>`;
    } else {
      // svg = `<svg version="1.1" viewBox="0 0 ${fx[0] * U.pxPerMm} ${fx[1] * U.pxPerMm}" xmlns="http://www.w3.org/2000/svg">`;
      svg += `<path stroke="${strokeStyle}" stroke-width="${lineWidth}" stroke-linecap="butt" stroke-linejoin="bevel" fill="transparent" d=`;
      // let [x1, y1] = T.anchorToXYF(this.to);
      // console.log(`[Ctr.paint] (${this.id}) dx:${(x1 - x0).toFixed()} dx:${(y1 - y0).toFixed()}`);

      svg += `"M ${x0 * u} ${y0 * u}\n`;
      let radius1 = 0;
      let curDir;
      const maxIdx = segments.length - 1;
      for (let idx in segments) {
        idx = Number(idx);
        let segment = segments[idx];
        let len = segment.len;
        if (len == 0) continue;
        if (len <= 0) console.error(`[Ctr.paint] (${idx}) seg#${idx}: len:${segment.len} dir:${segment.dir}`);
        // console.warn(`[segments.paint] (${idx}) seg#${idx}: len:${segment.len} dir:${segment.dir}`);
        let nextSeg = null;
        for (let idn = idx + 1; idn <= maxIdx; idn++) {
          if (segments[idn].len == 0) continue;
          nextSeg = segments[idn];
          break;
        }
        curDir = segment.dir;
        let radius2 = r;
        if (radius2 > segment.len / 2) radius2 = segment.len / 2;
        if (!nextSeg) radius2 = 0;
        else if (radius2 > nextSeg.len / 2) radius2 = nextSeg.len / 2;
        len = len - radius1 - radius2;
        svg += svgSegment(segment.dir, len);
        let [x, y] = [0, 0];
        let [cpx, cpy] = [x, y];
        // console.log(`[Ctr.paint] (${this.id}) radius1:${radius1.toFixed()} radius2:${radius2.toFixed()}`);
        if (radius2) {
          switch (segment.dir) {
            case "N":
              y -= radius2;
              x += nextSeg.dir == "E" ? radius2 : -radius2;
              cpy = y;
              break;
            case "S":
              y += radius2;
              x += nextSeg.dir == "E" ? radius2 : -radius2;
              cpy = y;
              break;
            case "E":
              x += radius2;
              y += nextSeg?.dir == "S" ? radius2 : -radius2;
              cpx = x;
              break;
            case "W":
              x -= radius2;
              y += nextSeg?.dir == "S" ? radius2 : -radius2;
              cpx = x;
              break;
          }
          svg += svgQuadraticCurveTo(cpx, cpy, x, y);
          // svg += "q 10 0 10 10";
          radius1 = radius2;
        }
      }
      // svg += `L ${x1 * u} ${y1 * u} \n`;
      if (curDir) svg += svgArrow(curDir);
      svg += `">`;
      // svg +=`</svg>`;
    }
    svg = svg.replace(/ +/g, " ");
    svg = svg.replace(/\n/g, " "); // Poses problem when printing to PDF
    // console.log(`[Ctr.paint] (${this.id}) svg:${svg}`);
    this.svgElem.innerHTML = svg;
    this.tag.setVisibility(U.isJunction(this.from.id) ? false : true);
  }

  makeTag() {
    let text = "";
    if (this.trigger) text += `[${this.trigger}]`;
    if (this.guard) text += `[${this.guard}]`;
    if (this.effect) text += `/${this.effect}`;
    if (this.text == text) return;
    this.text = text;
    this.tag.setText(text);
    // console.log(`[Ctr.makeTag] (${this.id}) } text:${text}`);
  }

  setSelected(val) {
    // console.log(`[Ctr.setSelected] (${this.id}) } setSelected:${val}`);
    super.setSelected(val);
    if (val) this.raise();
    if (this.tag.isSelected != val) this.tag.setSelected(val);
    this.paint();
  }

  findNearestLegalTarget(anchor, x0, y0) {
    // console.log(`[Ctr.findNearestTarget] (${this.id}) x0:${x0.toFixed()} y0:${y0.toFixed()}`);
    const r = hsm.settings.stateRadiusMm;
    let bestDist = Number.MAX_VALUE;
    let bestSide = "T";
    let bestElem;
    let bestPos;

    function visit(myElem) {
      if (myElem.id.startsWith("S") || myElem.id.startsWith("J")) {
        for (let mySide of ["T", "R", "B", "L"]) {
          // if ((anchor.id == myElem.id) && (anchor.side != mySide)) continue;
          let myV = myElem.makeTrXY(mySide, 0);
          if (!myV) continue; // Manage junctions
          let [myX0, myY0] = myV;
          const elemXYF = myElem.getOriginXYF();
          myX0 += elemXYF[0]; myY0 += elemXYF[1];
          let [myX1, myY1] = myElem.makeTrXY(mySide, 1);
          myX1 += elemXYF[0]; myY1 += elemXYF[1];
          const [d, pos] = U.distToSegmentSquared({ x: x0, y: y0 }, { x: myX0, y: myY0 }, { x: myX1, y: myY1 });
          // if (anchor.id == myElem.id) console.log(`[Ctr.findNearestTarget] anchor.side:${anchor.side} mySide:${mySide} bestDist:${bestDist.toFixed()} dist:${d}`);

          if (d < bestDist) {
            bestDist = d;
            bestElem = myElem;
            bestPos = pos;
            bestSide = mySide;
          }
        }
      }
      for (let elem1 of myElem.children) {
        visit(elem1);
      }
      if (myElem.junctions)
        for (let elem1 of myElem.junctions) {
          visit(elem1);
        }
    }
    visit(hCtx.folio);
    return [bestElem, bestSide, bestPos];
  }


  async dragStart(xP, yP) {
    // console.log(`[Ctr.dragStart] (${this.id})`);
    const idz = this.idz();
    // if (modeRef.value == "") {
    const trDragCtx = {
      id: this.id,
      zone: idz.zone,
      type: idz.type,
      xx0: idz.x,
      yy0: idz.y,
      // x0: this.geo.x0,
      // y0: this.geo.y0,
      tr0: {
        from: structuredClone(this.from),
        to: structuredClone(this.to),
        segments: structuredClone(this.segments)
      }
    };
    // console.log(`[Ctr.dragStart] trDragCtx:${JSON.stringify(trDragCtx)}`);
    hCtx.setDragCtx(trDragCtx);
    // }
    window.windump = true;
    return this;
  }

  drag(dxP, dyP) {
    const dragCtx = hCtx.getDragCtx();
    const s0 = hCtx.folio.geo.mat.a;
    const [dx, dy] = [dxP / U.pxPerMm / s0, dyP / U.pxPerMm / s0];
    if (dragCtx.zone == "FROM") T.dragFromAnchor(dx, dy);
    else if (dragCtx.zone == "TO") T.dragToAnchor(dx, dy);
    else if (dragCtx.zone == 0) T.dragFirstSegment(this, dx, dy);
    else if (dragCtx.zone == this.segments.length - 1) T.dragLastSegment(this, dx, dy);
    else T.dragNormalSegment(this, dx, dy);
    this.paint();
  }

  openDialog() {
    hsm.setSelected(this.id);
    hsm.openDialog(TrDialog, this);
  }

  dragEnd(dx, dy) {
    // console.log(`[Ctr.dragEnd]`);
    this.drag(dx, dy);
    this.segments = removeNullSegments(this.segments);
    this.segments = segsNormalise(this.segments);;
    this.paint();
    delete this.from.prevX;
    delete this.from.prevY;
    delete this.to.prevX;
    delete this.to.prevY;
    // console.log(`[Ctr.dragEnd] this.segments:${JSON.stringify(this.segments)}`);
    if (this.justCreated == true) {
      hsm.openDialog(TrDialog, this);
      delete this.justCreated;
    }
    if (hCtx.getErrorId() == this.id) {
      return false;
    }
    window.windump = false;
    // hsm.clearSelections();
    return true;
  }

  createSimpleSegments() {
    let segments = [];
    const [x0, y0] = T.anchorToXYF(this.from);
    const [x1, y1] = T.anchorToXYF(this.to);
    [this.from.prevX, this.from.prevY] = [x0, y0];
    [this.to.prevX, this.to.prevY] = [x1, y1];
    segments = T.createSegments(this);
    // console.warn(`[Ctr.createSimpleSegments] (${this.id}) prevX:${this.from.prevX} prevY:${this.from.prevY}`);
    // console.log(`[Ctr.createSimpleSegments] Segments:${JSON.stringify(segments)}`);
    return segments;
  }

  click(x, y) {
    console.log(`[Ctr.click] (${this.id})`);
    T.reverseTr(this);
  }

  C(val) {
    const x = U.mmToPL(val);
    if (!this.lineWidth % 2) return Math.round(x);
    return Math.round(x) + 0.5;
  }

  adjustXy(dx, dy, minseg = 0) {
    // console.log(`[Ctr.adjustXy] dx:${dx} dy:${dy}`);
    const r = hsm.settings.styles.tr.maxTransRadiusMm;
    for (let idx in this.segments) {
      idx = Number(idx);
      const segment = this.segments[idx];
      switch (segment.dir) {
        case "W":
          if (minseg && segment.len + dx < minseg) break;
          segment.len += dx;
          if (segment.len < 0) {
            segment.dir = "E";
            segment.len = - segment.len;
          }
          dx = 0;
          break;
        case "E":
          if (minseg && segment.len - dx < minseg) break;
          segment.len -= dx;
          if (segment.len < 0) {
            segment.dir = "W";
            segment.len = - segment.len;
          }
          dx = 0;
          break;
        case "S":
          if (minseg && segment.len - dy < minseg) break;
          segment.len -= dy;
          if (segment.len < 0) {
            segment.dir = "N";
            segment.len = - segment.len;
          }
          dy = 0;
          break;
        case "N":
          if (minseg && segment.len + dy < minseg) break;
          segment.len += dy;
          if (segment.len < 0) {
            segment.dir = "S";
            segment.len = - segment.len;
          }
          dy = 0;
          break;
      }
    }
    return [dx, dy];
  }

  myAdjustXy(dx, dy) {
    // console.log(`[Ctr.myAdjustXy] dx:${dx} dy:${dy}`);
    const r = hsm.settings.stateRadiusMm;
    let [ddx, ddy] = this.adjustXy(dx / 2, dy / 2, r);
    this.segments = this.segments.reverse();
    [dx, dy] = this.adjustXy(dx - dx / 2 + ddx, dy - dy / 2 + ddy, r);
    this.segments = this.segments.reverse();
    if (dx != 0 || dy != 0) {
      let [ddx, ddy] = this.adjustXy(dx / 2, dy / 2);
      this.segments = this.segments.reverse();
      [dx, dy] = this.adjustXy(dx - dx / 2 + ddx, dy - dy / 2 + ddy);
      this.segments = this.segments.reverse();
    }
    if (dx != 0 || dy != 0) {
      this.segments = this.createSimpleSegments();
    }
    return [0, 0];
  }

  isLegal() {
    // console.log(`[Ctr.isLegal] id:${this.id} segments:${this.segments}`);
    if (this.segments.length == 0) return false;
    if (this.segments.length == 1 && this.segments[0].len == 0) return false;
    const fromState = hElems.getElemById(this.from.id);
    const goesToOutside = U.goesToOutside(this.from.side, this.segments[0].dir);
    const goesToInside = U.goesToInside(this.from.side, this.segments[0].dir);
    const lastSeg = this.segments[this.segments.length - 1];
    const comesFromOutside = U.comesFromOutside(this.to.side, lastSeg.dir);
    const comesFromInside = U.comesFromInside(this.to.side, lastSeg.dir);
    const fromJunction = U.isJunction(this.from.id);
    const toJunction = U.isJunction(this.to.id);
    if (this.from.id == this.to.id) {
      if (U.isJunction(this.from.id)) return false;
      if (this.from.side != this.to.side) return false;
      if (this.from.pos == this.to.pos) return false;
      if (this.isInternal) {
        if (!comesFromInside || !goesToInside) return false;
      }
      else if (!goesToOutside || !comesFromOutside) return false;
      return true;
    }
    if (fromState.isSuperstate(this.to.id)) {
      if (!goesToInside) return false;
      if (!toJunction && !comesFromOutside) return false;
      return true;
    }
    if (fromState.isSubstate(this.to.id)) {
      if (!comesFromInside) return false;
      if (!fromJunction && !goesToOutside) return false;
      return true;
    }
    if (!fromJunction && !goesToOutside) return false;
    if (!toJunction && !comesFromOutside) return false;
    return true;
  }

  patchAnchor(anchor) {
    if (!U.isJunction(anchor.id)) return false;
    const orientation = hElems.getElemById(anchor.id).orientation;
    const side = anchor.side;
    let newSide = null;
    if (orientation == "horizontal") {
      if (side == "L") newSide = "T";
      else if (side == "R") newSide = "B";
    } else {
      if (side == "T") newSide = "L";
      else if (side == "B") newSide = "R";
    }
    if (!newSide) return false;
    anchor.side = newSide;
    return true;
  }

  invertAnchorSide(anchor) {
    switch (anchor.side) {
      case "T": anchor.side = "B"; break;
      case "R": anchor.side = "L"; break;
      case "B": anchor.side = "T"; break;
      case "L": anchor.side = "R"; break;
    }
  }

  // Adjusts existing segments to new From/To
  adjustSegments() {
    // console.log(`[Ctr.adjustSegments] prevX:${this.from.prevX} prevY:${this.from.prevY}`);
    if (this.patchAnchor(this.from) || this.patchAnchor(this.to)) {
      this.segments = this.createSimpleSegments();
      return;
    }
    if (this.segments.length == 0) this.segments = this.createSimpleSegments();
    if (this.from.prevX == undefined || this.from.prevY == undefined) {
      // first time, segments is supposed to be OK
      // console.log(`[Ctr.adjustSegments] First time`);
      [this.from.prevX, this.from.prevY] = T.anchorToXYF(this.from);
      [this.to.prevX, this.to.prevY] = T.anchorToXYF(this.to);
      return;
    }
    const [xFrom, yFrom] = T.anchorToXYF(this.from); // In folio frame
    let [dxFrom, dyFrom] = [xFrom - this.from.prevX, yFrom - this.from.prevY];
    if (dxFrom != 0 || dyFrom != 0) {
      [dxFrom, dyFrom] = this.myAdjustXy(dxFrom, dyFrom);
    }
    [this.from.prevX, this.from.prevY] = [xFrom, yFrom];
    const [xTo, yTo] = T.anchorToXYF(this.to);
    let [dxTo, dyTo] = [xTo - this.to.prevX, yTo - this.to.prevY];
    if (dxTo != 0 || dyTo != 0) {
      [dxTo, dyTo] = this.myAdjustXy(-dxTo, -dyTo);
      if (dxTo != 0 || dyTo != 0) console.error(`[Ctr.adjustSegments] BAD dxTo:${dxTo} dyTo:${dyTo}`);
    }
    if (this.segments.length && (
      (U.isHoriz(this.from.side) && U.isHoriz(this.segments[0].dir)) ||
      (!U.isHoriz(this.from.side) && !U.isHoriz(this.segments[0].dir)) ||
      (U.isHoriz(this.to.side) && U.isHoriz(this.segments[this.segments.length - 1].dir)) ||
      (!U.isHoriz(this.to.side) && !U.isHoriz(this.segments[this.segments.length - 1].dir))
    )) this.segments = this.createSimpleSegments();
    else[this.to.prevX, this.to.prevY] = [xTo, yTo];
    this.segments = segsNormalise(this.segments);;
  }

  adjustTrAnchors(changedId) {
    if (!changedId) this.adjustSegments();
    else {
      if (changedId == this.from.id || changedId == this.to.id || changedId == this.id) {
        // console.log(`[Ctr.adjustTrAnchors](${this.id}) changedId:${changedId}`);
        this.adjustSegments();
      }
    }
  }

  adjustChange(changedId) {
    this.adjustSegments();
  }

  makeIdz(x, y, idz) {
    // [x,y] in mm in this tr frame
    // console.log(`[Ctr.makeIdz](${this.id}) id: ${idz.id} zone: ${idz.zone}`);
    let [x0, y0] = T.anchorToXYF(this.from);
    let [xt, yt] = T.anchorToXYF(this.to);
    let bestD2 = Number.MAX_VALUE;
    let bestZone = "TO";
    let bestType;
    let newIdz;
    // const m = (hsm.settings.cursorMarginP / U.pxPerMm) / hCtx.folio.geo.scale;
    const m = U.pxToMm(hsm.settings.cursorMarginP);
    const m2 = m * m;
    if (((x - x0) ** 2 + (y - y0) ** 2 <= m2)) {
      return { id: this.id, zone: "FROM", type: "A", dist2: 0, x: x, y: y }; // Force an anchor
    }
    if (((x - xt) ** 2 + (y - yt) ** 2 <= m2)) {
      return { id: this.id, zone: "TO", type: "A", dist2: 0, x: x, y: y }; // Force an anchor
    }
    for (let idx in this.segments) {
      idx = Number(idx);
      let segment = this.segments[idx];
      let [x1, y1] = [x0, y0];
      switch (segment.dir) {
        case "N":
          y1 = y0 - segment.len;
          break;
        case "E":
          x1 = x0 + segment.len;
          break;
        case "S":
          y1 = y0 + segment.len;
          break;
        case "W":
          x1 = x0 - segment.len;
          break;
      }
      let [d2, pos] = U.distToSegmentSquared({ x: x, y: y }, { x: x0, y: y0 }, { x: x1, y: y1 });
      // if (this.id == "T5") console.log(`[Ctr.makeIdz](${this.id}) (x:${x.toFixed()}, y:${y.toFixed()}) dir:${segment.dir} (x0:${x0.toFixed()}, y0:${y0.toFixed()}) (x1:${x1.toFixed()}, y1:${y1.toFixed()  }) idx:${idx} d2:${d2.toFixed()}`);
      [x0, y0] = [x1, y1];
      if ((idx == this.segments.length - 1) && ((x - x1) ** 2 + (y - y1) ** 2 < m2)) {
        return {
          id: this.id, zone: "TO", type: "A", dist2: 0, x: x, y: y
        };
      }
      if (d2 <= bestD2) {
        let type = "V";
        if (segment.dir == "E" || segment.dir == "W") type = "H";
        let zone = idx;
        bestType = type;
        bestZone = zone;
        bestD2 = d2;
      }
    }
    newIdz = { id: this.id, zone: bestZone, type: bestType, dist2: bestD2, x: x, y: y };
    for (let child of this.children) {
      newIdz = child.makeIdzInParentCoordinates(x, y, newIdz);
    }
    return newIdz;
  }

  makeIdzInParentCoordinates(xp, yp, myIdz) {
    // console.log(`[Ctr.makeIdzInParentCoordinates](${this.id})`);
    [xp, yp] = [xp * U.pxPerMm, yp * U.pxPerMm];
    let [x, y] = applyToPoint(this.geo.matR, [xp, yp]);
    [x, y] = [x / U.pxPerMm, y / U.pxPerMm];
    const idz = this.makeIdz(x, y, myIdz);
    return idz;
  }
}
