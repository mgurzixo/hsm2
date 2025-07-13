<template>
  <div class="full-size">
    <canvas ref="canvasRef" class="full-size, canvas-cursor"> </canvas>
    <div ref="contextAnchor" class="context-anchor ygreen">
      <popup-menu :menu="contextMenu"></popup-menu>
    </div>
  </div>
</template>

<style>
.full-size {
  width: 100%;
  height: 100%;
}

.context-anchor {
  position: absolute;
  z-index: 100;
  top: 10px;
  left: 20px;
}

.canvas-cursor {
  cursor: v-bind(cursor);
}
</style>

<script setup>
import * as V from "vue";
import PopupMenu from "src/components/PopupMenu.vue";
import contextMenu from "src/menus/contextMenu";
import { setCanvasListeners, removeCanvasListeners } from "src/lib/canvasListeners";
import { Chsm, hsm, cursor } from "src/classes/Chsm";
import { loadHsm } from "src/lib/hsmIo";

const canvasRef = V.ref(null);
const contextAnchor = V.ref(null);

V.onUnmounted(() => {
  removeCanvasListeners();
  if (hsm) hsm.destroy();
});

// mouseX: from start of canvas
function handleRightClick(mouseX, mouseY, rawMouseX, rawMouseY) {
  console.log(`[HsmCanvas.handleRightClick] mouseX:${mouseX}`);
  contextAnchor.value.style.left = rawMouseX + "px";
  contextAnchor.value.style.top = rawMouseY + "px";
  const e = new Event("click");
  contextAnchor.value.dispatchEvent(e);
}

V.onMounted(() => {
  V.nextTick(() => {
    new Chsm(null, { name: "Hsm" });
    loadHsm(); // For devpt
    const canvas = canvasRef.value;
    hsm.setCanvas(canvas);
    setCanvasListeners();
    hsm.handleRightClick = handleRightClick;
  });
});
</script>
