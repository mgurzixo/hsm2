<template>
  <q-layout view="hHh Lpr fFf">
    <button-burger></button-burger>
    <q-header class="Xheader-padding bg-grey-2 shadow-2 flex">
      <button-burger class="q-my-xs q-mx-xs bg-white text-black"></button-burger>
      <q-tabs class="text-grey bg-white" align="left" dense active-color="black" active-bg-color="grey-4">
        <q-tab label="Main" />
        <q-tab label="Hsm1" />
        <q-tab label="My Hsm2" />
      </q-tabs>
    </q-header>
    <q-page-container class="ovh">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style>
.ovh {
  overflow: hidden;
  padding-top: 13px !important;
}
</style>

<script setup>
import { ref } from 'vue';
import EssentialLink from 'components/EssentialLink.vue';
import ButtonBurger from 'components/ButtonBurger.vue';

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
