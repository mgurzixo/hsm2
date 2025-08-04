<!-- eslint-disable vue/no-mutating-props -->
<template>
  <q-card class="my-card-fo text-black bg-color-fo">
    <q-bar class="text-grey-9 bg-amber-2">
      <div class=" my-no-overflow">
        Folio: {{ element.id }}:{{ element.name }}
      </div>
      <q-space />
      <q-btn flat v-close-popup round dense icon="close" />
    </q-bar>

    <div class="q-pa-md my-region-fo">
      <div class="q-py-sm">
        <q-input dense v-model="element.name" label="Name:" outlined />
      </div>
      <div class="q-py-sm">
        <q-input dense v-model.number="element.geo.width" type="number" label="Width (mm)" outlined>
        </q-input>
      </div>
      <div class="q-py-sm">
        <q-input dense v-model.number="element.geo.height" type="number" label="Height (mm)" outlined />
      </div>
      <div class="q-py-sm">
        <q-input dense v-model="element.include" label="Include:" outlined />
      </div>
      <div class="q-py-sm">
        <q-input dense v-model="element.comment" label="Comment:" outlined autogrow />
      </div>
    </div>
  </q-card>
</template>

<style>
.bg-color-fo {
  background-color: v-bind(bgColor) !important;
}

.my-region-fo {
  overflow-y: auto !important;
  min-height: 350px;
  max-height: 88vh;
}

.my-no-overflow {
  overflow: hidden;
  text-wrap: nowrap;
  text-overflow: ellipsis;
}

.my-card-fo {
  /* overflow: hidden !important; */
  min-width: 400px;
  min-width: 50vw;
}
</style>

<script setup>
import * as U from "src/lib/utils";
import * as V from "vue";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";

const bgColor = V.ref("white");
const isInternal = V.ref(true);

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
});
</script>
