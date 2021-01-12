<template lang="html">
  <button class="color-picker" :class="{ dark }" @click="popover.show = !popover.show">
    <div class="color-swatch">
      <div class="old-color" :style="{ backgroundColor: modelValue }" />
      <transition @after-leave="updateModel">
        <div v-show="popover.show && newColor && newColor !== modelValue" class="new-color" :style="{ backgroundColor: newColor }" />
      </transition>
    </div>
    <span>{{modelValue}}</span>
  </button>
</template>

<script>
export default {
  data() {
    return {
      currentColor: null,
      newColor: 'blue',
      popover: {
        show: false,
        x: 0,
        y: 0,
      },
    };
  },
  methods: {
    updateModel() {
      this.$emit('update:modelValue', this.newColor);
    },
  },
  props: {
    dark: Boolean,
    format: {
      type: String,
      default: 'hex',
      validator: (v) => ['hex', 'rgb', 'rgba'].includes(v),
    },
    modelValue: String,
    palette: Array,
    paletteOnly: Boolean,
    removable: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.color-picker
  position: relative
  border: none
  background-color: $bg-secondary
  color: inherit
  border-radius: $radius-m
  padding: 0.5rem
  padding-right: 1.5rem
  display: inline-flex
  align-items: center
  cursor: pointer
  transition: background-color 200ms ease

  &:hover
    background-color: $bg-tertiary

  &:focus
    background-color: $bg

    &::before
      opacity: 1

  &:active
    transform: translateY(2px)

  &.dark
    background-color: $bg-secondary-dark

    &:hover
      background-color: $bg-tertiary-dark

    &:focus
      background-color: $bg-dark

  &::before
    content: ''
    position: absolute
    top: -1px
    left: @top
    right: @top
    bottom: @top
    box-shadow: inset 0 0 0 0.125rem $accent
    opacity: 0
    border-radius: @border-radius
    transition: opacity 200ms ease

  .color-swatch
    border-radius: $radius-s
    width: 2.625rem
    height: @width
    margin-right: 1rem
    background-image: linear-gradient(45deg, $text-tertiary 25%, transparent 25%), linear-gradient(-45deg, $text-tertiary 25%, transparent 25%), linear-gradient(45deg, transparent 75%, $text-tertiary 75%), linear-gradient(-45deg, transparent 75%, $text-tertiary 75%);
    background-size: 1rem 1rem;
    background-position: 0 0, 0 0.5rem, 0.5rem -0.5rem, -0.5rem 0;
    position: relative
    overflow: hidden

    .old-color,
    .new-color
      position: absolute
      top: 0
      left: 0
      width: 100%
      height: 100%

    .new-color
      left: auto
      right: 0
      width: 50%
      transform-origin: right

      &.v-enter-active,
      &.v-leave-active
        transition: transform 150ms ease

        &.v-enter-from
          transform: scaleX(0)

        &.v-leave-to
          transform: scaleX(2)
</style>
