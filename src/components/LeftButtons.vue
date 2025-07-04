<template>
  <div class="bg-green-1 col-auto left-buttons overflow-auto">
    <div class="column q-pr-xs q-pb-xs q-gutter-xs left-container no-wrap text-black">
      <button-burger class=""></button-burger>
      <q-btn class="bg-amber-2" outline round icon="mdi-open-in-app" @click="doLoadHsm" />
      <q-btn class="bg-amber-2" outline round icon="mdi-rectangle-outline" />
      <q-btn class="bg-amber-2" outline round icon="mdi-arrow-top-right" />
      <q-btn class="bg-amber-2" outline round icon="mdi-arrow-right-top" />
      <q-btn class="bg-amber-2" outline round icon="mdi-rhombus-outline" />
      <q-btn class="bg-amber-2" outline round icon="mdi-note-outline" />
      <div></div>
      <q-btn class="bg-amber-1" outline round icon="mdi-magnify-plus" @click="doZoom(1)" />
      <q-btn class="bg-amber-1" outline round icon="mdi-magnify-minus" @click="doZoom(-1)" />
    </div>
  </div>
</template>

<style lang="scss">
.left-container {
  margin: 1px;
}

.q-btn {
  background-color: $amber-1;
}

.left-buttons {
  border-left: solid 1px;
  border-right: solid 1px;
  /* border-bottom: solid 1px; */
}
</style>

<script setup>
import ButtonBurger from 'components/ButtonBurger.vue';
import { loadHsm, saveHsm } from "src/lib/hsmIo";
import { drawCanvas, setZoom, RTX, RTY } from "src/lib/canvas";
import { theHsm, theVp, theCanvas, theSettings, theMouse } from 'src/lib/hsmStore';

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
