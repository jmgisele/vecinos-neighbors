<template lang="html">
  <label class="toggle" :class="{ active: modelValue, dark, disabled, 'full-width': label }">
    <span v-if="label">{{ label }}</span>
    <button type="button" v-on="events">
      <div class="icon-wrapper">
        <MbIcon v-if="icon" :icon="icon" />
      </div>
    </button>
  </label>
</template>

<script>
import getSlotTextContent from '@/assets/js/getSlotTextContent';

export default {
  computed: {
    events() {
      if (this.tooltip) {
        return {
          click: () => this.$emit('update:modelValue', !this.modelValue),
          focus: this.handleTooltip,
          mouseenter: this.handleTooltip,
        };
      }
      return { click: () => this.$emit('update:modelValue', !this.modelValue) };
    },
    icon() {
      if (!this.icons || this.icons.length === 0) return false;
      if (this.modelValue) return this.icons[1];
      return this.icons[0];
    },
    label() {
      return this.$slots.default && getSlotTextContent(this.$slots.default());
    },
  },
  methods: {
    handleTooltip(e) {
      this.$store.commit('setTooltip', { message: this.tooltip, target: e.target });
    },
  },
  props: {
    dark: Boolean,
    disabled: Boolean,
    icons: Array,
    modelValue: Boolean,
    tooltip: String,
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
      transform: translateX(1rem)

      .icon
        &.v-enter-from
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
    width: 3rem
    height: 2rem
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
        width: 100%
        height: @width
        display: block

        &.v-enter-from
          transform: rotate(45deg)

        &.v-leave-to
          transform: rotate(-45deg)
</style>
