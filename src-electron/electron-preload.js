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
import { app, BrowserWindow, Menu } from "electron";
const fs = require("fs");
const os = require("os");
// import { mainWindow } from "./electron-main.js";

// Expose API methods to the renderer process
contextBridge.exposeInMainWorld("hsm2Api", {
  fsWrite: (filePath, data) => {
    // console.log(`[electron-preload.fsWrite] filePath:${filePath}`);
    // whitelist channels
    // let validChannels = ["toMain"];
    // if (validChannels.includes(channel)) {
    //   ipcRenderer.send(channel, op, data);
    // }
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

  pdf: () => {
    let win = BrowserWindow
      .getFocusedWindow();
    var options = {
      marginsType: 0,
      pageSize: 'A4',
      printBackground: true,
      printSelectionOnly: false,
      landscape: false
    };
    win.webContents.printToPDF(options).then(data => {
      fs.writeFileSync("out.pdf", data);
    });
    return true;
  },
});
