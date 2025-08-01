<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div>
    <div v-html="mdHtml"></div>
    <canvas></canvas>
  </div>
</template>

<style lang="scss"></style>

<script setup>
import * as U from "src/lib/utils";
import * as V from "vue";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { stateStyles, trStyles } from "src/lib/styles";
import markdownit from 'markdown-it';
const md = markdownit();

const bgColor = V.ref("white");
const isInternal = V.ref(true);
const elemFrom = V.ref({});
const elemTo = V.ref({});
const colorFrom = V.ref("red");

const props = defineProps({
  mdHtml: {
    type: String,
  },
});

function updateMd() {
}


V.onMounted(() => {
});
</script>
