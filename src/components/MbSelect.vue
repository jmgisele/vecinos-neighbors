<template lang="html">
  <MbButton class="select" :class="{ placeholder: modelValue === null }" :dark="dark" v-bind="$attrs" :disabled="disabled" icon="chevron-down" :rounded="rounded">
    {{currentOption}}
  </MbButton>
  <MbPopover :visible="active">
    <ul>
      <li v-for="option in options" :key="option.value">{{option.label || option.value}}</li>
    </ul>
  </MbPopover>
</template>

<script>
export default {
  computed: {
    currentOption() {
      if (this.modelValue === null) return this.placeholder;
      return this.options.find((option) => option.value === this.modelValue);
    },
  },
  data() {
    return {
      active: false,
      position: {
        x: 0,
        y: 0,
      },
      modelValue: null,
    };
  },
  inheritAttrs: false,
  props: {
    dark: Boolean,
    disabled: Boolean,
    options: Array,
    placeholder: {
      type: String,
      default: 'Select something…',
    },
    rounded: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
</style>
