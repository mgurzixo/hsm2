<template>
  <q-card id="noteCardId" class="my-card-note text-black col-auto  bg-color-note">
    <q-bar id="noteHeaderId" class="text-grey-9 bg-amber-2">
      <div class=" my-no-overflow">
        Note: {{ element.id }}
      </div>
      <q-space />
      <q-btn flat v-close-popup round dense icon="close" />
    </q-bar>

    <div id="notePayloadId" class="q-pa-sm column no-wrap my-region-note">

      <div class="col-auto row no-wrap q-pb-sm q-pt-md q-pr-sm">
        <div class="q-pr-md">Scale:</div>
        <q-slider dense v-model="sliderScale" class="slider-css" :min="0.2" :max="4" :step="0.1" label label-always
          color="amber-5">
        </q-slider>
      </div>

      <div id="noteInputOutput" class="col-auto row no-wrap full-size">
        <q-input dense v-model="elemNote.text" label="Markdown Text:" outlined autogrow @update:model-value="doCanvas"
          class="input-container mono-font col-6" />

        <div class="q-pl-sm col-6 overflow-auto">
          <div ref="htmlRef" class="markdown-container markdown-body"></div>
        </div>
      </div>
    </div>
  </q-card>
</template>

<style>
.markdown-container {
  border: solid 1px lightgrey;
  padding: 8px;
  transform-origin: top left;
  overflow: auto;
}

.input-container {
  overflow: auto;
}

.mono-font {
  font:
    14px ui-monospace,
    SFMono-Regular,
    SF Mono,
    Menlo,
    Consolas,
    Liberation Mono,
    monospace;
}

.full-size {
  width: 100%;
  height: 100%;
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

.input-container {
  max-width: 800px !important;
}


.my-region-note {
  min-height: 250px;
  /* min-height: 90vv; */
  /* max-height: 90vv; */
}

.my-no-overflow {
  overflow: hidden;
  text-wrap: nowrap;
  text-overflow: ellipsis;
}

.my-card-note {
  overflow: hidden !important;
  /* min-width: 500px !important; */
  min-height: 200px !important;
  max-height: 90vh !important;
  width: 90vw !important;
  min-width: 200px !important;
  max-width: 1200px !important;
}
</style>

<script setup>
// eslint-disable vue/no-mutating-props

import * as U from "src/lib/utils";
import * as V from "vue";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { unified } from 'unified';

const bgColor = V.ref("white");
const isInternal = V.ref(true);
const elemFrom = V.ref({});
const elemTo = V.ref({});
const colorFrom = V.ref("red");
const mdHtml = V.ref("");
const myDiv = V.ref(null);
const eee = V.ref(null);
const sliderScale = V.ref(1);
const elemNote = V.ref({});
const htmlRef = V.ref({});


const processor = unified()
  .use(remarkParse)
  .use(remarkGfm) // Support GFM (tables, autolinks, tasklists, strikethrough)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeKatex)
  .use(rehypeStringify);

let qCardE;
let headerE;
let payloadE;
let textAreaE;
let noteIOE;
let IOVertOffset;

let resizeObserver;

const props = defineProps({
  element: {
    type: Object,
  },
  elementId: {
    type: String,
  },
});


async function adjustHeights() {
  if (!qCardE || !headerE || !payloadE) return;
  await U.nextTick();
  const paddingBottom = 8;
  const inputHeight = textAreaE.offsetHeight;
  const htmlHeight = htmlRef.value.offsetHeight;

  const bbC = qCardE.getBoundingClientRect();
  const bbIO = noteIOE.getBoundingClientRect();
  IOVertOffset = bbIO.top - bbC.top;
  console.log(`[noteDialog.adjustHeights] bbC.top:${bbC.top} bbIO.top:${bbIO.top}`);
  console.log(`[noteDialog.adjustHeights] bbC.height:${bbC.height} bbIO.height:${bbIO.height}`);

  console.log(`[noteDialog.adjustHeights] inputHeight:${inputHeight} htmlHeight:${htmlHeight} IOVertOffset:${IOVertOffset}`);
  let qCardWantedHeight = Math.max(textAreaE.offsetHeight, htmlRef.value.offsetHeight);
  console.log(`[noteDialog.adjustHeights] 0 qCardWantedHeight:${qCardWantedHeight}`);
  qCardWantedHeight += paddingBottom + IOVertOffset + 20;
  qCardE.style.height = qCardWantedHeight + "px";
  console.log(`[noteDialog.adjustHeights] 1 qCardWantedHeight:${qCardWantedHeight}`);
  let height = qCardE.offsetHeight - IOVertOffset - paddingBottom;
  console.log(`[noteDialog.adjustHeights] height:${height}`);
  payloadE.style.height = height + "px";
}

// let newDiv;

async function doCanvas() {
  // console.log(`[noteDialog.doCanvas]`);
  const html = await processor.process(elemNote.value.text);
  htmlRef.value.innerHTML = html;
  htmlRef.value.style.scale = sliderScale.value;
  elemNote.value.scale = sliderScale.value;
  console.log(`[noteDiSalog.doCanvas]  elemNote:${elemNote.value}`);
  elemNote.value.paint();
  await U.nextTick();
  adjustHeights();
}

V.watch(sliderScale, async (el) => {
  doCanvas();
});

V.onUnmounted(() => {
  console.log(`[noteDialog.onUnmounted]`);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;;
  }
});

V.onMounted(async () => {
  await V.nextTick();
  console.log(`[noteDialog.onMounted] elementId:${props.elementId} hsm:${hsm}`);
  elemNote.value = U.getElemById(props.elementId);
  bgColor.value = hsm.settings.styles.folioBackground;
  await U.nextTick();
  noteIOE = document.getElementById("noteInputOutput");
  // textAreaE = noteIOE.getElementsByTagName('textarea')[0];
  textAreaE = noteIOE.getElementsByClassName('q-field__control')[0];
  qCardE = document.getElementById("noteCardId");
  headerE = document.getElementById("noteHeaderId");
  payloadE = document.getElementById("notePayloadId");
  sliderScale.value = elemNote.value.scale;
  // console.log(`[noteDialog.onMounted] qCardE:${qCardE} headerE:${headerE} payloadE:${payloadE}`);
  qCardE.style.width = qCardE.style.width + 1 + "px";



  doCanvas();
  resizeObserver = new ResizeObserver(adjustHeights);
  // resizeObserver.observe(qCardE);
  document.querySelectorAll('textarea').forEach(e => e.setAttribute('spellcheck', false));
});
</script>
