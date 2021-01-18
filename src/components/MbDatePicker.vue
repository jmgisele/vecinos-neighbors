<template lang="html">
  <button class="date-picker" :class="{dark}" @click="activate">
  </button>
</template>

<script>
export default {
  emits: ['update:modelValue'],
  methods: {
    activate() {

    },
  },
  props: {
    dark: Boolean,
    format: {
      type: String,
      validator: (v) => ['ms', 'iso'].includes(v),
      default: 'ms',
    },
    modelValue: [String, Number],
    showTime: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
</style>
