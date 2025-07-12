<template>
  <q-menu :anchor="myMenu.anchor" :self="myMenu.self" :class="myMenu.class">
    <div
      v-for="item in myMenu.items"
      :key="item.label"
      class="q-list q-list--dense"
      :style="`min-width:${myMenu.minWidth}`"
    >
      <q-item v-if="item.label != '-'" clickable>
        <q-item-section avatar>
          <q-icon :name="item.icon" />
        </q-item-section>
        <q-item-section>{{ item.label }}</q-item-section>
        <q-item-section v-if="item.menu" side>
          <q-icon name="keyboard_arrow_right" />
        </q-item-section>

        <q-menu
          v-if="item.menu"
          :anchor="item.menu.anchor"
          :self="item.menu.self"
          :class="item.menu.class"
        >
          <div
            v-for="item2 in item.menu.items"
            :key="item2.label"
            class="q-list q-list--dense"
            :style="`min-width:${item.menu.minWidth}`"
          >
            <q-item v-if="item2.label != '-'" clickable v-close-popup @click="item2.click">
              <q-item-section avatar>
                <q-icon :name="item2.icon" />
              </q-item-section>
              <q-item-section>{{ item2.label }}</q-item-section>
            </q-item>
            <q-separator v-else></q-separator>
          </div>
        </q-menu>
      </q-item>

      <q-separator v-else></q-separator>
    </div>
  </q-menu>
</template>

<style>
.width100 {
  width: 100%;
}
.q-list--dense > .q-item {
  padding: 4px 4px 4px 4px;
}

.q-item__section--avatar {
  min-width: 0px !important;
  padding-right: 6px;
  padding-left: 2px;
}

.menu-border {
  border: solid 1px lightgrey;
}
</style>

<script setup>
import * as V from "vue";

const props = defineProps({
  menu: {
    type: Object,
  },
});

const myMenu = V.ref(props.menu);

V.onMounted(() => {});
</script>
