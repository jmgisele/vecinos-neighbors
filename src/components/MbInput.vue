<template lang="html">
  <label class="input" :class="{ dirty: value }">
    <span v-if="label">{{label}}</span>
    <input :placeholder="!label && placeholder" :type="type" :value="value" @input="$emit('input', $event.target.value)">
  </label>
</template>

<script>
export default {
  props: {
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
  display: inline-block
  overflow: hidden

  &:focus-within,
  &.dirty
    span
      transform: none

  > span
    display: block
    cursor: text
    user-select: none
    margin-bottom: 0.5rem
    font-size: 0.75rem
    color: $text-secondary
    transform-origin: center left
    transform: translate(1rem, 2.5rem) scale(1.34)
    transition: transform 200ms ease

  > input
    font-size: inherit
    border: none
    // box-shadow: inset 0 0 0 1px darken($bg-secondary, 10)
    background-color: $bg-secondary
    border-radius: $radius-medium
    padding: 1rem
    transition: box-shadow 200ms ease
    text-overflow: ellipsis
    caret-color: $accent

    &::placeholder
      color: $text-secondary
      opacity: 1

    &:focus
      box-shadow: inset 0 0 0 2px $accent
      outline: none
</style>
