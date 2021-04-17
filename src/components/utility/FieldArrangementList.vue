<template lang="html">
  <transition-group class="field-arrangement-list" :class="{ dark }" tag="div">
    <div v-if="fields.length === 0" class="empty-state" :class="{ 'drag-active': $store.state.application.dragActive }"  :data-parent="parentKey" data-index="0">
      <p>Drop a field here to add it</p>
    </div>
  </transition-group>
</template>

<script>
export default {
  data() {
    return {
    };
  },
  props: {
    dark: Boolean,
    fields: Array,
    parentKey: String,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.field-arrangement-list
  &.dark
    .empty-state
      border-color: $text-tertiary-dark
      color: $text-secondary-dark

      &::before
        background-color: $bg-tertiary-dark
        border-color: $accent-secondary

  .empty-state
    padding: 1.5rem
    border: 0.125rem dashed $text-tertiary
    border-radius: $radius-l
    position: relative
    text-align: center
    color: $text-secondary

    &.drag-active
      > *
        pointer-events: none

      &:hover::before
        opacity: 1

    &::before
      content: ''
      display: block
      position: absolute
      border: inherit
      border-color: $accent
      border-radius: inherit
      top: -0.125rem
      left: @top
      width: 100%
      height: 100%
      opacity: 0
      pointer-events: none
      background-color: $accent-secondary
      transition: opacity 200ms ease

    p
      margin: 0
</style>
