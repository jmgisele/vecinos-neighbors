<template lang="html">
  <MbModal class="repeating-field-change-type-modal" :dark="dark" :title="`Change ${itemLabel} Type`" :visible="visible" @close="$emit('close')">
    <template v-if="currentValue">
      <h2 class="h4">Existing Values</h2>
      <ul class="existing-values">
        <li v-for="(value, key) in currentValue" :key="key">
          <code>{{key}}:</code>
          <span>{{value}}</span>
        </li>
      </ul>
    </template>
    <h2 class="h4">Available Types</h2>
    <ul>
      <li v-for="field in fields" :key="field.key">
        <MbButton :dark="dark" :icon="field.icon" :type="currentLabel === field.label ? 'primary' : null" @click="$emit('change-item-type', field)">{{field.label}}</MbButton>
      </li>
    </ul>
    <template #actions>
      <MbButton :dark="dark" @click="$emit('close')">Cancel</MbButton>
    </template>
  </MbModal>
</template>

<script>
export default {
  emits: ['change-item-type', 'close'],
  props: {
    currentLabel: String,
    currentValue: {}, // could be anything
    dark: Boolean,
    fields: Array,
    itemLabel: String,
    visible: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'

.repeating-field-change-type-modal
  .existing-values
    li
      display: flex
      align-items: center
      overflow: hidden
      white-space: nowrap

      span
        overflow: hidden
        text-overflow: ellipsis

      code
        margin-right: 0.5rem

  ul
    list-style: none
    margin: 0
    padding: 0
    display: grid
    grid-template-columns: repeat(2, 1fr)
    grid-gap: 1rem

    @media $mobile
      grid-template-columns: 1fr

    &:last-child
      margin-bottom: 0.125rem

    li
      .button
        width: 100%
</style>
