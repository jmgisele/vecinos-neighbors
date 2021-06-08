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
      <MbButton v-if="allowEditing && teleportTarget" class="delete-button" :dark="dark" icon="trash" type="negative" @click="$emit('delete-item-being-edited')">Delete {{itemLabel}}</MbButton>
    </teleport>
    <template #actions>
      <MbButton v-if="allowEditing" :dark="dark" icon="trash" type="negative" @click="$emit('delete-item-being-edited')">Delete {{itemLabel}}</MbButton>
      <MbButton :dark="dark" type="primary" @click="$emit('close')">Done</MbButton>
    </template>
  </MbModal>
</template>

<script>
export default {
  emits: ['close', 'delete-item-being-edited', 'field-being-edited-error', 'field-being-edited-update'],
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
.field-details-editor.in-split
  margin-bottom: 2rem

.delete-button
  display: flex
  margin-left: auto
  margin-bottom: 0.125rem
</style>
