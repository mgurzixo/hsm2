<template>
  <div class="full-window row no-wrap">
    <left-buttons class=""></left-buttons>
    <div class="col-grow ovh column no-wrap">
      <q-tabs v-model="activefolio" class="text-grey bg-amber-1 my-tabs top-border col-auto" inline-label outside-arrows
        align="left" dense active-color="grey-8" active-bg-color="amber-2">
        <q-tab name="F1" no-caps content-class="folio-name" label="Main" active />
        <q-tab name="F2" no-caps content-class="folio-name" class="" label="Hsm1 dzfgzdfgdf dffdgdzfzddfg" />
        <q-tab name="F3" no-caps content-class="folio-name" class="" label="My Hsm2 dfghdfgdfg dfzdfgzdfg dfgdfgzdfg" />
      </q-tabs>
      <hsm-canvas id="myCanvas" class="col-grow"></hsm-canvas>
      <div class="my-footer col-auto q-px-xs">
        {{ fText }}&nbsp;
      </div>
    </div>
  </div>
</template>

<style>
.ovh {
  overflow: hidden;
}

.my-footer {
  border-top: solid 1px black;
  margin-top: 1px;
  overflow: hidden;
  display: table-cell;
}

.full {
  width: 100%;
  height: 100%;
}

.my-tabs .q-tabs__content {
  border-left: solid 1px;
}

.top-border {
  border-top: solid 1px black;
}

.my-tabs .q-tab {
  /* border-left: solid 1px; */
  border-right: solid 1px;
}

.folio-name .q-tab__label {
  max-width: 10em;
  /* width: 10em; */
  /* white-space: nowrap; */
  overflow: hidden;
  text-overflow: ellipsis;
}

.full-window {
  min-height: 100vh;
  max-height: 100vh;
  min-width: 100vw;
  max-width: 100vw;
  overflow: hidden;
}
</style>

<script setup>
import * as V from "vue";
import * as U from "src/lib/utils";
import { fText } from "src/lib/utils";
import LeftButtons from "components/LeftButtons.vue";
import HsmCanvas from "components/HsmCanvas.vue";

const activefolio = V.ref("F1");
const canvasElem = V.ref(null);
let resizeObserver;


function adjustSizes() {
  return;
  const scale = 1;
  const bb = canvasElem.value.getBoundingClientRect();
  const v = canvasElem.value.style;
  // console.log(`[HsmCanvas.adjustSizes] bb.left:${bb.left.toFixed()} bb.top:${bb.top.toFixed()}`);
  v.left = bb.left + "px";
  v.top = bb.top + "px";
  v.width = bb.width + "px";
  v.height = bb.height - bb.top + "px";
}

V.onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;;
  }
});

V.onMounted(async () => {
  await U.nextTick();
  canvasElem.value = document.getElementById("myCanvas");
  adjustSizes();
  resizeObserver = new ResizeObserver(adjustSizes);
  resizeObserver.observe(canvasElem.value);
});

</script>
