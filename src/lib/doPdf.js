"use strict";

import * as U from "src/lib/utils";

let myWin;

export async function doPdf(myHtml) {
  console.log(`[doPdf.doPdf]`);
  let pdfString = await window.hsm2Api.printToPDF(myHtml);
  const blob = new Blob([pdfString], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  myWin = window.open(url, '_blank');
}
