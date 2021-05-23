<template lang="html">
  <section class="rows field">
    <div class="container" :class="{ dark, empty, error }">
      <p class="label">{{transformedLabel}}</p>
      <p v-show="empty" class="empty-state">This field is empty</p>
      <MbSortableList v-if="displayItems.length > 0" v-slot="{ activeItem, item, index }" :items="modelValue" enable-transitions @itemclick="openDetails" @itemmove="handleItemMove">
        <div class="row-item" :class="{ active: active && indexBeingEdited === index, 'being-dragged': item === activeItem, compact: compact || options.compact, dark, 'in-split': inSplit }" tabindex="0" @keydown.space.prevent @keyup.space.enter="openDetails(index)">
          <div class="drag-handle" data-drag-handle>
            <MbIcon icon="drag-handle" />
          </div>
          <div class="left">
            <p class="label" :class="{ unstyled: !displayItems[index].displayValue }">{{errorForIndex(index) || displayItems[index].label}}</p>
            <p v-if="displayItems[index].displayValue || errorForIndex(index)" class="content">{{displayItems[index].displayValue || displayItems[index].label}}</p>
          </div>
          <MbIcon v-if="compact" :icon="active && indexBeingEdited === index ? 'cross' : errorForIndex(index) ? 'error' : 'pencil'" />
        </div>
      </MbSortableList>
      <MbButton v-if="options.allowEditing && children.length > 0" class="add-button" :dark="dark" icon="plus" type="positive" @click="handleAddClick">Add {{options.itemLabel || 'Row'}}</MbButton>
    </div>
    <MbModal class="add-modal" :dark="dark" slim title="Add new…" :visible="showAddModal" @close="showAddModal = false">
      <ul>
        <li v-for="child in children" :key="child.key">
          <MbButton :dark="dark" :icon="child.icon" @click="addItem(child)">{{child.label}}</MbButton>
        </li>
      </ul>
      <template #actions>
        <MbButton :dark="dark" @click="showAddModal = false">Cancel</MbButton>
      </template>
    </MbModal>
    <MbModal class="item-details" :dark="dark" :title="fieldBeingEdited && fieldBeingEdited.label" :visible="showDetailsModal" @after-close="validateContent" @close="closeDetails" @keyup.ctrl.enter="closeDetails">
      <teleport v-if="!teleportTarget || active" :disabled="!teleportTarget" :to="teleportTarget">
        <h2 v-if="teleportTarget" class="h3 split-title">{{fieldBeingEdited && fieldBeingEdited.label}}</h2>
        <MbFieldsEditor v-if="modelValue && indexBeingEdited !== null" class="field-details-editor" :class="{ 'in-split': teleportTarget }" compact :dark="dark" :error="(error instanceof Map && error.get(indexBeingEdited)) || new Map()" :fields="fieldBeingEdited.type === 'group' ? fieldBeingEdited.value : [fieldBeingEdited]" :in-split="Boolean(teleportTarget)" :model-value="modelValue[indexBeingEdited]" :languages="languages" @update:error="handleFieldBeingEditedError" @update:model-value="updateFieldBeingEdited" />
        <MbButton v-if="options.allowEditing && teleportTarget" class="delete-button" :dark="dark" icon="trash" type="negative" @click="deleteItemBeingEdited">Delete {{options.itemLabel || 'Row'}}</MbButton>
      </teleport>
      <template #actions>
        <MbButton v-if="options.allowEditing" :dark="dark" icon="trash" type="negative" @click="deleteItemBeingEdited">Delete {{options.itemLabel || 'Row'}}</MbButton>
        <MbButton :dark="dark" type="primary" @click="closeDetails">Done</MbButton>
      </template>
    </MbModal>
  </section>
</template>

<script>
import { cloneDeep as _cloneDeep, debounce } from 'lodash-es';

import generateDefaultContentFromSchema from '../../assets/js/generateDefaultContentFromSchema';
import validateContent from '../../assets/js/validateContent';

import field from '../../mixins/field';

