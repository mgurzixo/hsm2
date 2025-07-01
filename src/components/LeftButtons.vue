<template>
  <div class="overflow-auto xygreen yyy">
    <div class="column q-pr-xs q-pb-xs q-gutter-xs left-container no-wrap xxx">
      <q-btn outline round icon="mdi-open-in-app" @click="doLoadHsm" />
      <q-btn outline round icon="mdi-rectangle-outline" />
      <q-btn outline round icon="mdi-arrow-top-right" />
      <q-btn outline round icon="mdi-arrow-right-top" />
      <q-btn outline round icon="mdi-minus-thick" class="rotate-90" />
      <q-btn outline round icon="mdi-rhombus-outline" />
      <q-btn outline round icon="mdi-note-outline" />
      <div></div>
      <q-btn outline round icon="mdi-magnify-plus" @click="doZoom(1)" />
      <q-btn outline round icon="mdi-magnify-minus" @click="doZoom(-1)" />
    </div>
  </div>
</template>

<style>
.xxx {
  width: 50px;
  min-width: 50px;
  height: 99%;
}

.xxx {
  width: 50px;
  min-width: 50px;
}

.left-container {
  margin: 1px;
}
</style>

<script setup>
import ButtonBurger from 'components/ButtonBurger.vue';
import { loadHsm, saveHsm } from "src/lib/hsmIo";
import { drawCanvas, setZoom, RTX, RTY } from "src/lib/canvas";
import { theHsm, theVp, theCanvas, theSettings, theMousePos } from 'src/lib/hsmStore';

function doLoadHsm() {
  loadHsm();
  drawCanvas();
}

function doZoom(delta) {
  const scale = theVp.scale + 2 * delta * theSettings.deltaScale;
  const widthMm = RTX(theCanvas.width);
  const heightMm = RTX(theCanvas.height);

  setZoom(theVp.x0Mm + widthMm / 2, theVp.y0Mm + heightMm / 2, scale);
}
</script>
