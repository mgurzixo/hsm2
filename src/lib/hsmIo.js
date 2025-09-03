"use strict";

import * as U from "src/lib/utils";
import pako from "pako";
import JSON5 from "json5";
import { notify, notifyError, notifyOk, notifyWarning } from "src/lib/notify";
import { hsm } from "src/classes/Chsm";

function readHsm(filePath) {
  let json;
  try {
    if (filePath.endsWith(".hsm2")) {
      const blob = window.hsm2Api.fsRead(filePath);
      let buf = pako.ungzip(blob);
      let utf8decoder = new TextDecoder();
      json = utf8decoder.decode(buf);
    } else {
      json = window.hsm2Api.fsRead(filePath, "utf8");
    }
    const hsm = JSON5.parse(json);
    return hsm;
  } catch (error) {
    let str = `[io.readHsm] error:${error}`;
    console.warn(str);
    notifyWarning(str);
    return null;
  }
}

export function writeHsm(filePath, hsm, pretty = true) {
  try {
    const json = pretty ? JSON.stringify(hsm, null, 2) : JSON.stringify(hsm);
    let res;
    if (filePath.endsWith(".hsm2")) {
      const gzip = pako.gzip(json);
      const blob = new Blob([gzip], { type: "application/x-hsm2" });
      res = window.hsm2Api.fsWrite(filePath, blob);
    } else {
      res = window.hsm2Api.fsWrite(filePath, json);
    }
    return true;
  } catch (error) {
    let str = `[io.writeHsm] error:${error}`;
    console.error(str);
    notifyError(str);
    return false;
  }
}

export async function loadHsm(filePath = "./Aaa.json5") {
  // console.log(`[hsmio.loadHsm] filePath:${filePath}`);
  const hsmObj = readHsm(filePath);
  if (hsm && hsmObj) {
    // Update currentDirectory for dialog prepositioning
    if (filePath) {
      const dir = filePath.substring(0, filePath.lastIndexOf("/"));
      if (dir) hsm.status.currentDirectory = dir;
    }
    await hsm.load(hsmObj, filePath);
    notifyOk(`"${filePath}" loaded.`);
  }
}

export function saveHsm() {
  const filePath = hsm.state.filePath;
  // Update currentDirectory for dialog prepositioning
  if (filePath) {
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    if (dir) hsm.status.currentDirectory = dir;
  }
  writeHsm(filePath, hsm);
}
