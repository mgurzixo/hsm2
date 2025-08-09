/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 *
 * WARNING!
 * If accessing Node functionality (like importing @electron/remote) then in your
 * electron-main.js you will need to set the following when you instantiate BrowserWindow:
 *
 * mainWindow = new BrowserWindow({
 *   // ...
 *   webPreferences: {
 *     // ...
 *     sandbox: false // <-- to be able to import @electron/remote in preload script
 *   }
 * }
 */
const { contextBridge } = require("electron");
import { app, BrowserWindow, Menu, ipcRenderer } from "electron";
const fs = require("fs");
const os = require("os");
// import { mainWindow } from "./electron-main.js";

// Expose API methods to the renderer process
contextBridge.exposeInMainWorld("hsm2Api", {
  fsWrite: (filePath, data) => {
    // console.log(`[electron-preload.fsWrite] filePath:${filePath}`);
    fs.writeFileSync(filePath, data);
    return "ok";
  },
  os: () => {
    const myOs = {
      homedir: os.homedir(),
      platform: os.platform(),
      release: os.release(),
      tmpdir: os.tmpdir(),
    };
    return myOs;
  },
  fsRead: (filePath, encoding) => {
    // console.log(`[electron-preload.fsRead] filePath:${filePath}`);
    return fs.readFileSync(filePath, encoding);
  },

  printToPDF: async (data) => {
    // console.log(`[electron-preload.printToPDF] data:${data}`);
    let res = await ipcRenderer.invoke("doPrint", data);
    return res;
  },
  toPrintWindow: async (data) => {
    console.log(`[electron-preload.toPrintWindow] data:${data}`);
    let res = ipcRenderer.invoke("doPrint", data);
    return res;
  },
});
