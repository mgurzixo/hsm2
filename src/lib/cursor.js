"use strict";

import * as U from "src/lib/utils";
import * as V from "vue";
import { hsm, cCtx, hCtx, modeRef } from "src/classes/Chsm";

function assets(icon, defVal) {
  // return `url(../assets/${icon}) 8 8, ${defVal}`;
  const assetsDir = new URL(/* @vite-ignore */ `../assets`, import.meta.url).href;
  const val = `url(${assetsDir}/cursors/${icon}) 8 8, ${defVal}`;
  // console.log(`[CbaseElem.assets] val:${val}`);
  return val;
}

export function defineCursor(idz) {
  let cursor;
  let elem = U.getElemById(idz.id);
  // console.log(`[cursor.defineCursor] (${idz.id}) mode:'${modeRef.value}' zone:${idz.zone}`);

  if (modeRef.value == "inserting-state") {
    // console.log(`[cursor.defineCursor] in IS (${idz.id}) id:${idz.id} zone:${idz.zone}`);
    if (idz.id.startsWith("F") || idz.id.startsWith("R")) {
      if (elem.canInsertState(idz)) return assets("state16x16.png", "default");
      // if (elem.canInsertState(idz)) return "grabbing";
      else return assets("no-drop16x16.png", "no-drop");
    }
    return assets("no-drop16x16.png", "no-drop");
  }
  else if (modeRef.value == "inserting-trans") {
    // console.log(`[cursor.defineCursor] in IT (${idz.id}) id:${idz.id} zone:${idz.zone}`);
    if (idz.id.startsWith("S")) {
      if (elem.canInsertTr(idz)) return assets("anchor16x16.png", "default");
      // if (elem.canInsertState(idz)) return "grabbing";
      else return assets("no-drop16x16.png", "no-drop");
    }
    return assets("no-drop16x16.png", "no-drop");
  }
  else if (modeRef.value == "inserting-note") {
    // console.log(`[cursor.defineCursor] in IT (${idz.id}) id:${idz.id} zone:${idz.zone}`);
    if (idz.id.startsWith("F") || idz.id.startsWith("S")) {
      if (elem.canInsertNote(idz)) return assets("note16x16.png", "default");
      // if (elem.canInsertState(idz)) return "grabbing";
      else return assets("no-drop16x16.png", "no-drop");
    }
    return assets("no-drop16x16.png", "no-drop");
  }

  // if (hCtx.getErrorId() == idz.id) {
  //   cursor = assets("no-drop16x16.png", "no-drop");
  //   return cursor;
  // }
  // console.log(`[cursor.defineCursor] in Default (${idz.id}) id:${idz.id} zone:${idz.zone} type:${idz.type}`);
  if (Number.isInteger(idz.zone)) {
    if (idz.type == "V") cursor = "col-resize";
    else cursor = "row-resize";
  }
  else switch (idz.zone) {
    case "FROM":
    case "TO":
      cursor = assets("anchor16x16.png", "default");
      break;
    case "M":
      // cursor = "no-drop";
      if (idz.id.startsWith("F")) cursor = "default";
      else cursor = "move";
      break;
    case "TL":
      cursor = "nw-resize";
      break;
    case "BL":
      cursor = "sw-resize";
      break;
    case "TR":
      cursor = "ne-resize";
      break;
    case "BR":
      cursor = "se-resize";
      break;
    case "T":
      cursor = "n-resize";
      break;
    case "B":
      cursor = "s-resize";
      break;
    case "L":
      cursor = "w-resize";
      break;
    case "R":
      cursor = "e-resize";
      break;
    case "E":
      cursor = "text";
      break;
    default:
      cursor = "default";
  }
  // console.log(`[cursor.defineCursor] res (${idz.id}) zone:${idz.zone} cursor:${cursor}`);
  return cursor;
}

let cursorDiv;

export function setCursor(idz) {
  const cursor = defineCursor(idz);
  if (!cursorDiv) cursorDiv = document.getElementById("myCanvas");
  // console.log(`[cursor.defineCursor] cursorDiv:${cursorDiv} cursor:${cursor}`);
  cursorDiv.style.cursor = cursor;
}
