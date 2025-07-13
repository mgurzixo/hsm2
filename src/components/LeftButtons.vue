<template>
  <div class="col-auto left-buttons overflow-auto">
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
  // background-color: $amber-1;
}

.left-buttons {
  border-left: solid 1px;
  border-right: solid 1px;
  /* border-bottom: solid 1px; */
  background-color: FloralWhite !important;
}
</style>

<script setup>
import ButtonBurger from "components/ButtonBurger.vue";
// import ButtonBurgerBak from "components/ButtonBurgerBak.vue";
import { loadHsm, saveHsm } from "src/lib/hsmIo";
import { hsm } from "src/classes/Chsm";

function doLoadHsm() {
  loadHsm();
  hsm.draw();
}

// export function setZoom(x, y, scale) {
//   const oldScale = theVp.scale;
//   // console.log(
//   //   `[HsmCanvas.handleWheel] oldScale:${theVp.scale.toFixed(2)} newScale:${scale.toFixed(2)}`,
//   // );
//   // Restrict scale
//   scale = Math.min(Math.max(0.1, scale), 10);
//   // scale = 2;
//   const rScale = scale / oldScale;
//   const x0Mm = (theVp.x0 + (rScale - 1) * x) / rScale;
//   const y0Mm = (theVp.y0 + (rScale - 1) * y) / rScale;
//   setFolioScale(scale);
//   setFolioOffsetMm(x0Mm, y0Mm);
//   drawCanvas();
// }

// TODO
function doZoom(delta) {
  // const scale = theVp.scale + 2 * delta * theSettings.deltaScale;
  // const widthMm = RTX(theCanvas.width);
  // const heightMm = RTX(theCanvas.height);
  // setZoom(theVp.x0Mm + widthMm / 2, theVp.y0Mm + heightMm / 2, scale);
}
</script>
