<template lang="html">
  <section class="text field" :class="{ dark, localised: showLocalisedOptions }">
    <template v-if="!showLocalisedOptions">
      <MbEditor v-if="options && (options.wrapping || options.multiline)" :allow-new-lines="options && options.multiline" :class="{ 'in-split': inSplit }" :dark="dark" :error="error" :label="label" :max-len="(validation && validation.max) || null" :model-value="safeModelValue" ref="editor" @update:model-value="handleInput" />
      <MbInput v-else :class="{ 'in-split': inSplit }" :dark="dark" :error="error" :label="label" :max-len="(validation && validation.max) || null" :model-value="safeModelValue" @update:model-value="handleInput" />
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
      <MbEditor v-if="options && (options.wrapping || options.multiline)" :allow-new-lines="options && options.multiline" :class="{ 'in-split': teleportTarget }" :dark="dark" :error="error instanceof Map ? error.get(lang)  : ''" :label="lang" :max-len="(validation && validation.max) || null" :model-value="safeModelValue[lang]" @update:model-value="handleInput($event, lang)" />
      <MbInput v-else :class="{ 'in-split': teleportTarget }" :dark="dark" :error="error instanceof Map ? error.get(lang)  : ''" :label="lang" :max-len="(validation && validation.max) || null" :model-value="safeModelValue[lang]" @update:model-value="handleInput($event, lang)" />
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
      if (typeof this.modelValue === 'string') return this.modelValue;
      if (this.modelValue) {
        return Object.values(this.modelValue).find((value) => value) || '';
      }
      return '';
    },
    safeModelValue() {
      if (this.showLocalisedOptions) {
        if (this.modelValue && typeof this.modelValue === 'object') return this.modelValue;
        if (typeof this.modelValue === 'string') return { [this.languages[0]]: this.modelValue };
        return this.languages.reduce((acc, lang) => {
          acc[lang] = '';
          return acc;
        }, {});
      }
      if (this.modelValue && typeof this.modelValue === 'object') return Object.values(this.modelValue)[0] || '';
      return this.modelValue || '';
    },
  },
  data() {
    return {
      editors: [],
    };
  },
  mixins: [field],
  watch: {
    active(nv) {
      if (!nv) this.$emit('update:error', this.validateLocalisedValues(this.safeModelValue, ''));
    },
    showLocalisedOptions(nv) {
      if (nv) this.$emit('update:error', this.validateLocalisedValues(this.safeModelValue, ''));
      else {
        const error = this.validate(this.safeModelValue);
        if (error || this.error) this.$emit('update:error', error); // we only emit if we have an error set or the value is invalid
      }
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'

.text.field
  .input
    margin-top: 0
    width: 100%

  .editor::v-deep(.content-wrapper)
    margin-top: 0

.localisation-modal .input
  display: flex
  width: 100%

.in-split.dark
  &.input,
  &.editor::v-deep(.content-wrapper)
    background-color: $bg-tertiary-dark
</style>
