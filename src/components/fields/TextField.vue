<template lang="html">
  <section class="text field" :class="{ dark, 'in-split': inSplit }">
    <template v-if="!localised || !languages || languages.length < 2">
      <MbEditor v-if="options && (options.wrapping || options.multiline)" :allow-new-lines="options && options.multiline" :dark="dark" :error="error" :label="label" :max-len="(validation && validation.max) || null" :model-value="modelValue" @update:model-value="handleInput" />
      <MbInput v-else :dark="dark" :error="error" :label="label" :max-len="(validation && validation.max) || null" :model-value="modelValue" @update:model-value="handleInput" />
    </template>
    <div v-else class="field-group" @click="showModal = true">
      <div class="left">
        <span class="label">{{label}}</span>
        <span class="content">{{modelValue && modelValue[languages[0]]}}</span>
      </div>
      <teleport :disabled="!teleportTarget" :to="teleportTarget">
        <template v-for="lang in languages" :key="lang">
          <MbEditor v-if="options && (options.wrapping || options.multiline)" :allow-new-lines="options && options.multiline" :dark="dark" :error="error && error[lang]" :label="lang" :max-len="(validation && validation.max) || null" :model-value="modelValue && modelValue[lang]" @update:model-value="handleInput($event, lang)" />
          <MbInput v-else :dark="dark" :error="error && error[lang]" :label="lang" :max-len="(validation && validation.max) || null" :model-value="modelValue && modelValue[lang]" @update:model-value="handleInput($event, lang)" />
        </template>
      </teleport>
      <MbIcon icon="pencil" />
      <MbModal :dark="dark" :title="label" :visible="showModal" @close="showModal = false">
        <div class="modal-body" ref="modalBody" />
      </MbModal>
    </div>
  </section>
</template>

<script>
import userInputToRegex from '../../assets/js/userInputToRegex';

import field from '../../mixins/field';

export default {
  computed: {
    teleportTarget() {
      if (!this.inSplit && this.splitTarget) return this.splitTarget;
      return this.modalBody;
    },
  },
  data() {
    return {
      modalBody: null,
      showModal: false,
    };
  },
  methods: {
    handleInput(newValue, lang) {
      const error = this.validate(newValue);
      if (!lang) {
        if (error || this.error) this.$emit('update:error', error); // we only emit if we have an error set or the value is invalid

        this.$emit('update:modelValue', newValue);
      } else {
        if (error || (this.error && this.error[lang])) this.$emit('update:error', { ...this.error, [lang]: error });
        this.$emit('update:modelValue', { ...this.modelValue, [lang]: newValue });
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
  },
  mixins: [field],
  mounted() {
    if (this.$refs.modalBody) this.modalBody = this.$refs.modalBody;
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.text.field
  &.in-split.dark
    .input,
    .editor::v-deep(.content-wrapper)
      background-color: $bg-tertiary-dark

  .input
    margin-top: 0
    width: 100%

  .editor::v-deep(.content-wrapper)
    margin-top: 0
</style>
