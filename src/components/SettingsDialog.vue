<template>
  <q-dialog v-model="show" persistent>
    <q-card :style="dialogCardStyle">
      <q-card-section :style="dialogSectionStyle">
        <div class="text-h6">HSM Settings</div>
      </q-card-section>
      <q-separator />
      <q-card-section :style="dialogSectionStyle">
        <div v-for="(value, key) in settings" :key="key" class="q-mb-md">
          <q-input v-if="isString(value)" v-model="settings[key]" :label="key" dense :style="inputStyle" />
          <q-input v-else-if="isNumber(value)" v-model.number="settings[key]" :label="key" type="number" dense
            :style="inputStyle" />
          <q-toggle v-else-if="isBoolean(value)" v-model="settings[key]" :label="key" dense :style="inputStyle" />
          <q-btn v-else-if="isObjectOrArray(value)" flat color="secondary" :label="'Edit ' + key"
            @click="openSubDialog(key, value)" :style="inputStyle" />
          <div v-else :style="inputStyle">{{ key }}: <em>unsupported type</em></div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" v-if="!isSubDialog" :style="dialogSectionStyle">
        <q-btn flat label="Reset to Defaults" color="negative" @click="resetToDefaults" :style="inputStyle" />
        <q-btn flat label="Cancel" color="primary" v-close-popup :style="inputStyle" />
        <q-btn flat label="Apply" color="primary" @click="applySettings" :style="inputStyle" />
      </q-card-actions>
      <q-card-actions align="right" v-else :style="dialogSectionStyle">
        <q-btn flat label="OK" color="primary" @click="closeSubDialog" :style="inputStyle" />
      </q-card-actions>
    </q-card>
    <SettingsDialog v-if="subDialog.show" v-model="subDialog.show" :element="subDialog.value" :is-sub-dialog="true" />
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed, reactive } from 'vue';
import { hsm } from 'src/classes/Chsm';
import { loadUserSettings } from 'src/lib/settingsManager';
import SettingsDialog from './SettingsDialog.vue';

const props = defineProps({
  modelValue: Boolean,
  element: Object,
  isSubDialog: Boolean
});
const emit = defineEmits(['update:modelValue', 'apply']);

const show = ref(props.modelValue);
watch(() => props.modelValue, v => show.value = v);
watch(show, v => emit('update:modelValue', v));

// Use props.element directly for subdialogs, and a computed getter for hsm.settings for the root dialog
const settings = computed(() => {
  if (props.element) return props.element;
  if (typeof hsm === 'object' && hsm && hsm.settings) return hsm.settings;
  return {};
});

const isSubDialog = props.isSubDialog || false;

function isString(val) { return typeof val === 'string'; }
function isNumber(val) { return typeof val === 'number'; }
function isBoolean(val) { return typeof val === 'boolean'; }
function isObjectOrArray(val) { return val && typeof val === 'object'; }

const subDialog = reactive({ show: false, value: null });
function openSubDialog(key, value) {
  subDialog.value = value;
  subDialog.show = true;
}
function closeSubDialog() {
  subDialog.show = false;
  emit('update:modelValue', false); // Close this dialog, parent will reopen
}

function applySettings() {
  Object.assign(hsm.settings, settings);
  emit('apply', { ...settings });
  show.value = false;
}

async function resetToDefaults() {
  const userDefaults = await loadUserSettings();
  if (userDefaults) Object.assign(settings, userDefaults);
}

// Dialog color logic
const dialogColors = computed(() => {
  const dialogs = (typeof hsm === 'object' && hsm && hsm.settings && hsm.settings.dialogs) ? hsm.settings.dialogs : {};
  return {
    background: dialogs.background || '#2b3a55',
    textColor: dialogs.textColor || '#f7c873',
  };
});
const dialogCardStyle = computed(() => ({
  'min-width': '400px',
  'max-width': '90vw',
  'background': dialogColors.value.background + ' !important',
  'color': dialogColors.value.textColor + ' !important',
}));
const dialogSectionStyle = computed(() => ({
  'background': dialogColors.value.background + ' !important',
  'color': dialogColors.value.textColor + ' !important',
}));
const inputStyle = computed(() => ({
  'color': dialogColors.value.textColor + ' !important',
}));
</script>
