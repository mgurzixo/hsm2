<template>
  <div class="my-container bg-grey">
    <q-dialog v-model="dialogToggle">
      <component :is="dialogComponent" :element="element" :elementId="elementId"></component>
    </q-dialog>
    <!-- <div id="myViewport" class="my-viewport"> -->
    <div id="M1"></div>
    <!-- </div> -->
    <canvas ref="canvasRef" class="invisible full-size, canvas-cursor"> </canvas>
    <div ref="contextAnchor" class="context-anchor">
      <popup-menu :menu="contextMenu"></popup-menu>
    </div>
  </div>
</template>

<style>
.invisible {
  display: none;
}

.my-viewport {
  left: 0px;
  top: 0px;
  width: 100px;
  height: 100px;
  overflow: hidden;
  position: absolute;
  background-color: transparent;
  transform-origin: top left;

}

#M1 {
  /* background-color: chocolate; */
  width: 0px;
  height: 0px;
  overflow: hidden;
  transform-origin: top left;
  /* transform: scale(0.5); */
}

.my-container {
  /* width: 100%;
  height: 100%; */
  overflow: hidden;
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
import * as U from "src/lib/utils";
import * as V from "vue";
import PopupMenu from "src/components/PopupMenu.vue";
import StateDialog from "src/components/StateDialog.vue";
import TrDialog from "src/components/TrDialog.vue";
import NoteDialog from "src/components/NoteDialog.vue";
import FolioDialog from "src/components/FolioDialog.vue";
import contextMenu from "src/menus/contextMenu";
import { setRootElemListeners, removeRootElemListeners } from "src/lib/rootElemListeners";
import { Chsm, hsm, cursor } from "src/classes/Chsm";
import { loadHsm } from "src/lib/hsmIo";
import doc from "pdfkit";

let resizeObserver;
let rootElem;
// let vpElem;
const canvasRef = V.ref(null);
const contextAnchor = V.ref(null);
const dialogToggle = V.ref(false);
const dialogComponent = V.shallowRef(null);
const trDialogToggle = V.ref(false);
const element = V.ref(null);
const elementId = V.ref(null);

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
  else if (myElement.id.startsWith("T")) dialogComponent.value = TrDialog;
  else if (myElement.id.startsWith("N")) dialogComponent.value = NoteDialog;
  else dialogComponent.value = null;
  if (dialogComponent.value) dialogToggle.value = true;

  // const e = new Event("click");
  // contextAnchor.value.dispatchEvent(e);
}

function adjustSizes() {
  const scale = 1;
  const bb = rootElem.parentElement.getBoundingClientRect();
  const v = rootElem.style;
  // console.log(`[HsmCanvas.adjustSizes] bb.left:${bb.left.toFixed()} bb.top:${bb.top.toFixed()}`);
  v.left = bb.left + "px";
  v.top = bb.top + "px";
  v.width = bb.width + "px";
  v.height = bb.height + "px";
}

V.onUnmounted(() => {
  removeRootElemListeners(rootElem);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;;
    if (hsm) hsm.destroy();
  }
});

V.onMounted(async () => {
  await U.nextTick();
  rootElem = document.getElementById("M1");
  // vpElem = document.getElementById("myViewport");
  adjustSizes();
  resizeObserver = new ResizeObserver(adjustSizes);
  resizeObserver.observe(rootElem.parentElement);
  const canvas = canvasRef.value;
  new Chsm(null, { name: "Hsm", elem: rootElem, canvas: canvas });
  await loadHsm(); // For devpt
  setRootElemListeners(rootElem);
  hsm.handleRightClick = handleRightClick;
  hsm.openDialog = openElementDialog;
});
</script>
