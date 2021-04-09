<template lang="html">
  <label class="input" :class="{ dark, disabled, dirty: error || modelValue || placeholder, error: error || maxLen && modelValue.length > maxLen, icon }">
    <MbIcon v-if="icon" :icon="error && !focussed ? 'error' : icon" />
    <span v-if="displayLabel" :class="{ right: !label && maxLen }">{{displayLabel}}</span>
    <input autocomplete="off" :disabled="disabled" :placeholder="placeholder" ref="input" :type="type" :value="modelValue" @blur="handleBlur" @focus="handleFocus" @input="$emit('update:modelValue', $event.target.value)">
  </label>
</template>

<script>
export default {
  computed: {
    displayLabel() {
      if (this.error) return this.error;
      if (this.maxLen && this.type !== 'number' && (this.error || this.modelValue || this.placeholder)) {
        if (this.label) return `${this.label} (${this.modelValue.length}/${this.maxLen})`;
        return `(${this.modelValue.length}/${this.maxLen})`;
      }
      if (this.label) return this.label;
      return false;
    },
  },
  data() {
    return {
      focussed: false,
    };
  },
  emits: ['blur', 'focus', 'update:modelValue'],
  methods: {
    focus() {
      this.$refs.input.focus();
    },
    handleBlur() {
      this.focussed = false;
      this.$emit('blur');
    },
    handleFocus() {
      this.focussed = true;
      this.$emit('focus');
    },
  },
  mounted() {
    if (this.autofocus) this.$refs.input.focus();
  },
  props: {
    autofocus: Boolean,
    dark: Boolean,
    disabled: Boolean,
    error: String,
    icon: String,
    label: String,
    maxLen: Number,
    placeholder: String,
    type: {
      type: String,
      default: 'text',
    },
    modelValue: [Number, String],
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
  max-width: 100%
  cursor: text
  margin-top: 1.5rem
  border: 0.0625rem solid transparent // exists for the disabled fields
  transition: box-shadow 200ms ease

  &.dark
    background-color: $bg-secondary-dark

    > span
      color: $text-secondary-dark

    > input
      caret-color: currentColor
      &::placeholder
        color: $text-secondary-dark

  &.icon
    > span
      left: 3rem
      width: calc(100% - 4rem)

    > input
      width: calc(100% - 2rem) // firefox doesn’t shrink input fields apparently

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
      width: 'calc(125% + 1rem - %s)' % (2 * $radius-m) // it’s scaled down by 0.75 and we can’t use stylus expressions in calc

    &.icon > span
      width: 'calc(125% + 1rem - %s)' % (2 * $radius-m)
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
    width: calc(100% - 2rem)
    overflow: hidden
    text-overflow: ellipsis
    transition: transform 200ms ease
    pointer-events: none

    &.right
      text-align: right

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
    -moz-appearance: textfield

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button,
    &::-webkit-clear-button,
    &::-webkit-search-decoration,
    &::-webkit-search-cancel-button,
    &::-webkit-search-results-button,
    &::-webkit-search-results-decoration
      -webkit-appearance: none
      margin: 0

    &::placeholder
      color: $text-secondary
      opacity: 1
      user-select: none
</style>
