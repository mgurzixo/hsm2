<template>
  <div class="ovf">
    <canvas ref="canvasRef" class="">
    </canvas>
  </div>
</template>

<style>
.ovf {
  overflow: hidden;
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

// function handleWheel(e) {
//   // console.log(`[HsmCanvas.handleWheel] deltaX:${e.deltaX} deltaY:${e.deltaY} deltaMode:${e.deltaMode}`);
//   const deltas = - e.deltaY / theSettings.deltaMouseWheel;
//   const scale = theVp.scale + deltas * theSettings.deltaScale;
//   setZoom(RTX(theMouse.xP), RTY(theMouse.yP), scale);
// }

// TODO Must throttle all...

let isDragging = false;
let drag0 = [0, 0];

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
