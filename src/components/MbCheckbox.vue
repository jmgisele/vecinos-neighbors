<template lang="html">
  <label class="checkbox" :class="{dark, disabled, 'full-width': label}">
    <input type="checkbox" :checked="value" :disabled="disabled" @change="$emit('input', $event.target.checked)">
    <div class="visual-checkbox">
      <MbIcon icon="check" />
    </div>
    <span v-if="label">{{label}}</span>
  </label>
</template>

<script>
export default {
  computed: {
    label() {
      return this.$slots.default && this.$slots.default[0] && this.$slots.default[0].text;
    },
  },
  props: {
    dark: Boolean,
    disabled: Boolean,
    value: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.checkbox
  position: relative
  user-select: none
  cursor: pointer

  &.full-width
    display: flex

  &.dark
    &:hover > input:not(:checked) + .visual-checkbox
      background-color: $bg-secondary-dark

    > input:focus:not(:checked) + .visual-checkbox
      background-color: $bg-secondary-dark

  &.disabled
    pointer-events: none
    color: $text-tertiary

    &.dark
      color: $text-tertiary-dark

      .visual-checkbox
        border-color: @color

      > input:checked + .visual-checkbox
        background-color: $bg-secondary-dark
        color: @color

    .visual-checkbox
      border: 1px dashed @color
      box-shadow: none
      padding: calc(0.25rem - 1px)

    > input:checked + .visual-checkbox
      background-color: $bg-secondary
      color: @color

  &:hover
    .visual-checkbox
      background-color: $bg-secondary

  > input
    opacity: 0 // can’t be display: none because of focussing
    width: 1.5rem
    height: @width
    position: absolute
    pointer-events: none

    &:focus + .visual-checkbox
      background-color: $bg-secondary
      box-shadow: inset 0 0 0 2px $accent

    &:checked + .visual-checkbox
      color: $text-dark
      background-color: $accent

      .icon >>> path
        stroke-dashoffset: 0

    &:checked:focus + .visual-checkbox
      box-shadow: inset 0 0 0 2px $accent-secondary

  .visual-checkbox
    display: inline-block
    width: 1.5rem
    height: @width
    border-radius: $radius-m
    padding: 0.25rem
    line-height: 0
    box-shadow: inset 0 0 0 1px $accent
    transition: box-shadow 200ms ease, background-color 200ms ease

    .icon
      width: 1rem
      height: @width

      >>> path
        stroke-dasharray: 19.79899024963379
        stroke-dashoffset: @stroke-dasharray
        transition: stroke-dashoffset 100ms ease
        transition-delay: 100ms
        stroke-width: 3

  > span
    margin-left: 0.5rem
</style>
