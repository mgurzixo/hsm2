<!-- eslint-disable vue/no-mutating-props -->
<template>
  <q-card class="my-card-tr text-black bg-blue">
    <q-bar class="text-grey-9 bg-amber-2">
      <div class=" my-no-overflow">
        Transition: {{ element.id }}
      </div>
      <q-space />
      <q-btn flat v-close-popup round dense icon="close" />
    </q-bar>

    <div class="q-pa-md my-region-tr bg-color-tr yblue">
      <div class="q-pa-sm q-mb-md border-tr">
        <div class="row no-wrap">
          <div class="q-pr-sm">
            <div class=""> From </div>
            <div> To </div>
          </div>
          <div class="">
            <div class="color-from"> {{ elemFrom.id }}: {{ elemFrom.name }} </div>
            <div class="color-to"> {{ elemTo.id }}: {{ elemTo.name }} </div>
          </div>
        </div>
        <q-checkbox dense v-if="element.from.id == element.to.id" class="q-pt-xs color-from "
          v-model="element.isInternal" label="Internal transition" @click="hsm.draw()" />
      </div>
      <div class="q-py-sm">
        <q-input dense v-model="element.entry" label="Trigger:" outlined />
      </div>
      <div class="q-py-sm">
        <q-input dense v-model="element.exit" label="Guard:" outlined />
      </div>
      <div class="q-py-sm">
        <q-input dense v-model="element.include" label="Action:" outlined />
      </div>
      <div class="q-py-sm">
        <q-input dense v-model="element.comment" label="Comment:" outlined autogrow />
      </div>
    </div>
  </q-card>
</template>

<style>
.bg-color-tr {
  background-color: v-bind(bgColor) !important;
}

color-from {
  color: v-bind(colorFrom) !important;
}

.border-tr {
  border: solid 1px v-bind(colorFrom);
  border-radius: 4px;
  ;
}

.my-region-tr {
  overflow-y: auto !important;
  min-height: 350px;
  max-height: 88vh;
}

.my-no-overflow {
  overflow: hidden;
  text-wrap: nowrap;
  text-overflow: ellipsis;
}

.my-card-tr {
  /* overflow: hidden !important; */
  min-width: 400px;
  min-width: 50vw;
}

.color-from {
  color: v-bind(colorFrom);
}

.color-to {
  color: v-bind(colorTo);
}
</style>

<script setup>
import * as U from "src/lib/utils";
import * as V from "vue";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import { stateStyles, trStyles } from "src/lib/styles";

const bgColor = V.ref("white");
const isInternal = V.ref(true);
const elemFrom = V.ref({});
const elemTo = V.ref({});
const colorFrom = V.ref("red");
const colorTo = V.ref("green");

const props = defineProps({
  element: {
    type: Object,
  },
});

V.watch(props.element, (el) => {
  console.log(`[trDialog.watch.element] id:${el.id}`);

});

V.onMounted(() => {
  bgColor.value = hsm.settings.styles.folioBackground;
  elemFrom.value = U.getElemById(props.element.from.id);
  elemTo.value = U.getElemById(props.element.to.id);
  colorFrom.value = trStyles(elemFrom.value.color).line;
  colorTo.value = trStyles(elemTo.value.color).line;
});
</script>
