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
import { drawCanvas, TX, TY, TL, RTX, RTY, RTL, setZoom } from 'src/lib/canvas';
import { theHsm, theCanvas, theVp, theScalePhy, theSettings, setCanvas, adjustSizes, setFolioScale, setFolioOffsetMm, theMouse } from 'src/lib/hsmStore';
import { setCanvasListeners, resetCanvasListeners } from 'src/lib/canvasListeners';

const containerRef = V.ref(null);
const canvasRef = V.ref(null);
let resizeObserver;

V.onUnmounted(() => {
  if (resizeObserver) resizeObserver.unobserve(document.body);
  resetCanvasListeners();
});

V.onMounted(() => {
  V.nextTick(() => {
    const canvas = canvasRef.value;
    setCanvas(canvas);
    adjustSizes();
    resizeObserver = new ResizeObserver(adjustSizes);
    resizeObserver.observe(document.body);
    setCanvasListeners();
  });
});
</script>
