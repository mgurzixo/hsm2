<template>
  <div class="my-container bg-grey">
    <q-dialog v-model="dialogToggle">
      <component :is="dialogComponent" :element="element" :elementId="elementId"></component>
    </q-dialog>
    <div id="M1">
    </div>
    <div style="position:absolute;">
      <div ref="contextAnchor" class="context-anchor">
        <popup-menu :menu="contextMenu"></popup-menu>
      </div>
    </div>
    <!-- <div id="cursorPlane" class="cursor-plane">XXX</div> -->
    <canvas ref="canvasRef" class="invisible full-size, canvas-cursor"> </canvas>

  </div>
</template>

<style>
.invisible {
  display: none;
}

#M1 {
  z-index: auto;
}

.Xcursor-plane {
  position: absolute;
  transform-origin: top left;
  /* z-index: 100; */
  /* background: transparent; */
  /* background: #ff000060; */
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  cursor: no-drop;
}

*/ .my-container {
  /* width: 100%;
  height: 100%; */
  overflow: hidden;
}

.context-anchor {
  position: absolute;
  transform-origin: top left;
  z-index: 100;
  /* top: 10px;
  left: 20px; */
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
import { Chsm, hsm, hCtx } from "src/classes/Chsm";
import { loadHsm } from "src/lib/hsmIo";
import { setCursor } from "src/lib/cursor";
// import doc from "pdfkit";
import { applyToPoint } from 'transformation-matrix';

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
function handleRightClick(xP, yP) {
  console.log(`[HsmCanvas.handleRightClick] mouseX:${xP}`);
  const folio = hCtx.folio;
  contextAnchor.value.style.transformOrigin = "top left";
  contextAnchor.value.style.position = "absolute";
  let [x, y] = applyToPoint(folio.geo.matR, [xP, yP]);
  contextAnchor.value.style.left = xP + "px";
  contextAnchor.value.style.top = yP + "px";
  const e = new Event("click"); // Received by q-menu of popup-menu
  contextAnchor.value.dispatchEvent(e);
}

V.watch(dialogToggle, (newToggle) => {
  // console.log(`[HsmCanvas.watch.element] newToggle:${newToggle}`);
  if (newToggle == false) hsm.makeIdzP();
});

function openElementDialog(myDialog, myElement) {
  // console.log(`[HsmCanvas.openElementDialog]`);
  dialogComponent.value = myDialog;
  if (dialogComponent.value) {
    element.value = myElement;
    elementId.value = myElement.id;
    dialogToggle.value = true;
  }
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
  // console.log(`[HsmCanvas.onUnmounted]`);
  if (rootElem) {
    rootElem.innerHTML = ''; // Avoid previous vals with HMR
    removeRootElemListeners(rootElem);
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;;
    // console.log(`[HsmCanvas.onUnmounted] destroying`);
    if (hsm) hsm.destroy();
  }
});

V.onMounted(async () => {
  await U.nextTick();
  console.warn(`[HsmCanvas.onMounted] hello`);
  rootElem = document.getElementById("M1");
  rootElem.innerHTML = ''; // Avoid previous vals with HMR
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
