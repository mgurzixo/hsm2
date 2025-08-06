
"use strict";

import { hsm, hCtx, } from "src/classes/Chsm";

const BAD = "\uD83D"; // Invalid UTF16

// Cf. https://github.com/casualwriter/casual-markdown/blob/main/source/casual-markdown.js
function mdParser(mdstr) {

  // function for REGEXP to convert html tag. ie. <TAG> => &lt;TAG*gt;
  // function formatTag(html) { return html.replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // apply yaml variables
  // for (var name in this.yaml) mdstr = mdstr.replace(new RegExp('{{\\s*' + name + '\\s*}}', 'gm'), this.yaml[name]);


  mdstr = mdstr.replace(/^##### (.*?)\s*#*$/gm, `${BAD}5$1${BAD}P`)
    .replace(/^#### (.*?)\s*#*$/gm, `${BAD}4$1${BAD}P`)
    .replace(/^### (.*?)\s*#*$/gm, `${BAD}3$1${BAD}P`)
    .replace(/^## (.*?)\s*#*$/gm, `${BAD}2$1${BAD}P`)
    .replace(/^# (.*?)\s*#*$/gm, `${BAD}1$1${BAD}P`);

  // text decoration: bold, italic, underline, strikethrough, highlight
  // ***Bold Italic***
  mdstr = mdstr.replace(/\*\*\*(\w.*?[^\\])\*\*\*/gm, `${BAD}B${BAD}I$1${BAD}P${BAD}P`);
  // **Bold**
  mdstr = mdstr.replace(/\*\*(\w.*?[^\\])\*\*/gm, `${BAD}B$1${BAD}P`);
  // *Italic*
  mdstr = mdstr.replace(/\*(\w.*?[^\\])\*/gm, `${BAD}I$1${BAD}P`);
  // ___Bold Italic___
  mdstr = mdstr.replace(/___(\w.*?[^\\])___/gm, `${BAD}B${BAD}I$1${BAD}P${BAD}P`);
  // __Underline__
  mdstr = mdstr.replace(/__(\w.*?[^\\])__/gm, `${BAD}U$1${BAD}P`);
  // _Subscript_
  mdstr = mdstr.replace(/_(\w.*?[^\\])_/gm, `${BAD}C$1${BAD}P`);  // NOT support!!
  // ^^^Highlight^^^
  mdstr = mdstr.replace(/\^\^\^(.+?)\^\^\^/gm, `${BAD}H$1${BAD}P`);
  // ^^Superscript^^
  mdstr = mdstr.replace(/\^\^(\w.*?)\^\^/gm, `${BAD}S$1${BAD}P`);
  // ~~StrikeThrough
  mdstr = mdstr.replace(/~~(\w.*?)~~/gm, `${BAD}D$1${BAD}P`);

  // Escaping Characters
  return mdstr.replace(/\\([`_~*+\-.^\\<>()[\]])/gm, '$1');
}


function bgFillRect(myCtx, bgColor, x0P, y0P, widthP, heightP) {
  if (bgColor != "transparent") {
    myCtx.fillStyle = bgColor;
    myCtx.fillRect(x0P, y0P, widthP, heightP);
  }
}

export function doCanvas(parsedStr, scale = 1, textColor = "black", bgColor = "transparent") {
  const maxIdx = parsedStr.length - 1;
  if (maxIdx < 0) return;
  const inchInMm = 25.4;

  function toI(lenMm) {
    return Math.round(lenMm * scale * ((hsm.settings.screenDpi / inchInMm)));
  }
  function toR(lenMm) {
    return Math.round(lenMm * scale * ((hsm.settings.screenDpi / inchInMm)) + 0.5);
  }

  // console.log(`[md.doCanvas] scale:${scale}`);
  const s = hsm.settings.styles.note1;
  const w0 = hCtx.folio.geo.width * scale;
  const h0 = s.h1.heightMm * scale;
  // console.log(`[md.doCanvas] s:${JSON.stringify(s)}`);
  const hMarginP = s.marginP;
  const wMarginP = s.marginP;
  const canvas = document.createElement("canvas");
  const canvasMaxWidthP = toI(w0) + 2 * hMarginP;
  canvas.width = canvasMaxWidthP;
  canvas.height = toI(h0) + 2 * wMarginP + 10;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  let curHeight = s.text.heightMm * scale;
  let curFont = s.text.font; // sans-serif
  let curBg = bgColor;
  let curColor = textColor;
  let curWeight = ""; // "", bold
  let curStyle = ""; // "", italic
  let curLine = ""; // "", strike, underline
  let curHighlight = ""; // "", highlight
  let curScript = ""; // "", sub, super

  let stack = [];
  let frag = "";
  let xP = 0;
  let yP = 0;
  let wMaxP = xP;
  let hMaxP = yP;

  function flush(text) {
    // console.log(`[md.flush] Text:"${text}"`);
    // Flush existing frag
    if (!text.length) return;
    let spaceBefore = false;
    let spaceAfter = false;
    const f0 = `${curHeight}mm ${curFont}`;
    ctx.font = f0;
    const fontHeightRawP = parseFloat(ctx.font);
    const fontHeightP = Math.round(fontHeightRawP);
    const f3 = `${curStyle} ${curWeight} ${fontHeightP}px ${curFont}`.trim();
    ctx.font = f3;
    // console.log(`[md.flush] curHeight:${curHeight}mm" f0:"${f0}" rawP:"${fontHeightRawP}" heightP:"${fontHeightP}" f3:"${f3}"`);
    if (text == " ") {
      // cf. https://stackoverflow.com/questions/64776773/html-canvas-remove-letter-spacing-on-the-beginning-of-a-word
      const widthP = fontHeightP / 3; // Best looking
      bgFillRect(ctx, bgColor, xP, 0, widthP + 1, fontHeightP);
      xP += widthP;
      wMaxP = xP;
      return;
    }
    if (text.startsWith(" ")) spaceBefore = true;
    if (text.endsWith(" ")) spaceAfter = true;
    text = text.trim();
    if (spaceBefore) flush(" ");
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    const tm = ctx.measureText(text);
    const tmHeightP = tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent;
    const tmWidthP = tm.actualBoundingBoxLeft + tm.actualBoundingBoxRight;
    ctx.fillStyle = textColor;
    // console.log(`[md.flush] f3:"${f3}" text:"${text}" fillStyle:${ctx.fillStyle}`);
    ctx.fillText(
      text,
      xP + tm.actualBoundingBoxLeft,
      tm.actualBoundingBoxAscent,
    );
    xP += tmWidthP;
    if (tmHeightP > hMaxP) hMaxP = tmHeightP;
    wMaxP = xP;
    if (spaceAfter) flush(" ");
  }


  for (let i = 0; i <= maxIdx; i++) {
    let c = parsedStr[i];
    // console.log(c);
    if (c == BAD) {
      flush(frag);
      frag = "";
      c = parsedStr[++i];
      if (c == "P") {
        const c = stack.pop();
        curHeight = c.height;
        curFont = c.font;
        curBg = c.bg;
        curColor = c.color;
        curWeight = c.weight;
        curStyle = c.style;
        curLine = c.line;
        curHighlight = c.highlight;
        curScript = c.script;
        continue;
      }
      const curCtx = { height: curHeight, font: curFont, bg: curBg, color: curColor, weight: curWeight, style: curStyle, line: curLine, highlight: curHighlight, script: curScript };
      stack.push(curCtx);
      switch (c) {
        case "B":
          curWeight = "bold";
          break;
        case "I":
          // console.log(`[md.doCanvas] italic`);
          curStyle = "italic";
          break;
        case "U":
          curLine = "underline";
          break;
        case "H":
          curHighlight = "highlight";
          break;
        case "S":
          curScript = "super";
          break;
        case "D":
          curLine = "strike";
          break;
        case "C":
          curScript = "sub";
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
          curHeight = s["h" + c].heightMm * scale;
          curFont = s["h" + c].font;
          break;
        default:
          console.error(`[md.doCanvas] Unknown style "${c}"`);
      }
      continue;
    }
    else frag += c;
  }
  flush(frag);
  frag = "";


  // console.log(`[md.doCanvas] xP:${xP} yP:${yP}`);
  const canvas2 = document.createElement("canvas");
  canvas2.width = xP + 2 * wMarginP;
  canvas2.style.width = canvas2.width + "px";
  canvas2.height = hMaxP + 2 * hMarginP;
  canvas2.style.height = canvas2.height + "px";
  const ctx2 = canvas2.getContext("2d", { willReadFrequently: true });
  bgFillRect(ctx2, bgColor, wMarginP, hMarginP, xP, hMaxP);
  // Draw margins
  bgFillRect(ctx2, bgColor, 0, 0, wMarginP, hMaxP + 2 * hMarginP);
  bgFillRect(ctx2, bgColor, xP + wMarginP, 0, wMarginP, hMaxP + 2 * hMarginP);
  bgFillRect(ctx2, bgColor, wMarginP, 0, xP, hMarginP);
  bgFillRect(ctx2, bgColor, wMarginP, hMaxP + hMarginP, xP, hMarginP);
  ctx2.drawImage(canvas, 0, 0, wMaxP, hMaxP, wMarginP, hMarginP, wMaxP, hMaxP);
  return canvas2;
}

export function mdToCanvas(str, scale = 1, textColor = "black", bgColor = "transparent") {
  // console.warn(`[md.md] str:${str}`);
  if (str && str.length != 0) {
    const parsedStr = mdParser(str);
    // console.log(`[md.md] str:${str}\nres:${parsedStr}`);
    // for (let c of parsedStr) {
    //   console.log(c);
    // }
    return doCanvas(parsedStr, scale, textColor, bgColor);
  }
  // console.log(`[md.doCanvas] Null str`);
  const s = hsm.settings.styles.note1;
  const hMarginP = s.marginP;
  const wMarginP = s.marginP;
  const canvas2 = document.createElement("canvas");
  canvas2.width = 2 * wMarginP;
  canvas2.style.width = canvas2.width + "px";
  canvas2.height = 2 * hMarginP;
  canvas2.style.height = canvas2.height + "px";
  const ctx2 = canvas2.getContext("2d", { willReadFrequently: true });
  bgFillRect(ctx2, bgColor, 0, 0, canvas2.width, canvas2.height);
}
