
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
  mdstr = mdstr.replace(/\*\*\*(\w.*?[^\\])\*\*\*/gm, `${BAD}B<em>I$1${BAD}P${BAD}P`);
  mdstr = mdstr.replace(/\*\*(\w.*?[^\\])\*\*/gm, `${BAD}B$1${BAD}P`);
  mdstr = mdstr.replace(/\*(\w.*?[^\\])\*/gm, `${BAD}I$1${BAD}P`);
  mdstr = mdstr.replace(/___(\w.*?[^\\])___/gm, `${BAD}B${BAD}I$1${BAD}P${BAD}P`);
  mdstr = mdstr.replace(/__(\w.*?[^\\])__/gm, `${BAD}U$1${BAD}P`);
  mdstr = mdstr.replace(/_(\w.*?[^\\])_/gm, `${BAD}C$1${BAD}P`);  // NOT support!!
  mdstr = mdstr.replace(/\^\^\^(.+?)\^\^\^/gm, `${BAD}H$1${BAD}P`);
  mdstr = mdstr.replace(/\^\^(\w.*?)\^\^/gm, `${BAD}S$1${BAD}P`);
  mdstr = mdstr.replace(/~~(\w.*?)~~/gm, `${BAD}D$1${BAD}P`);

  // Escaping Characters
  return mdstr.replace(/\\([`_~*+\-.^\\<>()[\]])/gm, '$1');
}

const inchInMm = 25.4;

export function doCanvas(parsedStr, scale = 1, textColor = "black", bgColor = "transparent") {
  const maxIdx = parsedStr.length - 1;
  if (maxIdx < 0) return;
  function toC(lenMm) {
    return Math.round(lenMm * scale * ((hsm.settings.screenDpi / inchInMm)));
  }

  const w0 = hCtx.folio.geo.width;
  const h0 = hCtx.folio.geo.width;
  const s = hsm.settings.styles.note1;
  let hMargin = 2;
  let vMargin = 2;
  const canvas = document.createElement("canvas");
  canvas.width = toC(w0 + 2 * hMargin);
  canvas.height = toC(h0 + 2 * vMargin);
  const ctx = canvas.getContext("2d");
  let hMaxP = 0;
  let curHeight = s.heightMm;
  let curFont = s.font; // sans-serif
  let curBg = bgColor;
  let curColor = textColor;
  let curWeight = ""; // "", bold
  let curStyle = ""; // "", italic
  let curLine = ""; // "", strike, underline
  let curHighlight = ""; // "", highlight
  let curScript = ""; // "", sub, super

  let stack = [];
  let frag = [];
  let xP = 0;
  const yP = toC(s.h1.heightMm + vMargin); // Highest height

  function flush() {
    // Flush existing frag
    if (!frag.length) return;
    ctx.font = `${curHeight}mm ${curFont} ${curWeight} ${curStyle}`;
    ctx.fillStyle = textColor;
    ctx.fillText(
      frag,
      xP,
      yP,
    );
    const tm = ctx.measureText(frag);
    xP += tm.width;
    if (tm.height > hMaxP) hMaxP = tm.height;
  }

  for (let i = 0; i < maxIdx; i++) {
    let c = parsedStr[i];
    // console.log(c);
    if (c == BAD) {
      flush();
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
      const curC = { height: curHeight, font: curFont, bg: curBg, color: curColor, weight: curWeight, style: curStyle, line: curLine, highlight: curHighlight, script: curScript };
      stack.push(curC);
      switch (c) {
        case "B": // Bold
          curWeight = "bold";
          break;
        case "I": // Bold
          curStyle = "italic";
          break;
        case "U": // Underline
          curLine = "underline";
          break;
        case "H": // Highlight
          curHighlight = "highlight";
          break;
        case "S": // Superscript
          curScript = "super";
          break;
        case "D": // StrikeThrough
          curLine = "strike";
          break;
        case "C": // Subscript
          curScript = "sub";
          break;
        default:
          console.error(`[md.doCanvas] Unknown style  "${c}"`);
      }
      continue;
    }
    else frag.push(c);
  }
  flush();
  return canvas;
}

export function md(str) {
  const parsedStr = mdParser(str);
  console.log(`[md.md] str:${str}\nres:${parsedStr}`);
  // for (let c of parsedStr) {
  //   console.log(c);
  // }
  return doCanvas(parsedStr);

}
