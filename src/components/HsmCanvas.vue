<template>
  <div class="full-size">
    <state-dialog v-model='stateDialogToggle' :element="element"></state-dialog>
    <tr-dialog v-model='trDialogToggle' :element="element"></tr-dialog>
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
import StateDialog from "src/components/StateDialog.vue";
import TrDialog from "src/components/TrDialog.vue";
import contextMenu from "src/menus/contextMenu";
import { setCanvasListeners, removeCanvasListeners } from "src/lib/canvasListeners";
import { Chsm, hsm, cursor } from "src/classes/Chsm";
import { loadHsm } from "src/lib/hsmIo";

const canvasRef = V.ref(null);
const contextAnchor = V.ref(null);
const stateDialogToggle = V.ref(false);
const trDialogToggle = V.ref(false);
const element = V.ref(null);

V.onUnmounted(() => {
  removeCanvasListeners();
  if (hsm) hsm.destroy();
});

// mouseX: from start of canvas
function handleRightClick(mouseX, mouseY, rawMouseX, rawMouseY) {
  console.log(`[HsmCanvas.handleRightClick] mouseX:${mouseX}`);
  contextAnchor.value.style.left = rawMouseX + "px";
  contextAnchor.value.style.top = rawMouseY + "px";
  const e = new Event("click"); // Received by q-menu of popup-menu
  contextAnchor.value.dispatchEvent(e);
}

function openElementDialog(myElement) {
  element.value = myElement;
  console.log(`[HsmCanvas.openElementDialog] elemId:${myElement.id} ${myElement.id.startsWith("T")}`);

  if (myElement.id.startsWith("T")) trDialogToggle.value = true;
  else stateDialogToggle.value = true;

  // const e = new Event("click");
  // contextAnchor.value.dispatchEvent(e);
}

V.onMounted(() => {
  V.nextTick(() => {
    const canvas = canvasRef.value;
    new Chsm(null, { name: "Hsm", canvas: canvas });
    loadHsm(); // For devpt
    setCanvasListeners();
    hsm.handleRightClick = handleRightClick;
    hsm.openDialog = openElementDialog;
  });
});
</script>
