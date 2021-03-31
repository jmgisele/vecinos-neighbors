<template lang="html">
  <div class="file-picker" :class="{ dark }" tabindex="0" @click="activate" @keydown.space.prevent @keyup.space.enter="activate">
    <MbIcon :icon="mode === 'folder' ? 'folder' : 'document'" />
    <span class="label" :class="{ placeholder: !modelValue }">{{label}}</span>
    <MbButton v-if="removable" v-show="modelValue" :dark="dark" icon="cross" ref="removeButton" rounded tooltip="Clear path" @click="$emit('update:modelValue', null)" />
  </div>
</template>

<script>
export default {
  computed: {
    label() {
      if (this.modelValue) return this.modelValue;
      if (this.placeholder) return this.placeholder;
      return `Pick a ${this.mode}…`;
    },
  },
  data() {
    return {
    };
  },
  emits: ['update:modelValue'],
  methods: {
    activate(e) {
      if (this.removable && (e.target === this.$refs.removeButton.$el || this.$refs.removeButton.$el.contains(e.target))) return;
      this.showPicker = true;
    },
  },
  props: {
    dark: Boolean,
    mode: {
      type: String,
      default: 'folder',
      validator: (v) => ['file', 'folder'].includes(v),
    },
    modelValue: String,
    placeholder: String,
    removable: Boolean,
    root: {
      type: String,
      default: '/',
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.file-picker
  position: relative
  border: none
  background-color: $bg-secondary
  color: inherit
  border-radius: $radius-m
  padding: 1rem
  padding-right: 1.5rem
  display: inline-flex
  align-items: center
  cursor: pointer
  transition: background-color 200ms ease
  user-select: none
  text-align: left
  white-space: nowrap
  max-width: 100%

  &:hover
    background-color: $bg-tertiary

  &:focus
    background-color: $bg-secondary

    &::before
      opacity: 1

  &:active
    transform: translateY(2px)

  &.dark
    background-color: $bg-secondary-dark

    &:hover
      background-color: $bg-tertiary-dark

    &:focus
      background-color: $bg-secondary-dark

    .label.placeholder
      color: $text-secondary-dark

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

  .label
    margin-left: 0.75rem
    overflow: hidden
    text-overflow: ellipsis

    &.placeholder
      color: $text-secondary

  .icon
    flex-shrink: 0

  .button.icon
    margin: -0.5rem
    margin-left: 0.5rem
    margin-right: -1rem
    padding: (8.5 / 16)rem
</style>
