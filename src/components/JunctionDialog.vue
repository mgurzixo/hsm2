<!-- eslint-disable vue/no-mutating-props -->
<template>
  <q-card class="my-card-junction text-black bg-color-junction">
    <q-bar class="text-grey-9 bg-amber-2">
      <div class="my-no-overflow">Junction: {{ localElement.id }}</div>
      <q-space />
      <q-btn flat v-close-popup round dense icon="close" />
    </q-bar>
    <div class="q-pa-md my-region-junction">
      <div class="q-py-sm">
        <q-input dense v-model="localElement.name" label="Name:" outlined @update:model-value="emitUpdate" />
      </div>
      <div class="q-py-sm">
        <q-input dense v-model="localElement.include" label="Include:" outlined @update:model-value="emitUpdate" />
      </div>
      <div class="q-py-sm">
        <q-input dense v-model="localElement.comment" label="Comment:" outlined autogrow
          @update:model-value="emitUpdate" />
      </div>
      <div class="q-py-sm">
        <q-select dense v-model="localElement.orientation" :options="['vertical', 'horizontal']" label="Orientation:"
          outlined @update:model-value="emitUpdate" />
      </div>
    </div>
  </q-card>
</template>

<style scoped>
.my-card-junction {
  /* overflow: hidden !important; */
  /* background-color: v-bind(bgColor); */
  min-width: 400px;
}

.bg-color-junction {
  background-color: #f5f5f5 !important;
}

.my-region-junction {
  overflow-y: auto !important;
  min-height: 200px;
}

.my-no-overflow {
  overflow: hidden;
  text-wrap: nowrap;
  text-overflow: ellipsis;
}
</style>

<script setup>
import * as V from "vue";
import * as U from "src/lib/utils";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";

const props = defineProps({
  element: { type: Object, required: true }
});
const emit = defineEmits(["update:element"]);

// Use a local reactive copy to avoid mutating prop directly
const localElement = V.reactive({
  id: props.element.id,
  name: props.element.name,
  include: props.element.include,
  comment: props.element.comment,
  orientation: props.element.orientation
});

// Watch for changes in localElement and emit update
async function emitUpdate() {
  localElement.name = U.underscorize(localElement.name);
  await U.nextTick();
  props.element.setName(localElement.name);
  // eslint-disable-next-line vue/no-mutating-props
  props.element.include = localElement.include;
  // eslint-disable-next-line vue/no-mutating-props
  props.element.comment = localElement.comment;

  props.element.setOrientation(localElement.orientation);
  emit("update:element", { ...localElement });
  props.element.paint();
}

// If the prop changes externally, update the local copy
V.watch(() => props.element, (newVal) => {
  Object.assign(localElement, newVal);
});

V.onMounted(async () => {
  // bgColor.value = hsm.settings.styles.folioBackground;
  // console.log(`[JunctionDialog.onMounted] elementId:${props.element.id} Color:${props.element.color}`);
  document.querySelectorAll('input').forEach(e => e.setAttribute('spellcheck', false));
});
</script>
