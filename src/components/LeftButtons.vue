<template>
  <div class="col-auto left-buttons overflow-auto" @click="modeRef = ''">
    <div class="column q-pr-xs q-pb-xs q-gutter-xs left-container no-wrap text-black">
      <button-burger class=""></button-burger>
      <q-btn class="bg-amber-2 q-btn--active" outline round icon="mdi-open-in-app" @click="doLoadHsm" />

      <q-btn id="inserting-state" class="bg-amber-2 elem-button" outline round icon="mdi-rectangle-outline"
        @click.stop="modeRef = 'inserting-state'" />
      <q-btn id="inserting-trans" class="bg-amber-2 elem-button" outline round icon="mdi-arrow-right-top"
        @click.stop="modeRef = 'inserting-trans'" />
      <q-btn id="inserting-choice" class="bg-amber-2 elem-button" outline round icon="mdi-rhombus-outline"
        @click.stop="modeRef = 'inserting-choice'" />
      <q-btn id="inserting-note" class="bg-amber-2 elem-button" outline round icon="mdi-note-outline"
        @click.stop="modeRef = 'inserting-note'" />
      <div></div>
      <q-btn class="bg-amber-1" outline round icon="mdi-magnify-plus" @click="doZoom(1)" />
      <q-btn class="bg-amber-1" outline round icon="mdi-magnify-minus" @click="doZoom(-1)" />
      <q-btn class="bg-red-2" outline round icon="mdi-bomb" @click="doTest" />
      <div>
        x:{{ mousePos.x.toFixed() }}
      </div>
      <div>
        y:{{ mousePos.y.toFixed() }}

      </div>
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

.left-buttons {
  border-left: solid 1px;
  border-right: solid 1px;
  /* border-bottom: solid 1px; */
  background-color: FloralWhite !important;
}
</style>

<script setup>
import * as V from "vue";
import * as U from "src/lib/utils";
import ButtonBurger from "components/ButtonBurger.vue";
// import ButtonBurgerBak from "components/ButtonBurgerBak.vue";
import { loadHsm, saveHsm } from "src/lib/hsmIo";
import { hsm, hCtx, hElems, cCtx, modeRef } from "src/classes/Chsm";
import { mousePos } from "src/lib/rootElemListeners";
import { R, RR } from "src/lib/utils";
import { Ctr } from "src/classes/Ctr";
import { doPdf } from "src/lib/doPdf";

async function doLoadHsm() {
  await loadHsm();
  // console.log(`[LeftButtons.doLoadHsm] `);
}

V.watch(modeRef, (newMode, oldMode) => {
  // console.log(`[LeftButtons.modeRef] oldMode:${oldMode} newMode:${newMode}`);
  if (newMode == oldMode) {
    modeRef.value = "";
    return;
  }
  for (let mode of ["inserting-state", "inserting-trans", "inserting-choice", "inserting-note"]) {
    let elem = document.getElementById(mode);
    // console.log(`[LeftButtons.modeRef] elem:${elem} id:${elem?.id}`);
    if (elem.id == oldMode) {
      elem.classList.remove("bg-amber-5");
      elem.classList.add("bg-amber-2");
    }
    else if (elem.id == newMode) {
      elem.classList.remove("bg-amber-2");
      elem.classList.add("bg-amber-5");
    }
  }
});

async function doTest() {
  const XMLS = new XMLSerializer();
  const el = document.getElementById("inserting-state");
  el.style.color = "red";
  const myHtml = XMLS.serializeToString(el);
  // console.log(`[LeftButtons.doTest] res:${myHtml}`);
  const toto = '<button class="" tabindex="0" type="button" id="inserting-state" style="color: red; width:100mm;height:100mm;">Hello World!</button>';
  doPdf(toto);
  // const res = await window.hsm2Api.toPrintWindow(toto);
}

V.onMounted(async () => {
});


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
