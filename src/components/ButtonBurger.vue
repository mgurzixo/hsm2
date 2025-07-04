<template>
  <q-btn outline round icon="mdi-menu" text-color="black" class="bg-amber-1">
    <q-menu anchor="bottom left" self="top start" class="bg-amber-1 menu-border">
      <q-list dense style="min-width: 120px">
        <q-item clickable v-close-popup @click="doLoadHsm">
          <q-item-section avatar>
            <q-icon name="mdi-open-in-app" />
          </q-item-section>
          <q-item-section>Open...</q-item-section>
          <input type="file" id="browserImportInput" style="display: none" @change="handleFile" />
        </q-item>
        <q-item clickable v-close-popup @click="saveHsm">
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


          <q-menu anchor="top end" self="top start" class="bg-amber-1 menu-border">
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

.menu-border {
  border: solid 1px lightgrey;
}
</style>

<script setup>
import * as V from "vue";
import path from 'path';
import { notify, notifyError, notifyOk, notifyWarning } from "src/lib/notify";
import { loadHsm, saveHsm } from "src/lib/hsmIo";
import pako from "pako";
import JSON5 from 'json5';
import { drawCanvas } from "src/lib/canvas";

function doExit() {
  window.close();
}

function doLoadHsm() {
  loadHsm();
  drawCanvas();
}


V.onMounted(() => {
  V.nextTick(() => {
    loadHsm();
  });
})

</script>
