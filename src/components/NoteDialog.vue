<!-- eslint-disable vue/no-mutating-props -->
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
        <q-slider dense v-model="sliderScale" class="slider-css" :min="0.5" :max="2" :step="0.1" label label-always
          color="amber-5">
        </q-slider>
      </div>

      <div class="col row no-wrap">
        <q-input dense v-model="element.text" label="Markdown Text:" outlined autogrow overflow-auto @cchange="updateMd"
          class="input-container col-6 q-pr-sm" />
        <!-- <div class="q-pr-sm"></div> -->
        <div ref="svgContainer" class="svg-container col-6 q-pa-sm overflow-auto">
        </div>
      </div>
    </div>
  </q-card>
</template>

<style>
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

.svg-container {
  border: solid 1px;
  min-width: 300px;
  max-width: fit-content !important;
  overflow: auto !important;
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
import * as U from "src/lib/utils";
import * as V from "vue";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { stateStyles, trStyles } from "src/lib/styles";
import NoteRenderer from "src/components/NoteRenderer.vue";
import markdownit from 'markdown-it';
import html2canvas from 'html2canvas';
const md = markdownit();
import domtoimage from 'dom-to-image-more';

const bgColor = V.ref("white");
const isInternal = V.ref(true);
const elemFrom = V.ref({});
const elemTo = V.ref({});
const colorFrom = V.ref("red");
const mdHtml = V.ref("");
const myDiv = V.ref(null);
const canvasContainer = V.ref(null);
const svgContainer = V.ref(null);
const sliderScale = V.ref(1);

let qCardE;
let headerE;
let payloadE;

let resizeObserver;

const props = defineProps({
  element: {
    type: Object,
  },
});


function adjustSizes() {
  if (!qCardE || !headerE || !payloadE) return;
  let height = qCardE.offsetHeight - headerE.offsetHeight;
  console.log(`[noteDialog.adjustSizes] height:${height}`);
  payloadE.style.height = height + "px";
}

function updateMd() {
}

function debounce(callback, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback();
    }, delay);
  };
}

let newDiv;

async function doSvg() {
  const text = props.element.text;
  const mdHtml = md.render(props.element.text);
  // console.log(`[noteDialog.doSvg] mdHtml:${mdHtml}`);
  newDiv.innerHTML = mdHtml;
  newDiv.style.height = "1024px";
  newDiv.style.width = "724px";
  const scale = sliderScale.value;
  domtoimage
    .toSvg(newDiv, {
      width: newDiv.clientWidth * scale,
      height: newDiv.clientHeight * scale,
      style: {
        transform: "scale(" + scale + ")",
        transformOrigin: "top left"
      }
    })
    .then(function (dataUrl) {
      var img = new Image();
      img.src = dataUrl;
      svgContainer.value.replaceChildren(img);
      newDiv.innerHTML = "";
      hsm.draw();
      // console.log(`[noteDialog.doSvg] dataUrl:${dataUrl}`);
    })
    .catch(function (error) {
      console.error(`[noteDialog.doSvg] Error:${error}`);
    });
}

const doSvgDebounced = debounce(doSvg, 100);

V.watch(props.element, async (el) => {
  console.log(`[noteDialog.watch.element] id:${el.id}`);
  doSvgDebounced();
}, { immediate: true });

V.watch(sliderScale, async (el) => {
  doSvgDebounced();
});

V.onUnmounted(() => {
  console.log(`[noteDialog.onUnmounted]`);
});

V.onMounted(async () => {
  console.log(`[noteDialog.onMounted]`);
  bgColor.value = hsm.settings.styles.folioBackground;
  newDiv = document.createElement("div");
  document.body.appendChild(newDiv);
  await U.nextTick();
  qCardE = document.getElementById("noteCardId");
  headerE = document.getElementById("noteHeaderId");
  payloadE = document.getElementById("notePayloadId");
  console.log(`[noteDialog.onMounted] qCardE:${qCardE} headerE:${headerE} payloadE:${payloadE}`);
  resizeObserver = new ResizeObserver(adjustSizes);
  resizeObserver.observe(qCardE);
});
</script>
