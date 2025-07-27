<template>
  <q-dialog v-model="layout" persistent>
    <q-layout view="Lhh lpR fff" container class="text-grey-9 bg-amber-1">
      <q-header class="bg-primary">
        <q-toolbar class="text-grey-9 bg-amber-2">
          <!-- <q-btn flat @click="drawer = !drawer" round dense icon="menu" /> -->
          <q-toolbar-title> Transition: {{ element.id }}</q-toolbar-title>
          <q-btn flat v-close-popup round dense icon="close" />
        </q-toolbar>
      </q-header>

      <!-- <q-footer class="bg-black text-white">
        <q-toolbar>
          <q-toolbar-title>Footer</q-toolbar-title>
        </q-toolbar>
      </q-footer> -->

      <!-- <q-drawer bordered v-model="drawer" :width="200" :breakpoint="600" class="bg-grey-3 text-dark q-pa-sm">
        <div v-for="n in 50" :key="n">Drawer {{ n }} / 50</div>
      </q-drawer> -->

      <q-page-container>
        <q-page padding>
          <p v-for="n in contentSize" :key="n">
            {{ lorem }}
          </p>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-dialog>
</template>

<style></style>

<script setup>
import * as V from "vue";

const layout = V.ref(true);
const drawer = V.ref(false);
const drawerR = V.ref(false);
const moreContent = V.ref(false);

const lorem = V.ref('Lorem ipsum dolor sit amet consectetur, adipisicing elit. Natus, ratione eum minus fuga, quasi dicta facilis corporis magnam, suscipit at quo nostrum!');


const contentSize = V.computed(() => {
  return moreContent.value ? 150 : 5;
});

const props = defineProps({
  element: {
    type: Object,
  },
});

V.onMounted(() => { });
</script>
