<template lang="html">
  <label class="toggle" :class="{ active: value, dark, disabled, 'full-width': label }">
    <span v-if="label">{{ label }}</span>
    <button type="button" @click="$emit('input', !value)">
      <div class="icon-wrapper">
        <MbIcon v-if="icon" :icon="icon" />
      </div>
    </button>
  </label>
</template>

<script>
export default {
  computed: {
    icon() {
      if (!this.icons || this.icons.length === 0) return false;
      if (this.value) return this.icons[1];
      return this.icons[0];
    },
    label() {
      return this.$slots.default && this.$slots.default[0] && this.$slots.default[0].text;
    },
  },
  props: {
    dark: Boolean,
    disabled: Boolean,
    icons: Array,
    value: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'

.toggle
  display: inline-flex
  vertical-align: middle
  align-items: center
  user-select: none

  &.full-width
    display: flex

  &.dark
    button
      &:hover,
      &:focus
        background-color: $bg-tertiary-dark

      &:active
        background-color: $bg-secondary-dark

  &.active
    button .icon-wrapper
      background-color: $accent
      transform: translateX(1.5rem)

      .icon
        &.v-enter
          transform: rotate(-45deg)

        &.v-leave-to
          transform: rotate(45deg)

  &.disabled
    pointer-events: none
    color: $text-tertiary

    &.dark
      color: $text-tertiary-dark

      button
        border-color: @color

        .icon-wrapper
          background-color: @color

    button
      box-shadow: none
      border: 1px dashed @color
      padding: calc(0.25rem - 1px)

      .icon-wrapper
        background-color: @color

  span
    margin-right: auto

  button
    box-shadow: inset 0 0 0 1px $accent
    display: flex
    flex-shrink: 0
    background-color: transparent
    width: 4rem
    height: 2.5rem
    padding: 0.25rem
    border: none
    border-radius: (@height / 2)
    cursor: pointer
    transition: background-color 200ms ease

    &:not(:first-child)
      margin-left: 1rem

    &:hover,
    &:focus
      background-color: $bg-tertiary

    &:focus
      box-shadow: inset 0 0 0 2px $accent

    &:active
      background-color: $bg-secondary

    .icon-wrapper
      background-color: $accent-secondary
      color: $text-dark
      padding: 0.25rem
      width: (@height - 0.5)
      height: @width
      border-radius: @border-radius
      transition: transform 200ms ease, background-color 200ms ease

      .icon
        &.v-enter
          transform: rotate(45deg)

        &.v-leave-to
          transform: rotate(-45deg)
</style>
