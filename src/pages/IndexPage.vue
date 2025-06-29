<template>
  <div ref="containerRef" class="row no-wrap">
    <left-buttons class="col-auto border-buttons"></left-buttons>
    <hsm-canvas class="col-grow border-canvas"></hsm-canvas>
  </div>
</template>

<style>
.border-canvas {
  /* border: solid 1px; */
}

.border-buttons {
  border: solid 1px;
}
</style>

<script setup>
import HsmCanvas from "components/HsmCanvas.vue";
import LeftButtons from "components/LeftButtons.vue";
import * as V from "vue";

const containerRef = V.ref(null);


function adjustSizes() {
  const container = containerRef.value;
  const height = window.innerHeight - container.getBoundingClientRect().top;
  container.style.height = height - 2 + "px";
  const width = window.innerWidth - container.getBoundingClientRect().left;
  container.style.width = width - 2 + "px";
  // console.log(`[HsmCanvas.adjustSizes] height:${height}`);
}

V.onMounted(() => {
  V.nextTick(() => {
    adjustSizes();
    window.onresize = adjustSizes;
  });
});
</script>
