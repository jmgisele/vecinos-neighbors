<template lang="html">
  <MbModal class="add-repeating-field-modal" :dark="dark" title="Add new…" :visible="visible" @close="$emit('close')">
    <ul>
      <li v-for="field in fields" :key="field.key">
        <MbButton :dark="dark" :icon="field.icon" @click="$emit('add-item', field)">{{field.label}}</MbButton>
      </li>
    </ul>
    <template #actions>
      <MbButton :dark="dark" @click="$emit('close')">Cancel</MbButton>
    </template>
  </MbModal>
</template>

<script>
export default {
  emits: ['add-item', 'close'],
  props: {
    dark: Boolean,
    fields: Array,
    visible: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'

.add-repeating-field-modal
  ul
    list-style: none
    margin: 0
    padding: 0
    display: grid
    grid-template-columns: repeat(2, 1fr)
    grid-gap: 1rem

    @media $mobile
      display: block

    &:last-child
      margin-bottom: 0.125rem

    li
      .button
        width: 100%
</style>
