<template lang="html">
  <div class="highlight-box" :class="[color, { dark }]" :data-label="label">
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    color: {
      type: String,
      default: 'accent',
    },
    dark: Boolean,
    label: {
      type: String,
      default: 'Please note',
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.highlight-box
  margin: (32 / 16)rem auto
  border-radius: $radius-l
  padding: (24 / 16)rem
  border: (1 / 16)rem solid $accent
  position: relative
  background-color: $bg

  &.dark
    background-color: $bg-dark

  &.accent
    border-color: $accent

    &::before
      color: @border-color

  &.negative
    border-color: $negative-saturated

    &::before
      color: @border-color

  &.positive
    border-color: $positive-saturated

    &::before
      color: @border-color

  &.warning
    border-color: $warning-saturated

    &::before
      color: @border-color

  &::before
    content: attr(data-label)
    display: inline-block
    padding: (2 / 16)rem (8 / 16)rem
    position: absolute
    top: -1rem
    left: 1rem
    font-weight: 700
    background-color: inherit

  :first-child
    margin-top: 0

  :last-child
    margin-bottom: 0
</style>