export default {
  computed: {
    displayItems() {
      if (!this.modelValue) return [];
      return this.modelValue.map((item) => {
        const childField = this.children.find((child) => child.key === item.___mb_type) || {};
        let value;
        let displayValue;

        if (childField.displayField) value = item[childField.displayField];
        else value = item[item.___mb_type];

        if (Array.isArray(value)) displayValue = value.join(', ');
        else if (value && typeof value === 'object') displayValue = Object.values(value).find((v) => v) || '';
        else displayValue = value;

        return {
          displayValue,
          label: childField.label || 'Unknown Field',
        };
      });
    },
    empty() {
      return !this.modelValue || this.modelValue.length === 0;
    },
    fieldBeingEdited() {
      if (!this.modelValue || this.modelValue.length === 0 || this.indexBeingEdited === null) return null;
      const childField = this.children.find((child) => child.key === this.modelValue[this.indexBeingEdited].___mb_type);
      return childField;
    },
    transformedLabel() {
      if (this.error instanceof Map && this.error.get(this.fieldKey)) return this.error.get(this.fieldKey);
      if (this.validation && this.validation.max) return `${this.label} (${(this.modelValue && this.modelValue.length) || 0}/${this.validation.max})`;
      return this.label;
    },
  },
  data() {
    return {
      indexBeingEdited: null,
      showAddModal: false,
      showDetailsModal: false,
    };
  },
  methods: {
    addItem(item) {
      let contentItem;
      if (item.type !== 'group') {
        contentItem = {
          ___mb_type: item.key,
          [item.key]: item.default,
        };
      } else contentItem = { ...generateDefaultContentFromSchema({ fields: item.value }), ___mb_type: item.key };

      this.handleInput((this.modelValue || []).concat([contentItem]));
      if (this.showAddModal) this.showAddModal = false;
    },
    closeDetails() {
      if (this.splitTarget) this.$emit('update:active', false);
      else this.showDetailsModal = false;
    },
    deleteItemBeingEdited() {
      // TODO: add undo
      this.handleInput(this.modelValue.filter((item, index) => index !== this.indexBeingEdited));
      this.indexBeingEdited = null;
      this.closeDetails();
    },
    errorForIndex(index) {
      if (!(this.error instanceof Map)) return null;
      return this.error.get(index);
    },
    handleAddClick() {
      if (this.children.length === 1) this.addItem(this.children[0]);
      else this.showAddModal = true;
    },
    handleFieldBeingEditedError(err) {
      // if (!err || err.size === 0) this.$emit('update:error', '');
      // else this.$emit('update:error', err);
      console.log(err);
      // TODO: merge err with our own errors
    },
    handleInput(newVal) {
      const error = this.validate(newVal);
      const fieldError = this.error && this.error.get(this.fieldKey);

      if (error) {
        if ((fieldError && fieldError !== error) || (!fieldError && this.error)) this.$emit('update:error', _cloneDeep(this.error).set(this.fieldKey, error));
        else if (!fieldError && !this.error) this.$emit('update:error', new Map().set(this.fieldKey, error));
      } else if (fieldError && this.error) {
        const clone = _cloneDeep(this.error);
        clone.delete(this.fieldKey);
        this.$emit('update:error', clone.size > 0 ? clone : '');
      }

      this.$emit('update:modelValue', newVal);
    },
    handleItemMove({ activeItem, index, isBottomHalf }) {
      const currentIndex = this.modelValue.indexOf(activeItem);
      const newVal = [...this.modelValue];
      let newIndex;
      if ((currentIndex < index && isBottomHalf) || (currentIndex > index && !isBottomHalf)) newIndex = index;
      else if (currentIndex < index && !isBottomHalf) newIndex = Math.max(0, index - 1);
      else if (currentIndex > index && isBottomHalf) newIndex = Math.min(index + 1, newVal.length - 1);

      if (currentIndex === this.indexBeingEdited) this.indexBeingEdited = newIndex;
      else if (currentIndex > this.indexBeingEdited && newIndex <= this.indexBeingEdited) this.indexBeingEdited += 1;
      else if (currentIndex < this.indexBeingEdited && newIndex >= this.indexBeingEdited) this.indexBeingEdited -= 1;

      newVal.splice(newIndex, 0, newVal.splice(currentIndex, 1)[0]);
      this.handleInput(newVal);
    },
    openDetails(index) {
      if (this.active && index === this.indexBeingEdited) {
        this.closeDetails();
        return;
      }

      this.indexBeingEdited = index;

      if (!this.active && this.splitTarget) this.$emit('update:active', true);
      else if (!this.showDetailsModal && !this.splitTarget) this.showDetailsModal = true;
    },
    updateFieldBeingEdited: debounce(function debouncedUpdate(newVal) {
      const newModelValue = [...this.modelValue];
      newModelValue.splice(this.indexBeingEdited, 1, newVal);
      this.handleInput(newModelValue);
    }, 500),
    validateContent() {
      const errors = validateContent(
        { [this.fieldKey]: this.modelValue || [] },
        {
          fields: [ // we have to re-create an approximation of the field here since we don’t have access to the original field
            {
              key: this.fieldKey,
              value: this.children,
              type: this.type,
              validation: this.validation,
            },
          ],
        },
        this.languages,
      );
      this.$emit('update:error', errors.size > 0 ? errors : '');
      this.indexBeingEdited = null;
    },
  },
  mixins: [field],
  watch: {
    active(nv) {
      if (!nv) this.validateContent();
    },
    error(nv) {
      console.log(nv);
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/fields'

.rows.field
  .container
    &.empty
      .add-button
        margin-right: auto

    .add-button
      display: flex
      margin-left: auto

      @media $mobile
        width: 100%

.add-modal ul
  list-style: none
  margin: 0
  padding: 0

  li
    margin-bottom: 0.125rem

    &:not(:last-child)
      margin-bottom: 1rem

    .button
      width: 100%

.row-item
  margin-bottom: 1rem

  &.being-dragged
    opacity: 0.5
    transform: none !important

    &::before
      opacity: 0

  .drag-handle
    padding: 1rem
    margin: -1rem
    margin-right: -0.25rem
    cursor: move

.field-details-editor.in-split
  margin-bottom: 2rem

.delete-button
  display: flex
  margin-left: auto
  margin-bottom: 0.125rem
</style>
