<template lang="html">
  <div class="segmented-selector" :class="{ dark }">
    <transition>
      <div v-show="activeOptionIndex > -1" class="ink" :style="{ transform: inkTransform, width: `calc((100% - ${0.5 * (options.length - 1)}rem) * ${1 / options.length })` }" />
    </transition>
    <span v-for="(option, index) in options" class="option" :class="{ active: index === activeOptionIndex, disabled: option.disabled }" :key="index" :tabindex="option.disabled ? -1 : 0" @click.left="selectOption(option)" @keydown.space.prevent @keyup.space.enter="selectOption(option)">{{option.label || option.value || option}}</span>
  </div>
</template>

<script>
export default {
  computed: {
    activeOptionIndex() {
      return this.options.findIndex((option) => {
        if (typeof option.value !== 'undefined') return this.modelValue === option.value;
        return this.modelValue === option;
      });
    },
  },
  created() {
    if (this.activeOptionIndex < 0) return;
    this.inkTransform = `translateX(calc(${this.activeOptionIndex * 100}% + ${this.activeOptionIndex * 0.5}rem))`;
  },
  data() {
    return {
      inkTransform: null,
    };
  },
  emits: ['update:modelValue'],
  methods: {
    selectOption(option) {
      if (typeof option.value !== 'undefined') this.$emit('update:modelValue', option.value);
      else this.$emit('update:modelValue', option);
    },
  },
  props: {
    dark: Boolean,
    modelValue: {},
    options: Array,
  },
  watch: {
    activeOptionIndex(nv, ov) {
      if (nv < 0) this.inkTransform = `translateX(calc(${ov * 100}% + ${ov * 0.5}rem))`;
      else this.inkTransform = `translateX(calc(${nv * 100}% + ${nv * 0.5}rem))`;
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.segmented-selector
  background-color: $bg-secondary
  border-radius: $radius-m
  position: relative
  display: flex
  box-shadow: 0 0 0 0.125rem @background-color

  &.dark
    background-color: $bg-secondary-dark
    box-shadow: 0 0 0 0.125rem @background-color

    .option.disabled
      color: $text-tertiary-dark

  .ink
    background-color: $accent
    border-radius: @border-radius
    position: absolute
    top: 0
    left: 0
    width: 0
    height: 100%
    transition: transform 200ms cubic-bezier(0.645, 0.045, 0.355, 1.000)

    &.v-enter-active,
    &.v-leave-active
      transition: opacity 200ms ease

      &.v-enter-from,
      &.v-leave-to
        opacity: 0

  .option
    display: inline-block
    width: 100%
    text-align: center
    text-overflow: ellipsis
    overflow: hidden
    position: relative
    padding: 0.75rem 1.25rem
    cursor: pointer
    border-radius: @border-radius
    white-space: nowrap

    &:not(:last-child)
      margin-right: 0.5rem

    &.active
      color: $text-dark
      pointer-events: none

      &.disabled
        color: $text-tertiary-dark

    &:focus,
    &:hover
      &::before
        opacity: 1

    &:active
      transform: translateY(0.125rem)

    &.disabled
      pointer-events: none
      color: $text-tertiary

    &::before
      content: ''
      position: absolute
      display: block
      width: 100%
      height: 100%
      top: 0
      left: 0
      border-radius: @border-radius
      box-shadow: inset 0 0 0 0.125rem $accent
      opacity: 0
      transition: opacity 200ms ease
</style>
