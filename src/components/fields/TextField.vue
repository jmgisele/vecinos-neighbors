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
      @modal-closed="$emit('update:error', validateLocalisedValues())"
      @update:active="$emit('update:active', $event)"
    >
      <MbEditor v-if="options && (options.wrapping || options.multiline)" :allow-new-lines="options && options.multiline" :class="{ 'in-split': teleportTarget }" :dark="dark" :error="error && error[lang]" :label="lang" :max-len="(validation && validation.max) || null" :model-value="safeModelValue[lang]" @update:model-value="handleInput($event, lang)" />
      <MbInput v-else :class="{ 'in-split': teleportTarget }" :dark="dark" :error="error && error[lang]" :label="lang" :max-len="(validation && validation.max) || null" :model-value="safeModelValue[lang]" @update:model-value="handleInput($event, lang)" />
    </LocalisedFieldsContainer>
  </section>
</template>

<script>
import userInputToRegex from '../../assets/js/userInputToRegex';

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
  methods: {
    handleInput(newValue, lang) {
      const error = this.validate(newValue);
      if (!lang) {
        if (error || this.error) this.$emit('update:error', error); // we only emit if we have an error set or the value is invalid

        this.$emit('update:modelValue', newValue);
      } else {
        if (error || (this.error && this.error[lang])) {
          if (error) this.$emit('update:error', { ...this.error, [lang]: error });
          else if (Object.keys(this.error).every((key) => key === lang || !this.error[key])) this.$emit('update:error', ''); // so it can be cleared
          else this.$emit('update:error', { ...this.error, [lang]: error });
        }
        this.$emit('update:modelValue', { ...this.safeModelValue, [lang]: newValue });
      }
    },
    validate(value) {
      if (!this.validation) return '';

      let error = '';

      if (this.validation.required && !value) error = 'This field is required';
      else if (this.validation.enforceMinMax && (this.validation.min || this.validation.max)) {
        if (this.validation.min && value.length < this.validation.min) error = 'The value is too short';
        if (this.validation.max && value.length > this.validation.max) error = 'The value is too long';
      } else if (this.validation.regex) {
        try {
          if (!userInputToRegex(this.validation.regex).test(value)) error = this.validation.regexError || 'Invalid value';
        } catch (err) {
          // do nothing, if we end up here it’s because the user-input regex was invalid
        }
      }

      return error;
    },
    validateLocalisedValues() {
      if (!this.validation) return '';

      const errors = {};
      let hasErrors = false;
      this.languages.forEach((lang) => {
        const error = this.validate((this.safeModelValue[lang]) || '');
        if (error) {
          hasErrors = true;
          errors[lang] = error;
        }
      });
      if (hasErrors) return errors;
      return '';
    },
  },
  mixins: [field],
  watch: {
    active(nv) {
      if (!nv) this.$emit('update:error', this.validateLocalisedValues());
    },
    showLocalisedOptions(nv) {
      if (nv) this.$emit('update:error', this.validateLocalisedValues());
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
