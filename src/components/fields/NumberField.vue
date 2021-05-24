<template lang="html">
  <section class="number field" :class="{ dark, localised: showLocalisedOptions }">
    <template v-if="!showLocalisedOptions">
      <MbInput :class="{ 'in-split': inSplit }" :dark="dark" :error="error && String(error)" :label="label" :max-len="(validation && validation.max) || null" :model-modifiers="{ number: true }" :model-value="safeModelValue" type="number" @update:model-value="handleInput" />
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
      <MbInput :class="{ 'in-split': teleportTarget }" :dark="dark" :error="error instanceof Map ? error.get(lang) : ''" :label="lang" :max-len="(validation && validation.max) || null" :model-modifiers="{ number: true }" :model-value="safeModelValue[lang]" type="number" @update:model-value="handleInput($event, lang)" />
    </LocalisedFieldsContainer>
  </section>
</template>

<script>
import field from '../../mixins/field';

import LocalisedFieldsContainer from '../utility/LocalisedFieldsContainer.vue';

export default {
  components: {
    LocalisedFieldsContainer,
  },
  computed: {
    firstLocalisedValue() {
      if (typeof this.modelValue === 'number') return this.modelValue;
      if (this.modelValue) {
        return Object.values(this.modelValue).find((value) => value) || null;
      }
      return null;
    },
    safeModelValue() {
      if (this.showLocalisedOptions) {
        if (this.modelValue && typeof this.modelValue === 'object') return this.modelValue;
        return this.languages.reduce((acc, lang, index) => {
          if (index === 0 && this.modelValue) acc[lang] = Number(this.modelValue);
          else acc[lang] = '';
          return acc;
        }, {});
      }
      if (this.modelValue && typeof this.modelValue === 'object') return Object.values(this.modelValue)[0] || '';
      return typeof this.modelValue === 'number' ? this.modelValue : '';
    },
  },
  methods: {
    convertLocalisedValue(localised) {
      if (localised) {
        return this.languages.reduce((acc, lang, index) => {
          if (index === 0 && typeof this.modelValue === 'number') acc[lang] = this.modelValue;
          else acc[lang] = '';
          return acc;
        }, {});
      }
      return Object.values(this.modelValue)[0] || '';
    },
  },
  mixins: [field],
  watch: {
    active(nv) {
      if (!nv) this.$emit('update:error', this.validateLocalisedValues(this.safeModelValue, ''));
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'

.number.field
  .input
    margin-top: 0
    width: 100%

.localisation-modal .input
  display: flex
  width: 100%

.in-split.dark
  &.input
    background-color: $bg-tertiary-dark
</style>
