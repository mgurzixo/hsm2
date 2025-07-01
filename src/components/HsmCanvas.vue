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
import { theHsm, theCanvas, theCanvasBb, theVp, theScalePhy, theSettings, setCanvas, adjustSizes, setMousePos, setFolioScale, setFolioOffsetMm, theMousePos } from 'src/lib/hsmStore';

const containerRef = V.ref(null);
const canvasRef = V.ref(null);
let resizeObserver;

function handleWheel(e) {
  // console.log(`[HsmCanvas.handleWheel] deltaX:${e.deltaX} deltaY:${e.deltaY} deltaMode:${e.deltaMode}`);
  const deltas = - e.deltaY / theSettings.deltaMouseWheel;
  const scale = theVp.scale + deltas * theSettings.deltaScale;
  setZoom(theMousePos.xMm, theMousePos.yMm, scale);
}

// TODO Must throttle all...

function handleMouseMove(e) {
  // console.log(`[HsmCanvas.handleMouseMove] clientX:${e.clientX} clientY:${e.clientY}`);
  let x = Math.round(e.clientX - theCanvasBb.left);
  let y = Math.round(e.clientY - theCanvasBb.top);
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  setMousePos(x, y);
}

V.onUnmounted(() => {
  if (resizeObserver) resizeObserver.unobserve(document.body);
  theCanvas.removeEventListener("wheel", handleWheel);
  theCanvas.removeEventListener("mousemove", handleMouseMove);
});

V.onMounted(() => {
  V.nextTick(() => {
    const canvas = canvasRef.value;
    setCanvas(canvas);
    adjustSizes();
    resizeObserver = new ResizeObserver(adjustSizes);
    resizeObserver.observe(document.body);
    canvas.addEventListener("wheel", handleWheel);
    canvas.addEventListener("mousemove", handleMouseMove);
  });
});
</script>
