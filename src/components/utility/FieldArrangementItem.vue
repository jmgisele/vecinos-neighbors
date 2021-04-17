<template lang="html">
  <div class="field-arrangement-item" :class="{ dark, 'drag-active': $store.state.application.dragActive }">
    <MbIcon class="drag-handle" icon="drag-handle" />
    <div class="field-icon">
      <MbIcon :icon="icon" />
    </div>
    <span class="label"><strong>{{label}}</strong></span>
    <span v-if="localised" class="chip">Localised</span>
    <span v-if="required" class="chip">Required</span>
    <span class="type">{{type}} field</span>
    <MbIcon v-if="hidden" class="hidden" icon="hide" />
    <MbIcon class="action" :icon="active ? 'cross' : 'pencil'" />
  </div>
</template>

<script>
export default {
  data() {
    return {
    };
  },
  emits: ['visibility-change'],
  props: {
    active: Boolean,
    dark: Boolean,
    fieldKey: String,
    hidden: Boolean,
    icon: {
      type: String,
      default: 'mattrbld',
    },
    label: {
      type: String,
      default: 'Unlabled field',
    },
    localised: Boolean,
    parentKey: String,
    required: Boolean,
    type: {
      type: String,
      default: 'Unknown',
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.field-arrangement-item
  display: flex
  align-items: center
  padding: 1rem
  background-color: $bg-secondary
  border-radius: $radius-l
  cursor: pointer
  transition: background-color 200ms ease

  &:hover
    background-color: $bg

  &.drag-active
    > *
      pointer-events: none

  &.dark
    background-color: $bg-secondary-dark

    &:hover
      background-color: $bg-tertiary-dark

    span
      &.chip
        background-color: $bg-dark

      &.type
        color: $text-secondary-dark

    .hidden
      color: $text-tertiary-dark

  .drag-handle
    margin-right: 1rem
    cursor: move
    flex-shrink: 0

  .field-icon
    padding: 0.5rem
    background-color: $accent
    color: $text-dark
    border-radius: $radius-m
    margin-right: 1rem

    .icon
      display: block

  span
    white-space: nowrap
    overflow: hidden
    text-overflow: ellipsis

    &.label
      margin-right: 1rem

      @media $tablet
        margin-right: auto

    &.chip
      padding: (4 / 16)rem (12 / 16)rem
      background-color: $bg
      margin-right: 0.5rem
      border-radius: 1rem

      @media $tablet
        display: none

    &.type
      text-transform: capitalize
      margin-left: auto
      margin-right: 0.5rem
      color: $text-secondary

      @media $tablet
        display: none

  .hidden
    flex-shrink: 0
    color: $text-tertiary
    margin: 0 0.5rem

  .action
    margin: 0 0.5rem
    flex-shrink: 0

    @media $mobile
      display: none
</style>
