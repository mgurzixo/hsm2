<template>
  <div class="full-size">
    <q-dialog v-model="dialogToggle">
      <component :is="dialogComponent" :element="element"></component>
    </q-dialog>
    <canvas ref="canvasRef" class="full-size, canvas-cursor"> </canvas>
    <div ref="contextAnchor" class="context-anchor">
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
import FolioDialog from "src/components/FolioDialog.vue";
import contextMenu from "src/menus/contextMenu";
import { setCanvasListeners, removeCanvasListeners } from "src/lib/canvasListeners";
import { Chsm, hsm, cursor } from "src/classes/Chsm";
import { loadHsm } from "src/lib/hsmIo";

const canvasRef = V.ref(null);
const contextAnchor = V.ref(null);
const dialogToggle = V.ref(false);
const dialogComponent = V.shallowRef(null);
const trDialogToggle = V.ref(false);
const element = V.ref(null);
const elementId = V.ref(null);

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

V.watch(dialogToggle, (newToggle) => {
  // console.log(`[HsmCanvas.watch.element] newToggle:${newToggle}`);
  if (newToggle == false) {
    hsm.makeIdz();
    hsm.draw();
    hsm.setCursor();
  }
});

function openElementDialog(myElement) {
  element.value = myElement;
  elementId.value = myElement.id;
  console.log(`[HsmCanvas.openElementDialog] elemId:${myElement.id}`);
  if (myElement.id.startsWith("S")) dialogComponent.value = StateDialog;
  else if (myElement.id.startsWith("F")) dialogComponent.value = FolioDialog;
  else dialogComponent.value = TrDialog;
  dialogToggle.value = true;;

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
