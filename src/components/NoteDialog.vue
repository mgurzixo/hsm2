<template>
  <q-card id="noteCardId" class="my-card-note text-black bg-color-note" :style="cardStyle" ref="qCardRef">
    <q-bar id="noteHeaderId" class="text-grey-9 bg-amber-2 header-bar">
      <div class="my-no-overflow">Note: {{ element.id }}</div>
      <q-space />
      <q-btn flat v-close-popup round dense icon="close" />
    </q-bar>
    <div id="notePayloadId" class="q-pa-sm column no-wrap my-region-note flex-grow">
      <div class="col-auto row no-wrap q-pb-sm q-pt-lg q-pr-sm" style="align-items: center; width: 100%;">
        <div style="flex: 1 1 0; min-width: 0; max-width: 50%; display: flex; align-items: center;">
          <span class="q-pr-md" style="font-size: 13px; color: #757575;">Scale:</span>
          <q-slider dense v-model="sliderScale" class="slider-css" :min="0.2" :max="4" :step="0.1" label label-always
            thumb-size="14px" color="amber-5" style="flex: 1 1 0; min-width: 120px;" />
        </div>
        <div
          style="flex: 1 1 0; min-width: 0; max-width: 50%; display: flex; align-items: center; justify-content: flex-end;">
          <span class="q-pr-md" style="font-size: 13px; color: #757575;">Font:</span>
          <q-select v-model="selectedFont" :options="fontList" dense outlined
            style="min-width: 140px; max-width: 220px;" emit-value map-options :option-label="font => font"
            :option-value="font => font" />
        </div>
      </div>


      <div id="noteInputOutput" class="row no-wrap note-io-row"
        style="height: 400px; min-height: 200px; max-height: 60vh;">
        <div class="input-scroll-area col-6 mono-font"
          style="display: flex; flex-direction: column; height: 100%; min-width: 0;">
          <label class="native-label">Markdown Text:</label>
          <textarea v-model="noteText" autofocus class="native-textarea styled-textarea" rows="6"
            style="resize: none; width: 100%; min-height: 100px; max-height: 100%; box-sizing: border-box; flex: 1 1 auto;"
            @input="doPainting" spellcheck="false" />
        </div>
        <div class="q-pl-sm col-6 markdown-scroll-area"
          style="display: flex; flex-direction: column; height: 100%; min-width: 0;">
          <label class="native-label">Markdown Result:</label>
          <div ref="htmlRef" class="markdown-container markdown-body" v-html="mdHtml"
            :style="{ fontSize: (sliderScale * 1.1) + 'em', fontFamily: selectedFont, flex: '1 1 auto', overflow: 'auto', height: '100%' }">
          </div>
        </div>
      </div>
    </div>
  </q-card>
</template>

<style scoped>
.my-card-note {
  overflow: hidden !important;
  min-width: 200px !important;
  max-width: 1200px !important;
  width: 90vw !important;
  min-height: 200px !important;
  max-height: 1200px !important;
  height: auto !important;
  max-height: 90vh !important;
  display: flex;
  flex-direction: column;
}

.header-bar {
  flex: 0 0 auto;
  z-index: 2;
}

.my-region-note {
  flex: 1 1 auto;
  min-height: 200px;
  max-height: 1200px;
  overflow: visible;
  display: flex;
  flex-direction: column;
}

.note-io-row {
  width: 100%;
  min-height: 100px;
  align-items: stretch;
  flex: 1 1 auto;
  overflow: hidden;
}

.input-scroll-area {
  height: 100%;
  max-height: 100%;
  min-width: 0;
  padding-right: 4px;
  box-sizing: border-box;
}

.markdown-scroll-area {
  height: 100%;
  max-height: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.native-label {
  font-size: 12px;
  color: #757575;
  margin-left: 2px;
  display: block;
  min-height: 18px;
  /* Remove margin-bottom to ensure both columns align perfectly */
}

.native-textarea.styled-textarea {
  width: 100%;
  min-height: 100px;
  max-height: 1000px;
  resize: none;
  overflow: auto;
  font: 14px ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  box-sizing: border-box;
  border: 1px solid #c2c2c2;
  border-radius: 4px;
  background: #fffbe6;
  color: #222;
  padding: 8px 12px;
  outline: none;
  transition: border-color 0.2s;
  line-height: 1.5;
  white-space: pre;
  /* Remove margin-bottom to align columns */
}

.native-textarea.styled-textarea:focus {
  border-color: #ffc107;
  background: #fffde7;
}

.markdown-container {
  border: solid 1px lightgrey;
  padding: 8px;
  min-height: 100px;
  background: #fffbe6;
  width: 100%;
  box-sizing: border-box;
  word-break: break-word;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}

.mono-font {
  font: 14px ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
}

.my-no-overflow {
  overflow: hidden;
  text-wrap: nowrap;
  text-overflow: ellipsis;
}
</style>

<script setup>
import * as U from "src/lib/utils";
import * as V from "vue";
import { hsm } from "src/classes/Chsm";
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { unified } from 'unified';
import { getSystemFonts } from 'src/lib/fontUtils';

const props = defineProps({
  element: { type: Object },
  elementId: { type: String },
});

const showDialog = V.ref(true);
const sliderScale = V.ref(1);

const elemNote = V.ref({});
const noteText = V.ref("");
const mdHtml = V.ref("");
const htmlRef = V.ref(null);
const qCardRef = V.ref(null);
const cardStyle = V.ref({});

const fontList = V.ref([]);
const selectedFont = V.ref('');
V.watch(selectedFont, (newFont) => {
  if (elemNote.value) {
    elemNote.value.setFont(newFont);
    elemNote.value.paint();
  }
});

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeKatex)
  .use(rehypeStringify);

async function doPainting() {
  const html = String(await processor.process(noteText.value || ""));
  mdHtml.value = html;
  if (elemNote.value) {
    await elemNote.value.setText(noteText.value);
    elemNote.value.setScale(sliderScale.value);
    elemNote.value.paint();
  }
}

V.watch(sliderScale, doPainting);

V.onMounted(async () => {
  elemNote.value = U.getElemById(props.elementId);
  noteText.value = elemNote.value.text || "";
  sliderScale.value = elemNote.value.scale || 1;
  fontList.value = await getSystemFonts();
  // Initialize font from elemNote property if present, else default
  selectedFont.value = elemNote.value.font && fontList.value.includes(elemNote.value.font)
    ? elemNote.value.font
    : (fontList.value[0] || 'Noto');
  await doPainting();
});

V.onUnmounted(() => {
});
</script>
