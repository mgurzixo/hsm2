"use strict";

import * as U from "src/lib/utils";
import { hsm, hCtx } from "src/classes/Chsm";
import mdCss from "src/css/markdown.css?raw";
import katexCss from "src/css/katex.min.css?raw";

let myWin;

let first = true;

export async function doPdf() {
  const XMLS = new XMLSerializer();
  const el = document.getElementById("F1");
  // Tricky, but it works and there is no flickering :)
  const m1 = document.getElementById("M1");
  m1.style.display = "hidden";
  hsm.setPrinting(true);
  const myBody = XMLS.serializeToString(el);
  hsm.setPrinting(false);
  m1.style.display = "block";
  const myHtml = `
        data:text/html;charset=utf-8,<head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>${hCtx.folio.name}</title>
        </head>
        <body style="margin: 0; padding: 0;">
  ${myBody}
        </body>`;

  const page = {
    html: myHtml,
    title: hCtx.folio.name,
    options: { printBackground: true, pageSize: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } },
    css: [mdCss, katexCss],
  };
  if (first) {
    page.css = [mdCss, katexCss];
    first = false;
  }
  // console.log(`[toNative.doPdf]`);
  let pdfString = await window.hsm2Api.printToPDF(page);
  const blob = new Blob([pdfString], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  myWin = window.open(url, '_blank');
}

export async function dialogOpen(options) {
  let filePath = await window.hsm2Api.dialogOpen(options);
  // console.log(`[toNative.dialogOpen] filePath:${filePath}`);
  return filePath;
}
