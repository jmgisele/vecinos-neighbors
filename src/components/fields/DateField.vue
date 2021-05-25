<template lang="html">
  <section class="date field" :class="{ dark, error, 'in-split': inSplit }">
    <span>{{label}}:</span>
    <MbDatePicker :class="{ error }" :dark="dark" :format="options.outputFormat" :label="error" :max="validation && validation.max" :min="validation && validation.min" :model-value="safeModelValue" :only="options.only" :removable="options.removable" :show-time="options.showTime" @update:model-value="handleInput" />
  </section>
</template>

<script>
import field from '../../mixins/field';

export default {
  computed: {
    safeModelValue() {
      // sometimes dates may be parsed as Dates by JS-YAML, so we convert it back to outputFormat here to avoid errors
      if (this.modelValue instanceof Date) return this.options.outputFormat === 'iso' ? this.modelValue.toISOString() : this.modelValue.valueOf;
      return this.modelValue;
    },
  },
  mixins: [field],
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'

.date.field
  display: flex
  align-items: center

  &.in-split.dark
    > .date-picker
      background-color: $bg-tertiary-dark

      &:hover
        background-color: lighten($bg-tertiary-dark, 5)

      &:active
        background-color: $bg-secondary-dark

  > span
    margin-right: auto

  > .date-picker
    margin-left: 1rem

    &.error
      &::v-deep(.floating-label)
        color: $negative-saturated

      &:not(:focus)::before
        opacity: 1
        border-color: $negative
</style>
