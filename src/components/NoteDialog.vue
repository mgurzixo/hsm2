<template>
  <q-card id="noteCardId" class="my-card-note text-black col-auto">
    <q-bar id="noteHeaderId" class="text-grey-9 bg-amber-2">
      <div class=" my-no-overflow">
        Note: {{ element.id }}
      </div>
      <q-space />
      <q-btn flat v-close-popup round dense icon="close" />
    </q-bar>

    <div id="notePayloadId" class="q-pa-sm my-region-note bg-color-note column no-wrap">

      <div class="col-auto row no-wrap q-pb-sm q-pt-md">
        <div class="q-pr-md">Scale:</div>
        <q-slider dense v-model="sliderScale" class="slider-css" :min="0.2" :max="2" :step="0.1" label label-always
          color="amber-5">
        </q-slider>
      </div>

      <div class="col row no-wrap">
        <q-input dense v-model="elemNote.text" label="Markdown Text:" outlined autogrow overflow-auto
          @update:model-value="doSvg" class="input-container col-6 q-pr-sm" />
        <!-- <div class="q-pr-sm"></div> -->
        <div ref="canvasContainer" class="canvas-container col-6 q-pa-sm overflow-auto">
        </div>
      </div>
    </div>
  </q-card>
</template>

<style>
.canvas-container {
  border: solid 1px;
  min-width: 600px;
  /* max-width: fit-content !important; */
  overflow: auto !important;
}

.bg-color-note {
  background-color: v-bind(bgColor) !important;
}

.input-container .q-field__inner {
  overflow: auto;
}

.slider-css {
  max-width: 50em;
}

.height100 {
  max-height: 100%;
  min-height: 100%;
}

.width100 {
  width: 100%;
}

.input-container {
  max-width: 800px !important;
}


.my-region-note {
  min-height: 350px;
  max-height: 90vv;
  /* height: 400px; */
}

.my-no-overflow {
  overflow: hidden;
  text-wrap: nowrap;
  text-overflow: ellipsis;
}

.my-card-note {
  overflow: hidden !important;
  /* min-width: 500px !important; */
  width: 90vw !important;
  min-width: 200px !important;
  max-width: 1200px !important;
  height: 90vh !important;
  min-height: 200px !important;
  max-height: 800px !important;
  /* min-width: 90vw !important; */
}
</style>

<script setup>
// eslint-disable vue/no-mutating-props

import * as U from "src/lib/utils";
import * as V from "vue";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { stateStyles, trStyles } from "src/lib/styles";

const bgColor = V.ref("white");
const isInternal = V.ref(true);
const elemFrom = V.ref({});
const elemTo = V.ref({});
const colorFrom = V.ref("red");
const mdHtml = V.ref("");
const myDiv = V.ref(null);
const canvasContainer = V.ref(null);
const sliderScale = V.ref(1);
const elemNote = V.ref({});

let qCardE;
let headerE;
let payloadE;

let resizeObserver;

const props = defineProps({
  element: {
    type: Object,
  },
  elementId: {
    type: String,
  },
});


function adjustSizes() {
  if (!qCardE || !headerE || !payloadE) return;
  let height = qCardE.offsetHeight - headerE.offsetHeight;
  // console.log(`[noteDialog.adjustSizes] height:${height}`);
  payloadE.style.height = height + "px";
}


// let newDiv;

async function doSvg() {
  if (!canvasContainer.value) return;
  const canvas = await U.mdToCanvas(elemNote.value.text, sliderScale.value * 1.2);
  canvasContainer.value.replaceChildren(canvas);
  elemNote.value.scale = sliderScale.value;
  // elemNote.value.makeCanvas();
  elemNote.value.canvas = canvas;
  hsm.draw();
  // console.log(`[noteDialog.doSvg]`);
}

const doSvgDebounced = U.debounce(doSvg, 100);

// V.watch(props.elementId, async (id) => {
//   console.log(`[noteDialog.watch.element] id:${id}`);
//   doSvgDebounced();
// }, { immediate: true });

V.watch(sliderScale, async (el) => {
  doSvgDebounced();
});

V.onUnmounted(() => {
  // console.log(`[noteDialog.onUnmounted]`);
});

V.onMounted(async () => {
  // console.log(`[noteDialog.onMounted]`);
  elemNote.value = U.getElemById(props.elementId);
  bgColor.value = hsm.settings.styles.folioBackground;
  // newDiv = document.createElement("div");
  // document.body.appendChild(newDiv);
  await U.nextTick();
  qCardE = document.getElementById("noteCardId");
  headerE = document.getElementById("noteHeaderId");
  payloadE = document.getElementById("notePayloadId");
  sliderScale.value = elemNote.value.scale;
  // console.log(`[noteDialog.onMounted] qCardE:${qCardE} headerE:${headerE} payloadE:${payloadE}`);
  resizeObserver = new ResizeObserver(adjustSizes);
  resizeObserver.observe(qCardE);
  doSvgDebounced();
});
</script>
