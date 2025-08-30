<!-- eslint-disable vue/no-mutating-props -->
<template>
  <q-card class="my-card-state text-black bg-color-state">
    <q-bar class="text-grey-9 bg-amber-2">
      <div class=" my-no-overflow">
        STATE {{ element?.id }}: {{ element?.name }}
      </div>
      <q-space />
      <q-btn flat v-close-popup round dense icon="close" />
    </q-bar>

    <div class="q-pa-sm my-region">
      <div class="q-pa-sm q-mb-md">
        <q-input dense outlined v-model="element.name" label="Name:" @update:model-value="onChange" />
      </div>
      <div class="q-pa-sm">
        <q-input dense v-model="element.entry" label="Entry:" outlined @update:model-value="onChange" />
      </div>
      <div class="q-pa-sm">
        <q-input dense v-model="element.exit" label="Exit:" outlined @update:model-value="onChange" />
      </div>
      <div class="q-pa-sm">
        <q-input dense v-model="element.include" label="Include:" outlined autogrow @update:model-value="onChange" />
      </div>
      <div class="q-pa-sm">
        <q-input dense v-model="element.comment" label="Comment:" outlined autogrow @update:model-value="onChange" />
      </div>
      <div class="q-pr-sm row no-wrap items-center">
        <hue-slider v-model="stateHue" class="col-grow q-px-sm"></hue-slider>
        <div class="col-3 mini-state column col">
          <div class="mini-title row justify-center items-center"> STATE </div>
          <div class="col-grow"> &nbsp;</div>
        </div>
      </div>
    </div>
  </q-card>

</template>

<style scoped>
.bg-color-state {
  background-color: v-bind(bgColor) !important;
}

.my-region {
  overflow-y: auto !important;
  min-height: 350px;
  max-height: 88vh;
}

.my-no-overflow {
  overflow: hidden;
  text-wrap: nowrap;
  text-overflow: ellipsis;
}

.my-card-state {
  /* overflow: hidden !important; */
  /* background-color: v-bind(bgColor); */
  min-width: 400px;
  min-width: 50vw;
}

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

const msTitleText = V.ref("red");

const props = defineProps({
  element: {
    type: Object,
  },
});

function onChange() {
  // console.log(`[stateDialog.onChange]`);
  // eslint-disable-next-line vue/no-mutating-props
  props.element.name = U.underscorize(props.element.name);
  props.element.paint();
}

V.watch(stateHue, (baseColor) => {
  // console.log(`[StateDialog.watch.stateColor] baseColor:${baseColor}`);
  const styles = stateStyles(baseColor);
  msBorder.value = styles.border;
  msBorderWidth.value = styles.borderWidth + "px";
  msTitleLine.value = styles.titleLine;
  msTitleLineWidth.value = styles.titleLineWidth;
  msTitleText.value = styles.titleText;
  msTitleGradient.value = `linear-gradient(to top,${styles.titleBgs[0]}, ${styles.titleBgs[1]})`;
  msBg.value = styles.bg;
  // eslint-disable-next-line vue/no-mutating-props
  props.element.color = baseColor;
  props.element.setStyles();
  props.element.paint();
  for (let tr of hCtx.folio.trs) {
    if (tr.from.id == props.element.id) tr.paint();
  }
  // console.log(`[StateDialog.watch.stateColor] msBg:${msBg.value}`);
});


V.onMounted(async () => {
  bgColor.value = hsm.settings.styles.folioBackground;
  // console.log(`[StateDialog.onMounted] elementId:${props.element.id} Color:${props.element.color}`);
  stateHue.value = props.element.color;
  document.querySelectorAll('input').forEach(e => e.setAttribute('spellcheck', false));
});
</script>
