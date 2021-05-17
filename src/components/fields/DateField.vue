<template lang="html">
  <section class="date field">
    <span>{{label}}:</span>
    <MbDatePicker :class="{ error }" :dark="dark" :format="options.outputFormat" :label="error" :max="validation && validation.max" :min="validation && validation.min" :model-value="modelValue" :only="options.only" :removable="options.removable" :show-time="options.showTime" @update:model-value="$emit('update:modelValue', $event)" />
  </section>
</template>

<script>
import field from '../../mixins/field';

export default {
  computed: {
  },
  mixins: [field],
};
</script>

<style lang="stylus" scoped>
.date.field
  display: flex
  align-items: center

  > span
    margin-right: auto

  > .date-picker
    margin-left: 1rem
</style>
