<template lang="html">
  <section class="tags field" :class="{ dark, localised: showLocalisedOptions }">
    <template v-if="!showLocalisedOptions">
      <MbTagInput :allow-unsuggested="options.allowUnsuggested" :autocomplete-model="autocompleteModel" :autocomplete-property="autocompleteProperty" :class="{ 'in-split': inSplit }" :dark="dark" :external-error="error && String(error)" :label="label" :max="(validation && validation.max) || null" :min="(validation && validation.min) || null" :model-value="safeModelValue" @update:model-value="handleInput" />
    </template>
    <LocalisedFieldsContainer
      v-else
      v-slot="{ lang }"
      :active="active"
      :dark="dark"
      :display-value="firstLocalisedValue"
      :error="error"
      :in-split="inSplit"
      :label="label"
      :languages="languages"
      :teleport-target="teleportTarget"
      @modal-closed="$emit('update:error', validateLocalisedValues(safeModelValue, ''))"
      @update:active="$emit('update:active', $event)"
    >
      <MbTagInput :allow-unsuggested="options.allowUnsuggested" :autocomplete-model="options.autocompleteModel" :autocomplete-property="autocompleteProperty" :class="{ 'in-split': inSplit }" :dark="dark" :external-error="error instanceof Map ? error.get(lang) : null" :label="label" :max="(validation && validation.max) || null" :min="(validation && validation.min) || null" :model-value="safeModelValue[lang]" @update:model-value="handleInput($event, lang)" />
    </LocalisedFieldsContainer>
  </section>
</template>

<script>
import fs, { joinPath } from '../../fs';

import field from '../../mixins/field';

import LocalisedFieldsContainer from '../utility/LocalisedFieldsContainer.vue';

export default {
  components: {
    LocalisedFieldsContainer,
  },
  computed: {
    autocompleteModel() {
      if (Array.isArray(this.options.autocompleteModel)) return this.options.autocompleteModel;
      // it’s a file
      return this.fileModel;
    },
    autocompleteProperty() {
      if (!this.options.autocompleteModel || !Array.isArray(this.options.autocompleteModel) || this.options.autocompleteModel.length === 0) return null;
      if (this.options.autocompleteModel[0] !== 'string') return 'label';
      return null;
    },
    firstLocalisedValue() {
      if (this.modelValue && Array.isArray(this.modelValue)) return this.modelValue.map((entry) => entry.label || entry).join(', ');
      if (this.modelValue) {
        const firstVal = Object.values(this.modelValue).find((value) => value);
        if (!firstVal) return null;
        return firstVal.map((entry) => entry.label || entry).join(', ');
      }
      return null;
    },
    safeModelValue() {
      if (this.showLocalisedOptions) {
        if (this.modelValue && typeof this.modelValue === 'object' && !Array.isArray(this.modelValue)) return this.modelValue;
        return this.languages.reduce((acc, lang, index) => {
          if (index === 0 && this.modelValue) acc[lang] = this.modelValue;
          else acc[lang] = [];
          return acc;
        }, {});
      }
      if (this.modelValue && typeof this.modelValue === 'object' && !Array.isArray(this.modelValue)) return Object.values(this.modelValue)[0] || [];
      return this.modelValue || [];
    },
  },
  data() {
    return {
      fileModel: [],
    };
  },
  methods: {
    convertLocalisedValue(localised) {
      if (localised) {
        return this.languages.reduce((acc, lang, index) => {
          if (index === 0 && this.modelValue) acc[lang] = this.modelValue;
          else acc[lang] = [];
          return acc;
        }, {});
      }
      return Object.values(this.modelValue)[0] || [];
    },
    async fetchFileModel() {
      if (!this.options.autocompleteModel.path || !this.options.autocompleteModel.key) this.fileModel = [];
      else this.fileModel = JSON.parse(await fs.readFile(joinPath('/projects', this.$store.state.currentProject.id, this.options.autocompleteModel.path), 'utf8'))[this.options.autocompleteModel.key];
    },
  },
  mixins: [field],
  watch: {
    active(nv) {
      if (!nv) this.$emit('update:error', this.validateLocalisedValues(this.safeModelValue, ''));
    },
    'options.autocompleteModel': {
      handler(nv, ov) {
        if (!Array.isArray(nv) && nv.path && nv.key && (this.fileModel.length === 0 || ov.path !== nv.path)) this.fetchFileModel();
      },
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'

.tags.field
  .tag-input
    margin-top: 0

.localisation-modal .tag-input:not(:last-child)
  margin-bottom: 2rem

.in-split.dark.tag-input
    background-color: $bg-tertiary-dark
</style>
