<template lang="html">
  <section class="text field" :class="{ dark, 'in-split': inSplit }">
    <MbEditor v-if="options && (options.wrapping || options.multiline)" :allow-new-lines="options && options.multiline" :dark="dark" :error="error" :label="label" :max-len="(validation && validation.max) || null" :model-value="modelValue" @update:model-value="handleInput" />
    <MbInput v-else :dark="dark" :error="error" :label="label" :max-len="(validation && validation.max) || null" :model-value="modelValue" @update:model-value="handleInput" />
  </section>
</template>

<script>
import userInputToRegex from '../../assets/js/userInputToRegex';

import field from '../../mixins/field';

export default {
  methods: {
    handleInput(newValue) {
      this.validate(newValue);
      this.$emit('update:modelValue', newValue);
    },
    validate(value) {
      if (!this.validation) return;

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

      if (error || this.error) this.$emit('update:error', error); // we only emit if we have an error set or the value is invalid
    },
  },
  mixins: [field],
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

// .text.field
</style>
