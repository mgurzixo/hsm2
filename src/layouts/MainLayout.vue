<template>
  <div class="full-window flex no-wrap">
    <left-buttons class=""></left-buttons>
    <div class="col-grow bg-blue-1 ovh full">
      <q-tabs
        v-model="activefolio"
        class="text-grey bg-amber-1 my-tabs top-border"
        inline-label
        outside-arrows
        align="left"
        dense
        active-color="grey-8"
        active-bg-color="amber-2"
      >
        <q-tab name="F1" no-caps content-class="folio-name" label="Main" active />
        <q-tab
          name="F2"
          no-caps
          content-class="folio-name"
          class=""
          label="Hsm1 dzfgzdfgdf dffdgdzfzddfg"
        />
        <q-tab
          name="F3"
          no-caps
          content-class="folio-name"
          class=""
          label="My Hsm2 dfghdfgdfg dfzdfgzdfg dfgdfgzdfg"
        />
      </q-tabs>
      <hsm-canvas></hsm-canvas>
    </div>
  </div>
</template>

<style>
.ovh {
  overflow: hidden;
}

.full {
  width: 100%;
  height: 100%;
}

.my-tabs .q-tabs__content {
  border-left: solid 1px;
}

.top-border {
  border-top: solid 1px black;
}

.my-tabs .q-tab {
  /* border-left: solid 1px; */
  border-right: solid 1px;
}

.folio-name .q-tab__label {
  max-width: 10em;
  /* width: 10em; */
  /* white-space: nowrap; */
  overflow: hidden;
  text-overflow: ellipsis;
}

.full-window {
  min-height: 100vh;
  max-height: 100vh;
  min-width: 100vw;
  max-width: 100vw;
  overflow: hidden;
}
</style>

<script setup>
import * as V from "vue";
import LeftButtons from "components/LeftButtons.vue";
import HsmCanvas from "components/HsmCanvas.vue";

const activefolio = V.ref("F1");
</script>
