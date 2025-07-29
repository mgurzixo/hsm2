<template id="colorSlider">
  <div class=" row no-wrap flex-center">
    <div class="col-auto min-width3 q-mr-xs">{{ hue }}</div>
    <div class=" container col-grow">
      <div class="c-range">
        <div class="c-range__holder">
          <input ref="rangeInput" v-model="hue" class="c-range__slider" type="range" min="0" max="360" step="10"
            :style="{ color: hex }" @input="setHue" />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.min-width3 {
  min-width: 4em;
}

/* color range styles */
.c-range__slider {
  position: relative;
  z-index: 1;
  appearance: none;
  border-radius: 0.5em;
  background-color: rgba(0, 0, 0, 0.1);
  height: 0.75rem;
  width: 100%;
  display: block;
  outline: none;
  margin: 1.5rem auto;
  transition: color 0.05s linear;
  background: linear-gradient(to right,
      #ff0000 0%,
      #ffff00 17%,
      #00ff00 33%,
      #00ffff 50%,
      #0000ff 67%,
      #ff00ff 83%,
      #ff0000 100%);

  &:focus {
    outline: none;
  }

  &:active,
  &:hover:active {
    cursor: grabbing;
    cursor: -webkit-grabbing;
  }

  &::-moz-range-track {
    appearance: none;
    opacity: 0;
    outline: none;
  }

  &::-ms-track {
    outline: none;
    appearance: none;
    opacity: 0;
  }

  &::-webkit-slider-thumb {
    height: 2em;
    width: 2em;
    border-radius: 2em;
    appearance: none;
    background: currentColor;
    cursor: pointer;
    cursor: move;
    cursor: grab;
    cursor: -webkit-grab;
    border: 0.4em solid currentColor;
    transition: border 0.1s ease-in-out, box-shadow 0.2s ease-in-out,
      transform 0.1s ease-in-out;
    box-shadow: 0 0.1em 0.1em rgba(0, 0, 0, 0.05);

    &:active,
    &:hover:active {
      cursor: grabbing;
      cursor: -webkit-grabbing;
      box-shadow: 0 0 1px rgba(0, 0, 0, 0.1);
      border: 1em solid currentColor;
    }

    &:hover {
      box-shadow: 0 0.4em 1em rgba(0, 0, 0, 0.15);
    }
  }

  &::-moz-range-thumb {
    height: 2em;
    width: 4em;
    border-radius: 2em;
    appearance: none;
    background: rgba(255, 255, 255, 1);
    border: 0.4em solid currentColor;
    cursor: pointer;
    cursor: move;
    cursor: grab;
    cursor: -webkit-grab;
    transition: box-shadow 0.2s ease-in-out, transform 0.1s ease-in-out;
    box-shadow: 0 1px 11px rgba(0, 0, 0, 0);

    &:active,
    &:hover:active {
      cursor: grabbing;
      cursor: -webkit-grabbing;
      box-shadow: 0 0 1px rgba(0, 0, 0, 0.1);
      border: 1em solid currentColor;
    }

    &:hover {
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
    }
  }
}
</style>

<script setup>
// cf. https://codepen.io/stephanrusu/pen/zYOJdbm

import * as V from "vue";
import * as U from "src/lib/utils";
import { colors } from "quasar";

const mycolor = defineModel();

const hue = V.ref(0);
const hsl = V.ref("");
const hex = V.ref("#ff0000");
const rangeInput = V.ref(null);

function setHue() {
  hex.value = hsl2Hex(hue.value, 100, 50);
  // hsl.value = "hsl(" + hue.value + ", 100%, 50%)";
  hsl.value = "hsl(" + hue.value + ", 10%, 50%)";
  rangeInput.value.style.color = hsl;
  mycolor.value = hex.value;
  // console.log(`[HueSlider.setHue] hue:${hue.value} mycolor:${mycolor.value}`);
}


function hsl2Rgb(h, s, l) {
  s = s / 100;
  l = l / 100;
  var c, x, m, rgb;
  c = (1 - Math.abs(2 * l - 1)) * s;
  x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  m = l - c / 2;
  if (h >= 0 && h < 60) rgb = [c, x, 0];
  if (h >= 60 && h < 120) rgb = [x, c, 0];
  if (h >= 120 && h < 180) rgb = [0, c, x];
  if (h >= 180 && h < 240) rgb = [0, x, c];
  if (h >= 240 && h < 300) rgb = [x, 0, c];
  if (h >= 300 && h <= 360) rgb = [c, 0, x];

  return rgb.map(function (v) {
    return (255 * (v + m)) | 0;
  });
}

function rgb2Hex(r, g, b) {
  var rgb = b | (g << 8) | (r << 16);
  return "#" + (0x1000000 + rgb).toString(16).slice(1);
}

function hsl2Hex(h, s, l) {
  var rgb = hsl2Rgb(h, s, l);
  return rgb2Hex(rgb[0], rgb[1], rgb[2]);
}

V.onMounted(async () => {
  await V.nextTick();
  const sharpColor = U.standardize_color(mycolor.value);
  console.log(`[HueSlider.onMounted] color:${mycolor.value} sharpColor:${sharpColor}`);
  const rgb = colors.textToRgb(sharpColor);
  // console.log(`[HueSlider.onMounted] rgb:${JSON.stringify(rgb)}`);
  const hsv = colors.rgbToHsv(rgb);
  hue.value = hsv.h;
  // console.log(`[HueSlider.onMounted] hue:${hue.value}`);
  setHue();
});

</script>
