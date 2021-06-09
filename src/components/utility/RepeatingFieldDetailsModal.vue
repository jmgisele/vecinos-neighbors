<template lang="html">
  <MbModal class="repeating-field-details-modal" :dark="dark" :title="title" :visible="visible" @close="$emit('close')" @keyup.ctrl.enter="$emit('close')">
    <teleport v-if="!teleportTarget || active" :disabled="!teleportTarget" :to="teleportTarget">
      <h2 v-if="teleportTarget" class="h3 split-title">{{title}}</h2>
      <MbFieldsEditor
        v-if="fieldBeingEdited"
        class="field-details-editor"
        :class="{ 'in-split': teleportTarget }"
        compact
        :dark="dark"
        :error="fieldBeingEditedErrors"
        :fields="fieldBeingEdited.type === 'group' ? fieldBeingEdited.value : [fieldBeingEdited]"
        :in-split="Boolean(teleportTarget)"
        :model-value="currentValue"
        :languages="languages"
        @update:error="$emit('field-being-edited-error', $event)"
        @update:model-value="$emit('field-being-edited-update', $event)"
      />
      <footer class="field-details-actions">
        <MbButton v-if="allowEditing && teleportTarget" :dark="dark" icon="replace-round" @click="$emit('field-being-edited-change-type')">Change {{itemLabel}} type</MbButton>
        <MbButton v-if="allowEditing && teleportTarget" :dark="dark" icon="trash" type="negative" @click="$emit('delete-item-being-edited')">Delete {{itemLabel}}</MbButton>
      </footer>
    </teleport>
    <template #actions>
      <MbButton v-if="allowEditing" :dark="dark" icon="trash" type="negative" @click="$emit('delete-item-being-edited')">Delete {{itemLabel}}</MbButton>
      <MbButton :dark="dark" type="primary" @click="$emit('close')">Done</MbButton>
    </template>
  </MbModal>
</template>

<script>
export default {
  emits: ['close', 'delete-item-being-edited', 'field-being-edited-change-type', 'field-being-edited-error', 'field-being-edited-update'],
  props: {
    active: Boolean,
    allowEditing: Boolean,
    currentValue: {}, // could be anything
    dark: Boolean,
    fieldBeingEdited: Object,
    fieldBeingEditedErrors: Map,
    itemLabel: String,
    languages: Array,
    teleportTarget: [String, HTMLElement],
    title: String,
    visible: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'

.field-details-editor.in-split
  margin-bottom: 2rem

.field-details-actions
  padding-bottom: 0.125rem
  text-align: right

  .button
    &:not(:last-child)
      margin-right: 1rem

    @media $mobile
      width: 100%

      &:not(:last-child)
        margin-right: 0
        margin-bottom: 0.5rem
</style>
