<template lang="html">
  <transition-group class="field-arrangement-list" :class="{ dark }" tag="div">
    <div v-if="fields.length === 0" class="empty-state" :class="{ 'drag-active': $store.state.application.dragActive }" data-index="0" :data-parent="parentKey" key="emptyState">
      <p>Drop a field here to add it</p>
    </div>
    <template v-for="(field, index) in fields">
      <div v-if="field.key === '___addIndicator'" class="add-indicator" data-add-indicator :key="field.key">
        <div />
      </div>
      <FieldArrangementItem
        v-else
        :active="fieldBeingEdited === field"
        :dark="dark"
        :data-index="index"
        :data-parent="parentKey"
        :fieldKey="field.key"
        :hidden="field.visibility && field.visibility.hidden"
        :icon="field.icon"
        :key="field.key"
        :label="field.label"
        :localised="field.localised"
        :parent-key="parentKey"
        :required="field.validation && field.validation.required"
        :type="field.type"
      />
    </template>
  </transition-group>
</template>

<script>
import FieldArrangementItem from './FieldArrangementItem.vue';

export default {
  components: {
    FieldArrangementItem,
  },
  data() {
    return {
    };
  },
  name: 'FieldArrangementList', // since technically it’s recursively calling itself (FieldArrangementItems might have a list)
  props: {
    dark: Boolean,
    fieldBeingEdited: Object,
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

  .add-indicator
    padding: 1rem

    > div
      height: 0.25rem
      background-color: $accent
      border-radius: (@height / 2)
      pointer-events: none

  .field-arrangement-item
    &:not(:last-child)
      margin-bottom: 1rem

      & + .add-indicator
        margin-top: -1rem
</style>
