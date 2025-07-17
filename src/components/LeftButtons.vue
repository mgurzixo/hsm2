<template>
  <div class="col-auto left-buttons overflow-auto">
    <div class="column q-pr-xs q-pb-xs q-gutter-xs left-container no-wrap text-black">
      <button-burger class=""></button-burger>
      <q-btn class="bg-amber-2 q-btn--active" outline round icon="mdi-open-in-app" @click="doLoadHsm" />

      <q-btn id="btn-state" class="bg-amber-2 elem-button" outline round icon="mdi-rectangle-outline"
        @click="setMode('state')" />
      <q-btn id="btn-trans" class="bg-amber-2 elem-button" outline round icon="mdi-arrow-right-top"
        @click="setMode('trans')" />
      <q-btn id="btn-choice" class="bg-amber-2 elem-button" outline round icon="mdi-rhombus-outline"
        @click="setMode('choice')" />
      <q-btn id="btn-note" class="bg-amber-2 elem-button" outline round icon="mdi-note-outline"
        @click="setMode('note')" />
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

.elem-button {
  border-radius: 8px;
}

.elem-selected {}

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
import { hsm, hCtx } from "src/classes/Chsm";

function doLoadHsm() {
  loadHsm();
  hsm.draw();
}

function setMode(wantedMode) {
  // console.log(`[LeftButtons.setMode]   res:${m}`);
  if (wantedMode == "") hCtx.setMode("");
  else hCtx.setMode(`inserting-${wantedMode}`);
  for (let mode of ["state", "trans", "choice", "note"]) {
    const id = `btn-${mode}`;
    let elem = document.getElementById(id);
    if (wantedMode == mode) {
      // console.log(`[LeftButtons.setMode] SET m:${wantedMode} id:${id} elem:${elem}`);
      if (elem.classList.contains("bg-amber-5")) {
        elem.classList.remove("bg-amber-5");
        elem.classList.add("bg-amber-2");
        hCtx.setMode("");
      }
      else {
        elem.classList.remove("bg-amber-2");
        elem.classList.add("bg-amber-5");
      }
    }
    else {
      // console.log(`[LeftButtons.setMode] RESET m:${wantedMode} id:${id} elem:${elem}`);
      elem.classList.remove("bg-amber-5");
      elem.classList.add("bg-amber-2");
    }
  }
}

// export function setZoom(x, y, scale) {
//   const oldScale = theVp.scale;
//   // console.log(
//   //   `[LeftButtons.setZoom] oldScale:${theVp.scale.toFixed(2)} newScale:${scale.toFixed(2)}`,
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
