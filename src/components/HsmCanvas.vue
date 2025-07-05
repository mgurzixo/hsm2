<template>
  <canvas ref="canvasRef" class="full-size"> </canvas>
</template>

<style>
.full-size {
  width: 100%;
  height: 100%;
}
</style>

<script setup>
import * as V from "vue";
import { setCanvasListeners, resetCanvasListeners } from 'src/lib/canvasListeners';
import { Chsm, hsm, canvas } from "src/classes/CHsm";
import { loadHsm } from "src/lib/hsmIo";

const canvasRef = V.ref(null);

V.onUnmounted(() => {
  if (hsm) hsm.destroy();
  // resetCanvasListeners();
});

V.onMounted(() => {
  V.nextTick(() => {
    new Chsm(null, { name: "Hsm" });
    loadHsm(); // For devpt
    const canvas = canvasRef.value;
    hsm.setCanvas(canvas);
  });
});
</script>
