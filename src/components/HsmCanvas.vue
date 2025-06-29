<template>
  <div ref="containerRef" class="ovf xfull">
    <canvas ref="canvasRef" class="">
    </canvas>
  </div>
</template>

<style>
.full {
  width: 100%;
  height: 100%;
}

.ovf {
  overflow: hidden;
}
</style>

<script setup>
import * as V from "vue";

const containerRef = V.ref(null);
const canvasRef = V.ref(null);


const props = defineProps({

});


function drawCanvas() {
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  // console.log(`[HsmCanvas] ctx:${ctx}`);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(30.5, 30.5, 100, 30);
  ctx.fill();
  ctx.stroke();
}


function adjustSizes() {
  const container = containerRef.value;
  const height = window.innerHeight - container.getBoundingClientRect().top;
  container.style.height = height - 2 + "px";
  const width = window.innerWidth - container.getBoundingClientRect().left;
  container.style.width = width - 2 + "px";
  // console.log(`[HsmCanvas.adjustSizes] height:${height}`);

  const canvas = canvasRef.value;
  canvas.width = canvas.parentElement.offsetWidth;
  canvas.height = canvas.parentElement.offsetHeight;
  drawCanvas();
}

V.onMounted(() => {
  V.nextTick(() => {
    const canvas = canvasRef.value;
    const parentElement = canvas.parentElement;
    adjustSizes();
    window.onresize = adjustSizes;
    // console.log(`[HsmCanvas] infElem:${infElem}`);
    // console.log(`[HsmCanvas] width:${canvas.parentElement.offsetHeight}`);
    // canvas.width = canvas.parentElement.offsetWidth;
    // canvas.height = canvas.parentElement.offsetHeight;


    // get the CanvasRenderingContext2D
    // const ctx = infCanvas.getContext('2d');
    // const ctx = canvas.getContext('2d');
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
