<template>
  <div class="full-window flex no-wrap">
    <!-- <button-burger></button-burger> -->
    <left-buttons class="bg-green-1 col-auto left-buttons"></left-buttons>
    <div class="col-grow bg-blue-1 ovh full">
      <q-tabs class="text-grey bg-yellow-1 my-tabs" inline-label outside-arrows align="left" dense active-color="grey-8"
        active-bg-color="yellow-2">
        <q-tab no-caps content-class="folio-name" label="Main" />
        <q-tab no-caps content-class="folio-name" class="" label="Hsm1 dzfgzdfgdf dffdgdzfzddfg" />
        <q-tab no-caps content-class="folio-name" class="" label="My Hsm2 dfghdfgdfg dfzdfgzdfg dfgdfgzdfg" />
        <q-tab no-caps content-class="folio-name" label="Main" />
        <q-tab no-caps content-class="folio-name" class="" label="Hsm1 dzfgzdfgdf dffdgdzfzddfg" />
        <q-tab no-caps content-class="folio-name" class="" label="My Hsm2 dfghdfgdfg dfzdfgzdfg dfgdfgzdfg" />
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

.left-buttons {
  border-left: solid 1px;
  border-right: solid 1px;
  /* border-bottom: solid 1px; */
}
</style>

<script setup>
import { ref } from 'vue';
import LeftButtons from "components/LeftButtons.vue";
import HsmCanvas from "components/HsmCanvas.vue";

const linksList = [
  {
    title: 'Docs',
    caption: 'quasar.dev',
    icon: 'school',
    link: 'https://quasar.dev'
  },
  {
    title: 'Github',
    caption: 'github.com/quasarframework',
    icon: 'code',
    link: 'https://github.com/quasarframework'
  },
  {
    title: 'Discord Chat Channel',
    caption: 'chat.quasar.dev',
    icon: 'chat',
    link: 'https://chat.quasar.dev'
  },
  {
    title: 'Forum',
    caption: 'forum.quasar.dev',
    icon: 'record_voice_over',
    link: 'https://forum.quasar.dev'
  },
  {
    title: 'Twitter',
    caption: '@quasarframework',
    icon: 'rss_feed',
    link: 'https://twitter.quasar.dev'
  },
  {
    title: 'Facebook',
    caption: '@QuasarFramework',
    icon: 'public',
    link: 'https://facebook.quasar.dev'
  },
  {
    title: 'Quasar Awesome',
    caption: 'Community Quasar projects',
    icon: 'favorite',
    link: 'https://awesome.quasar.dev'
  }
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
