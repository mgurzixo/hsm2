<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" :width="size + ''" :height="size + ''" v-bind="$attrs">
    <g id="q-icon-hsm-state">
      <path d="M4 6 Q4 4 6 4 H18 Q20 4 20 6 V18 Q20 20 18 20 H6 Q4 20 4 18 Z" fill="none" stroke="currentColor"
        stroke-width="2" />
      <rect x="4" y="7" width="16" height="2" rx="1" :fill="color" />
    </g>
  </svg>
</template>

<script setup>
const props = defineProps({
  size: {
    type: [Number, String],
    default: 24
  },
  color: {
    type: String,
    default: 'currentColor'
  }
});
</script>
