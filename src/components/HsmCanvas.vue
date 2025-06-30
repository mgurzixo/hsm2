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
import { drawCanvas } from 'src/lib/canvas';
import { theHsm, theCanvas, theCanvasBb, setCanvas, adjustSizes, setMousePos } from 'src/lib/hsmStore';

const containerRef = V.ref(null);
const canvasRef = V.ref(null);
let resizeObserver;

function handleWheel(e) {
  console.log(`[HsmCanvas.handleWheel] deltaX:${e.deltaX} deltaY:${e.deltaY} deltaMode:${e.deltaMode}`);
  let scale = theHsm.state.scale - e.deltaY * 0.0005;
  // Restrict scale
  scale = Math.min(Math.max(0.1, scale), 10);
  theHsm.state.scale = scale;
  drawCanvas();
}

// TODO Must throttle all...

function handleMouseMove(e) {
  // console.log(`[HsmCanvas.handleMouseMove] clientX:${e.clientX} clientY:${e.clientY}`);
  const x = e.clientX - theCanvasBb.left;
  const y = e.clientX - theCanvasBb.top;
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
