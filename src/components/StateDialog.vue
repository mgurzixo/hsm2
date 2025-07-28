<!-- eslint-disable vue/no-mutating-props -->
<template>
  <!-- <q-layout view="Lhh lpR fff" container class="text-grey-9 bg-color"> -->
  <q-card class="my-card text-black">
    <!-- <q-header class="bg-primary"> -->
    <!-- <q-toolbar class="text-grey-9 bg-amber-2"> -->
    <!-- <q-toolbar-title> -->
    <q-bar class="text-grey-9 bg-amber-2">
      <div class=" my-no-overflow">
        STATE {{ element?.id }}: {{ element?.name }}
        <!-- </q-toolbar-title> -->
      </div>
      <q-space />
      <q-btn flat v-close-popup round dense icon="close" />
    </q-bar>
    <!-- </q-toolbar> -->
    <!-- </q-header> -->

    <!-- <q-page-container class="yblue"> -->
    <!-- <q-page :style-fn="myTweak" padding> -->
    <div class="q-pa-sm">
      <div class="q-pa-sm">
        <q-input dense outlined v-model="element.name" label="Name:" />
      </div>
      <div class="q-pa-sm">
        <q-input dense v-model="element.entry" label="Entry:" outlined />
      </div>
      <div class="q-pa-sm">
        <q-input dense v-model="element.exit" label="Exit:" outlined />
      </div>
      <div class="q-pa-sm">
        <q-input dense v-model="element.include" label="Include:" outlined autogrow />
      </div>
      <div class="q-pa-sm row no-wrap items-center">
        <div class="col-1">{{ msHue }}</div>
        <hue-slider v-model="stateHue" class="col-7 q-px-sm" @hue="handleHue"></hue-slider>
        <div class="col-4 mini-state column">
          <div class="mini-title row justify-center items-center"> STATE </div>
          <div class="Xygreen col-grow"> &nbsp;</div>
        </div>
      </div>
    </div>
  </q-card>
  <!-- </q-page> -->

  <!-- </q-page-container> -->
  <!-- </q-layout> -->
</template>

<style>
.my-no-overflow {
  overflow: hidden;
  text-wrap: nowrap;
  text-overflow: ellipsis;
}

.my-card {
  background-color: v-bind(bgColor);
  min-width: 400px;
  min-width: 50vw;
  ;
}

.fixed-full {}

.mini-state {
  border: solid v-bind(msBorderWidth) v-bind(msBorder);
  border-radius: 8px;
  background-color: v-bind(msBg);
}

.mini-title {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom: solid 1px v-bind(msTitleLine);
  color: v-bind(msTitleText);
  background-image: v-bind(msTitleGradient);
}
</style>

<script setup>
import * as V from "vue";
import * as U from "src/lib/utils";
import { hsm, cCtx, hCtx, modeRef, hElems } from "src/classes/Chsm";
import HueSlider from "src/components/HueSlider.vue";
import { stateStyles } from "src/lib/styles";

const layout = V.ref(true);
const drawer = V.ref(false);
const drawerR = V.ref(false);
const moreContent = V.ref(false);
const bgColor = V.ref("white");
const stateColor = V.ref("blue");
const stateHue = V.ref("blue");

const msBorder = V.ref("red");
const msBorderWidth = V.ref("5");
const msTitleLine = V.ref("red");
const msTitleLineWidth = V.ref("5");
const msBg = V.ref("red");
const msTitleGradient = V.ref("linear-gradient(to top, yellow, blue)");
const msHue = V.ref("10");

const msTitleText = V.ref("red");

const props = defineProps({
  element: {
    type: Object,
  },
});

function handleHue(event, hue) {
  console.log(`[StateDialog.handleHue] hue:${event}`);
  msHue.value = event + "";
}

function myTweak(offset) {
  // "offset" is a Number (pixels) that refers to the total
  // height of header + footer that occupies on screen,
  // based on the QLayout "view" prop configuration

  // this is actually what the default style-fn does in Quasar
  return { minHeight: `123px` };
}

V.watch(props.element, (el) => {
  // console.log(`[StateDialog.watch.element] color:${el.color}`);
  stateColor.value = el.color;
});

V.watch(stateHue, (baseColor) => {
  // console.log(`[StateDialog.watch.stateColor] baseColor:${baseColor}`);
  const styles = stateStyles(baseColor);
  msBorder.value = styles.border;
  msBorderWidth.value = styles.borderWidth + "px";
  msTitleLine.value = styles.titleLine;
  msTitleLineWidth.value = styles.titleLineWidth;
  msBorder.value = styles.border;
  msTitleText.value = styles.titleText;
  msTitleGradient.value = `linear-gradient(to top,${styles.titleBgs[0]}, ${styles.titleBgs[1]})`;
  msBg.value = styles.bg;
  // eslint-disable-next-line vue/no-mutating-props
  props.element.color = baseColor;
  hsm.draw();
  // console.log(`[StateDialog.watch.stateColor] msBg:${msBg.value}`);
});


V.onMounted(async () => {
  bgColor.value = hsm.settings.styles.folioBackground;
  console.log(`[StateDialog.onMounted] elementId:${props.element.id} Color:${props.element.color}`);
  stateHue.value = props.element.color;
});
</script>
