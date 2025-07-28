<!-- eslint-disable vue/no-mutating-props -->
<template>
  <q-layout view="Lhh lpR fff" container class="text-grey-9 bg-amber-1">
    <q-header class="bg-primary">
      <q-toolbar class="text-grey-9 bg-amber-2">
        <q-toolbar-title>STATE {{ element?.id }}: {{ element?.name }}</q-toolbar-title>
        <q-btn flat v-close-popup round dense icon="close" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page padding>
        <div class="q-pa-md">
          <q-input outlined v-model="element.name" label="Name:" />
        </div>
        <div class="q-pa-md">
          <q-input v-model="element.entry" label="Entry:" outlined />
        </div>
        <div class="q-pa-md">
          <q-input v-model="element.exit" label="Exit:" outlined />
        </div>
        <div class="q-pa-md">
          <q-input v-model="element.include" label="Include:" outlined autogrow />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style></style>

<script setup>
import * as V from "vue";
import * as U from "src/lib/utils";

const layout = V.ref(true);
const drawer = V.ref(false);
const drawerR = V.ref(false);
const moreContent = V.ref(false);


const props = defineProps({
  elementId: {
    type: String,
  },
  element: {
    type: Object,
  },
});

// V.watch(props.element, () => {
//   console.log(`[StateDialog.watch.element] elementId:${props.element.id}`);

// });

// const element = V.computed(() => {
//   console.log(`[StateDialog.element] elementId:${props.elementId}`);
//   return U.getElemById(props.elementId);
// });
// const name = V.ref(element.value.name);


V.onMounted(async () => {
  // await U.nextTick();
  // console.log(`[StateDialog.onMounted] elementId:${props.elementId}`);
});
</script>
