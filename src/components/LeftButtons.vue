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
import ButtonBurger from "components/ButtonBurger.vue";
// import ButtonBurgerBak from "components/ButtonBurgerBak.vue";
import { loadHsm, saveHsm } from "src/lib/hsmIo";
import { hsm, hCtx, hElems, cCtx, modeRef } from "src/classes/Chsm";
import { mousePos } from "src/lib/canvasListeners";
import { R, RR } from "src/lib/utils";
import { Ctrans } from "src/classes/Ctrans";

function doLoadHsm() {
  loadHsm();
  hsm.draw();
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





function doTest() {
  const tOptions = {
    segments: [],
    start: {
      id: "S2",
      side: "B",
      pos: 0.2,
    },
    end: {
      id: "S3",
      side: "T",
      pos: 0.7,
    },
  };
  const trans = new Ctrans(null, tOptions, "T");
  trans.load(tOptions);
  trans.doIt();
  trans.draw();

}

// function doTest() {
//   console.log(`[LeftButtons.doTest]`);

//   const [x0, y0] = idToXY("S2", "B", 0.2);
//   const [x1, y1] = idToXY("S3", "T", 0.7);
//   const [x0P, y0P] = [RR(hsm.mmToPL(x0)), RR(hsm.mmToPL(y0))];
//   const [x1P, y1P] = [RR(hsm.mmToPL(x1)), RR(hsm.mmToPL(y1))];
//   // cCtx.beginPath();
//   // cCtx.moveTo(x0P, y0P);
//   // cCtx.lineTo(x1P, y1P);
//   cCtx.lineWidth = 1.5;
//   const aWidthP = R(hsm.mmToPL(1));
//   const aLengthP = R(hsm.mmToPL(3));
//   drawLineWithArrows(x0P, y0P, x1P, y1P, aWidthP, aLengthP, false, true);
//   cCtx.stroke();
// }

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
