<template lang="html">
  <button class="button" :class="[type, { dark, disabled, rounded, icon, reversed: !iconFirst, 'no-label': !label }]" :disabled="disabled" @click="handleClick" @mouseenter="showTooltip(tooltip, $event.currentTarget)" @focus="showTooltip(tooltip, $event.currentTarget)">
    <MbIcon v-if="icon" :icon="icon" />
    {{ label }}
  </button>
</template>

<script>
import { showTooltip, hideTooltip } from '@/mixins/tooltipFunctions';

export default {
  computed: {
    label() {
      return this.$slots.default && this.$slots.default[0] && this.$slots.default[0].text;
    },
  },
  methods: {
    handleClick(e) {
      this.$emit('click', e);
      hideTooltip(e);
    },
    showTooltip,
  },
  props: {
    dark: Boolean,
    disabled: Boolean,
    icon: String,
    iconFirst: {
      type: Boolean,
      default: true,
    },
    rounded: Boolean,
    tooltip: [String, Object],
    type: {
      type: String,
      validator: (v) => ['negative', 'positive', 'primary', 'warning'].includes(v),
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.button
  padding: 1rem 1.5rem
  border: 1px solid $accent
  border-radius: $radius-m
  background-color: transparent
  color: currentColor
  cursor: pointer
  user-select: none
  white-space: nowrap
  position: relative
  transition: background-color 200ms ease

  &:hover,
  &:focus
    background-color: $bg-tertiary

  &:focus::before
    opacity: 1

  &:active
    transform: translateY(2px)
    background-color: $bg-secondary

  &.dark
    &:hover,
    &:focus
      background-color: $bg-tertiary-dark

    &:active
      background-color: $bg-secondary-dark

  &.icon
    display: inline-flex
    align-items: center
    padding-right: 2.5rem
    padding-left: 1rem

    &.reversed
      flex-direction: row-reverse
      padding-right: 1rem
      padding-left: 2.5rem

      .icon
        margin-left: 1rem
        margin-right: 0

    &.no-label
      padding-right: 1rem
      padding-left: 1rem
      border: none

      .icon
        margin: -0.1875rem // needed so the buttons keep the same height even with the icon

    .icon
      margin-right: 1rem
      margin-top: -0.1875rem // needed so the buttons keep the same height even with the icon
      margin-bottom: @margin-top

  &.primary
    background-color: $accent
    color: $text-dark

    &:hover,
    &:focus
      background-color: darken($accent, 5)

    &:active
      background-color: darken($accent, 10)

    &::before
      border-color: $accent-secondary

  &.rounded
    border-radius: ((52 / 16) / 2)rem // 52 === Button.height

    &::before
      border-radius: @border-radius

  &.positive
    border-color: $positive
    color: $positive-saturated

    &:hover,
    &:focus
      background-color: alpha($positive, 0.1)

    &:active
      background-color: alpha($positive, 0.15)

    &::before
      border-color: @border-color

  &.negative
    border-color: $negative
    color: $negative-saturated

    &:hover,
    &:focus
      background-color: alpha($negative, 0.1)

    &:active
      background-color: alpha($negative, 0.15)

    &::before
      border-color: @border-color

  &.warning
    border-color: $warning-saturated

    &:hover,
    &:focus
      background-color: alpha($warning, 0.1)

    &:active
      background-color: alpha($warning, 0.15)

    &::before
      border-color: @border-color

  &.disabled
    pointer-events: none
    border: 1px dashed $text-tertiary
    color: $text-tertiary

    &.primary
      background-color: $bg-secondary

    &.dark
      border-color: $text-tertiary-dark
      color: @border-color

      &.primary
        background-color: $bg-secondary-dark

  &::before
    content: ''
    position: absolute
    top: -1px
    left: @top
    right: @top
    bottom: @top
    border: 2px solid $accent
    opacity: 0
    border-radius: @border-radius
    transition: opacity 200ms ease
</style>
