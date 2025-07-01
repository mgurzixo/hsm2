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
  console.log(`[HsmCanvas.handleWheel] deltaX:${e.deltaX} deltaY:${e.deltaY} deltaMode:${e.deltaMode}`);
  const deltas = - e.deltaY / theSettings.deltaMouseWheel;
  const scale = theVp.scale + deltas * theSettings.deltaScale;
  setZoom(theMousePos.xMm, theMousePos.yMm, scale);
  // const oldScale = theVp.scale;
  // console.log(`[HsmCanvas.handleWheel] deltas:${deltas} oldScale:${theVp.scale} newScale:${scale}`);
  // // Restrict scale
  // scale = Math.min(Math.max(0.1, scale), 10);
  // // scale = 2;
  // const rScale = scale / oldScale;
  // const x0Mm = (theVp.x0 + (rScale - 1) * theMousePos.xMm) / rScale;
  // const y0Mm = (theVp.y0 + (rScale - 1) * theMousePos.yMm) / rScale;
  // // const x0Mm = theMousePos.xMm - (theMousePos.xMm - theVp.x0) * (scale / theVp.scale);
  // // const y0Mm = theMousePos.yMm - (theMousePos.yMm - theVp.y0) * (scale / theVp.scale);
  // setFolioScale(scale);
  // setFolioOffsetMm(x0Mm, y0Mm);
  // drawCanvas();
}

// TODO Must throttle all...

function handleMouseMove(e) {
  // console.log(`[HsmCanvas.handleMouseMove] clientX:${e.clientX} clientY:${e.clientY}`);
  const x = Math.round(e.clientX - theCanvasBb.left);
  const y = Math.round(e.clientY - theCanvasBb.top);
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
