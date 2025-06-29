<template>
  <q-btn outline round icon="mdi-menu">
    <q-menu anchor="bottom left" self="top start">
      <q-list dense style="min-width: 120px">
        <q-item clickable v-close-popup @click="loadHsm">
          <q-item-section avatar>
            <q-icon name="mdi-open-in-app" />
          </q-item-section>
          <q-item-section>Open...</q-item-section>
          <input type="file" id="browserImportInput" style="display: none" @change="handleFile" />
        </q-item>
        <q-item clickable v-close-popup>
          <q-item-section avatar>
            <q-icon name="mdi-content-save-outline" />
          </q-item-section>
          <q-item-section>Save...</q-item-section>
        </q-item>

        <q-separator />
        <q-item clickable>
          <q-item-section avatar>
            <q-icon name="mdi-plus" />
          </q-item-section>
          <q-item-section>New</q-item-section>
          <q-item-section side>
            <q-icon name="keyboard_arrow_right" />
          </q-item-section>


          <q-menu anchor="top end" self="top start">
            <q-list dense style="min-width: 140px">
              <q-item clickable v-close-popup>
                <q-item-section avatar>
                  <q-icon name="mdi-rectangle-outline" />
                </q-item-section>
                <q-item-section>State</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section avatar>
                  <q-icon name="mdi-arrow-top-right" />
                </q-item-section>
                <q-item-section>Transition</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section avatar>
                  <q-icon name="mdi-arrow-right-top" />
                </q-item-section>
                <q-item-section>Transition Arc</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section avatar>
                  <q-icon name="mdi-minus-thick" class="rotate-90" />
                </q-item-section>
                <q-item-section>Junction</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section avatar>
                  <q-icon name="mdi-rhombus-outline" />
                </q-item-section>
                <q-item-section>Decision</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section avatar>
                  <q-icon name="mdi-ray-start" />
                </q-item-section>
                <q-item-section>Start State</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section avatar>
                  <q-icon name="mdi-ray-end" />
                </q-item-section>
                <q-item-section>End State</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section avatar>
                  <q-icon name="mdi-format-page-split" />
                </q-item-section>
                <q-item-section>Region</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section avatar>
                  <q-icon name="mdi-note-outline" />
                </q-item-section>
                <q-item-section>Note</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section avatar>
                  <q-icon name="mdi-book-open-page-variant-outline" />
                </q-item-section>
                <q-item-section>Folio</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-item>

        <q-separator />
        <q-item clickable v-close-popup>
          <q-item-section avatar>
            <q-icon name="mdi-cog-outline" />
          </q-item-section>
          <q-item-section>Settings...</q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable v-close-popup @click="doExit">
          <q-item-section avatar>
            <q-icon name="mdi-exit-run" />
          </q-item-section>
          <q-item-section>Exit</q-item-section>
        </q-item>
        <q-separator />

      </q-list>
    </q-menu>
  </q-btn>
</template>

<style>
.q-list--dense>.q-item {
  padding: 4px 4px 4px 4px;
}

.q-item__section--avatar {
  min-width: 0px !important;
  padding-right: 6px;
  padding-left: 2px;
}
</style>

<script setup>
import path from 'path';
import { notify, notifyError, notifyOk, notifyWarning } from "src/lib/notify";
import pako from "pako";
import JSON5 from 'json5';

function doExit() {
  window.close();
}

function loadHsm() {
  let biiElem = document.getElementById("browserImportInput");
  biiElem.click();
}

async function handleFile(e) {
  let files = e.target.files;
  console.log(`[DynDlgImport.handleFile] nbFiles:${files.length}`);
  console.log(`[DynDlgImport.handleFile] file:'${files[0].name}'`);
  if (!files.length) {
    notify("No file selected");
    return;
  }
  const reader = new FileReader();
  reader.onloadend = async (e) => {
    let json;
    let obj;
    try {
      let blob = e.target.result;
      console.log(`[DynDlgImport.handleFile.onload] val:${blob}`);
      // let buf = pako.ungzip(blob);
      let utf8decoder = new TextDecoder();
      // json = utf8decoder.decode(buf);
      json = utf8decoder.decode(blob);
      obj = JSON5.parse(json);
    } catch (error) {
      let str = `[DynDlgImport.handleFile.reader] error:${error}`;
      console.error(str);
      notifyError(str);
    }
    console.log(`[DynDlgImport.handleFile.onload] object keys:[${Object.keys(obj)}]`);
    let res = { fileName: files[0].name, obj: obj };
    // await setupFromGoogleObj(res);
  };
  reader.readAsArrayBuffer(files[0]);
}

</script>
