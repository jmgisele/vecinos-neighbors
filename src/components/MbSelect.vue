<template lang="html">
  <MbButton v-bind="$attrs" class="select" :class="{ placeholder: modelValue === null }" :dark="dark" :disabled="disabled" icon="chevron-down" :icon-first="false" ref="button" :rounded="rounded" @click="activate">
    {{currentOption}}
  </MbButton>
  <MbPopover center-x class="item-wrapper" :dark="dark" no-content-padding ref="popover" :style="{ width: `${popoverWidth}px` }" :visible="active" :x="position.x" :y="position.y" @close="deactivate">
    <ul class="items" :class="{ dark }">
      <li v-for="option in options" :class="{ disabled: option.disabled }" :key="option.value" :tabindex="option.disabled ? -1 : 0" @click="selectOption(option.value)" @keyup.enter="selectOption(option.value)" @keyup.space="selectOption(option.value)">{{option.label || option.value}}</li>
    </ul>
  </MbPopover>
</template>

<script>
export default {
  beforeUnmount() {
    window.removeEventListener('scroll', this.deactivate, { capture: true });
  },
  computed: {
    currentOption() {
      if (this.modelValue === null) return this.placeholder;
      const activeOption = this.options.find((option) => option.value === this.modelValue);
      if (!activeOption) return this.modelValue;
      return activeOption.label || activeOption.value;
    },
  },
  data() {
    return {
      active: false,
      popoverWidth: 0,
      position: {
        x: 0,
        y: 0,
      },
    };
  },
  emits: ['update:modelValue'],
  inheritAttrs: false,
  methods: {
    activate() {
      const buttonRect = this.$refs.button.$el.getBoundingClientRect();
      const remBase = Number.parseInt(window.getComputedStyle(document.documentElement).fontSize, 10);
      this.position.x = buttonRect.left + buttonRect.width / 2;
      this.position.y = Math.round(buttonRect.top);
      this.popoverWidth = buttonRect.width + remBase;
      this.active = true;
      window.addEventListener('scroll', this.deactivate, { capture: true });
    },
    deactivate(e) {
      if (e && e.target === this.$refs.popover.$refs.el) return; // hacky but needed since it’s teleporting
      this.active = false;
      window.removeEventListener('scroll', this.deactivate, { capture: true });
    },
    selectOption(value) {
      this.$emit('update:modelValue', value);
      this.deactivate();
    },
  },
  props: {
    dark: Boolean,
    disabled: Boolean,
    options: {
      type: Array,
      required: true,
    },
    modelValue: {},
    placeholder: {
      type: String,
      default: 'Select something…',
    },
    rounded: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.select
  min-width: (192 / 16)rem

  &.icon.reversed
    padding-left: 1rem

  ::v-deep(.label)
    margin-right: auto

.items
  list-style: none
  user-select: none
  padding: 0.5rem
  margin: 0

  &.dark
    li
      &.disabled
        color: $text-tertiary-dark

      &:hover,
      &:focus
        background-color: $bg-tertiary-dark

  li
    padding: 0.75rem 1rem
    white-space: nowrap
    overflow: hidden
    text-overflow: ellipsis
    cursor: pointer
    border-radius: $radius-m
    transition: background-color 200ms ease

    &.disabled
      pointer-events: none
      color: $text-tertiary

    &:hover,
    &:focus
      background-color: $bg-secondary
</style>
