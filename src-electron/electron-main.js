import { app, BrowserWindow, Menu, ipcMain, WebContentsView, dialog } from "electron";
import { initialize, enable } from "@electron/remote/main/index.js";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import windowStateKeeper from 'electron-window-state';

import mdCss from "./markdown.css?raw";
console.log(`[Electron-main.doPrint] mdCss:${JSON.stringify(mdCss)}`);

// For now, removes Gtk-ERROR **: 15:43:19.630: GTK 2/3 symbols detected.
// cf. https://github.com/electron/electron/issues/46538
app.commandLine.appendSwitch("gtk-version", "3");

// cf. https://quasar.dev/quasar-cli-vite/developing-electron-apps/electron-accessing-files/
initialize();

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

const currentDir = fileURLToPath(new URL(".", import.meta.url));

export let mainWindow;
let printWindow;

async function createWindow() {
  /**
   * Initial window options
   */
  Menu.setApplicationMenu(null);
  // Load the previous state with fallback to defaults
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  });
  mainWindow = new BrowserWindow({
    icon: path.resolve(currentDir, "icons/icon.png"), // tray icon
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 360,
    minHeight: 270,
    useContentSize: true,
    backgroundColor: '#fff',
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(
        currentDir,
        path.join(
          process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
          "electron-preload" + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION,
        ),
      ),
    },
  });

  mainWindowState.manage(mainWindow);

  if (process.env.DEV) {
    await mainWindow.loadURL(process.env.APP_URL);
  } else {
    await mainWindow.loadFile("index.html");
  }

  // mainWindow.webContents.openDevTools();
  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  // console.log(`Hello PDF`);
}

app.on("window-all-closed", () => {
  if (platform !== "darwin") {
    // app.exit(0);
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();
  // creating a hidden window for print
  printWindow = new BrowserWindow({
    useContentSize: true,
    show: false,
    // backgroundColor: '#0ff',
    webPreferences: {
      contextIsolation: false,
      sandbox: false,
      // webSecurity: false,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
    },
  });
  printWindow.webContents.openDevTools();

  const data0 = `data:text/html;charset=utf-8,<body style="margin: 0; padding: 0;"> HELLO! </body>`;
  printWindow.loadURL(data0);

  ipcMain.handle('doPrint', async (event, data) => {
    // console.log(`[Electron-main.doPrint] mdCss:${JSON.stringify(data.mdCss)}`);
    // Ensure special characters in HTML are percent-encoded for data URL
    const encodedHtml = encodeURIComponent(data.html);
    const dataUrl = `data:text/html;charset=utf-8,${encodedHtml}`;
    await printWindow.loadURL(dataUrl);
    if (data.css) for (let css of data.css) await printWindow.webContents.insertCSS(css, { cssOrigin: 'author' });
    const pdfContent = await printWindow.webContents.printToPDF(data.options);
    return pdfContent;
  });

  ipcMain.handle('dialogOpen', async (event, data) => {
    // console.log(`[Electron-main.dialogOpen]`);
    const filePaths = await dialog.showOpenDialog(mainWindow,
      {
        properties: ['openFile'], filters: [
          { name: 'Hsm2', extensions: ['hsm2', 'json', 'json5'] },
        ]
      }
    );
    // console.log(`[Electron-main.dialogOpen] filePaths:${JSON.stringify(filePaths)}`);
    if (filePaths.canceled) return null;
    return filePaths.filePaths[0];
  });

})


