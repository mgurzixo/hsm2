<template>
  <canvas ref="canvasRef" class="xyblue">
  </canvas>
</template>

<style>
.full {
  width: 100%;
  height: 100%;
}
</style>

<script setup>
import * as V from "vue";
import InfiniteCanvas from 'ef-infinite-canvas';

const canvasRef = V.ref(null);


const props = defineProps({

});


function drawCanvas() {
  const canvasElem = canvasRef.value;
  const ctx = canvasElem.getContext('2d');
  console.log(`[HsmCanvas] ctx:${ctx}`);

  ctx.fillStyle = '#ff0';
  ctx.strokeStyle = '#808';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(30, 30, 100, 30);
  ctx.fill();
  ctx.stroke();
}


function adjustCanvasSize() {
  const canvasElem = canvasRef.value;
  canvasElem.width = canvasElem.parentElement.offsetWidth;
  canvasElem.height = canvasElem.parentElement.offsetHeight;
  console.log(`[HsmCanvas.adjustCanvasSize] height:${canvasElem.parentElement.offsetHeight}`);
  drawCanvas();
}

V.onMounted(() => {
  V.nextTick(() => {
    const canvasElem = canvasRef.value;
    const parentElement = canvasElem.parentElement;
    adjustCanvasSize();
    window.onresize = adjustCanvasSize;
    // console.log(`[HsmCanvas] infElem:${infElem}`);
    console.log(`[HsmCanvas] width:${canvasElem.parentElement.offsetHeight}`);
    // canvasElem.width = canvasElem.parentElement.offsetWidth;
    // canvasElem.height = canvasElem.parentElement.offsetHeight;
    // const infCanvas = new InfiniteCanvas(canvasElem);


    // get the CanvasRenderingContext2D
    // const ctx = infCanvas.getContext('2d');
    // const ctx = canvasElem.getContext('2d');
    // console.log(`[HsmCanvas] ctx:${ctx}`);

    // ctx.fillStyle = '#ff0';
    // ctx.strokeStyle = '#808';
    // ctx.lineWidth = 1;
    // ctx.beginPath();
    // ctx.rect(30, 30, 100, 30);
    // ctx.fill();
    // ctx.stroke();
  });

});
</script>
