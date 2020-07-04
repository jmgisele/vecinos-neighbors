<template lang="html">
  <label class="input" :class="{ dark, disabled, dirty: error || value || placeholder, error, icon }">
    <MbIcon v-if="icon" :icon="error ? 'error' : icon" />
    <span v-if="error || label">{{error || label}}</span>
    <input :placeholder="placeholder" :type="type" :value="value" @blur="$emit('blur')" @focus="$emit('focus')" @input="$emit('input', $event.target.value)">
  </label>
</template>

<script>
export default {
  props: {
    dark: Boolean,
    disabled: Boolean,
    error: String,
    icon: String,
    label: String,
    placeholder: String,
    type: {
      type: String,
      default: 'text',
    },
    value: [Number, String],
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.input
  display: inline-flex
  vertical-align: middle
  align-items: center
  background-color: $bg-secondary
  border-radius: $radius-m
  padding: 1rem
  position: relative
  width: 16rem
  cursor: text
  margin-top: 1.5rem
  border: 1px solid transparent
  transition: box-shadow 200ms ease

  &.dark
    background-color: $bg-secondary-dark

    > span
      color: $text-secondary-dark

    > input
      &::placeholder
        color: $text-secondary-dark

  &.icon
    > span
      left: 3rem
      width: calc(100% - 4rem)

  &.error
    color: $negative-saturated
    box-shadow: inset 0 0 0 2px $negative

    &:focus-within
      color: inherit

    > span
      color: $negative-saturated

  &.disabled
    pointer-events: none
    background-color: transparent
    border-style: dashed
    border-color: $text-tertiary
    color: $text-tertiary
    box-shadow: none

    &.dark
      border-color: $text-tertiary-dark
      color: $text-tertiary-dark

    > span
      color: inherit

    > input::placeholder
      color: inherit

  &:focus-within
    box-shadow: inset 0 0 0 2px $accent

  &:focus-within,
  &.dirty
    span
      transform: translate((-1rem + $radius-m), calc(-100% - 1.25rem)) scale(0.75)
      width: calc(100% - (2 * $radius-m))

    &.icon > span
      width: calc(100% - 0.75rem)
      transform: translate((-3rem + $radius-m), calc(-100% - 1.25rem)) scale(0.75)

  > .icon
    margin-right: 0.5rem
    flex-shrink: 0

  > span
    flex-shrink: 0
    display: block
    cursor: text
    user-select: none
    color: $text-secondary
    transform-origin: bottom left
    position: absolute
    white-space: nowrap
    width: calc(100% - 1rem)
    overflow: hidden
    text-overflow: ellipsis
    transition: transform 200ms ease

  > input
    width: 100%
    font-size: inherit
    color: inherit
    border: none
    background-color: transparent
    padding: 0
    height: 1.5rem
    text-overflow: ellipsis
    caret-color: $accent

    &::placeholder
      color: $text-secondary
      opacity: 1
</style>
