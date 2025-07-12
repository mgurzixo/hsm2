<template>
  <q-btn outline round icon="mdi-menu" text-color="black" class="bg-amber-3">
    <popup-menu :menu="burgerMenu"></popup-menu>
  </q-btn>
</template>

<style></style>

<script setup>
import * as V from "vue";
import PopupMenu from "src/components/PopupMenu.vue";
import path from "path";
import { notify, notifyError, notifyOk, notifyWarning } from "src/lib/notify";
import burgerMenu from "src/menus/burgerMenu";

V.onMounted(() => {});
</script>
