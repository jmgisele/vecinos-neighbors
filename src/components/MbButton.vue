<template lang="html">
  <button class="button" :class="[type, { dark, rounded }]" @click="$emit('click', $event)">{{ $slots.default[0].text }}</button>
</template>

<script>
export default {
  props: {
    dark: Boolean,
    rounded: Boolean,
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

    &::before
      border-color: @border-color

  &.negative
    border-color: $negative
    color: $negative-saturated

    &::before
      border-color: @border-color

  &.warning
    border-color: $warning-saturated

    &::before
      border-color: @border-color

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
