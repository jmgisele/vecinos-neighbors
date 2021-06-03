<template lang="html">
  <section class="rows field">
    <div class="container" :class="{ dark, empty, error }">
      <p class="label">{{transformedLabel}}</p>
      <p v-show="empty" class="empty-state">This field is empty</p>
      <MbSortableList v-if="displayItems.length > 0" v-slot="{ activeItem, item, index }" enable-transitions :items="uniqueItemKeys" @itemclick="openDetails" @itemmove="handleItemMove">
        <div class="row-item" :class="{ active: active && indexBeingEdited === index, 'being-dragged': item === activeItem, compact: isCompact, dark, error: errorForIndex(index), 'in-split': inSplit }" tabindex="0" @contextmenu.prevent="openContextMenu($event, index)" @keydown.space.prevent @keyup.space.enter="openDetails(index)">
          <div class="drag-handle" data-drag-handle>
            <MbIcon icon="drag-handle" />
          </div>
          <div class="left">
            <p class="label" :class="{ unstyled: !displayItems[index].displayValue }">{{errorForIndex(index) || displayItems[index].label}}</p>
            <p v-if="displayItems[index].displayValue || errorForIndex(index)" class="content">{{displayItems[index].displayValue || displayItems[index].label}}</p>
          </div>
          <MbIcon v-if="isCompact" :icon="active && indexBeingEdited === index ? 'cross' : errorForIndex(index) ? 'error' : 'pencil'" />
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
    <MbModal class="item-details" :dark="dark" :title="fieldBeingEdited && fieldBeingEdited.label" :visible="showDetailsModal" @after-close="validateItemBeingEdited" @close="closeDetails" @keyup.ctrl.enter="closeDetails">
      <teleport v-if="!teleportTarget || active" :disabled="!teleportTarget" :to="teleportTarget">
        <h2 v-if="teleportTarget" class="h3 split-title">{{fieldBeingEdited && fieldBeingEdited.label}}</h2>
        <MbFieldsEditor
          v-if="modelValue && indexBeingEdited !== null"
          class="field-details-editor"
          :class="{ 'in-split': teleportTarget }"
          compact
          :dark="dark"
          :error="fieldBeingEditedErrors"
          :fields="fieldBeingEdited.type === 'group' ? fieldBeingEdited.value : [fieldBeingEdited]"
          :in-split="Boolean(teleportTarget)"
          :model-value="modelValue[indexBeingEdited]"
          :languages="languages"
          @update:error="handleFieldBeingEditedError"
          @update:model-value="updateFieldBeingEdited"
        />
        <MbButton v-if="options.allowEditing && teleportTarget" class="delete-button" :dark="dark" icon="trash" type="negative" @click="deleteItemBeingEdited">Delete {{options.itemLabel || 'Row'}}</MbButton>
      </teleport>
      <template #actions>
        <MbButton v-if="options.allowEditing" :dark="dark" icon="trash" type="negative" @click="deleteItemBeingEdited">Delete {{options.itemLabel || 'Row'}}</MbButton>
        <MbButton :dark="dark" type="primary" @click="closeDetails">Done</MbButton>
      </template>
    </MbModal>
    <MbContextMenu :dark="dark" :options="itemContextMenu.options" :show="itemContextMenu.show" :target="itemContextMenu.target" :x="itemContextMenu.x" :y="itemContextMenu.y" @close="resetRowContextMenu" />
  </section>
</template>

<script>
import { cloneDeep as _cloneDeep, debounce } from 'lodash-es';

import generateDefaultContentFromSchema from '../../assets/js/generateDefaultContentFromSchema';
import richToPlainText from '../../assets/js/richToPlainText';
import validateContent from '../../assets/js/validateContent';

import field from '../../mixins/field';

function pseudoId() {
  return Math.random().toString(36).substring(2, 9);
}

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
        else if (value && typeof value === 'object') {
          const firstValue = Object.values(value).find((subvalue) => subvalue);
          if (typeof firstValue === 'string') displayValue = richToPlainText(firstValue, 200);
          if (firstValue === null || typeof firstValue === 'undefined') displayValue = '';
          displayValue = firstValue;
        } else if (typeof value === 'string') displayValue = richToPlainText(value, 200); // trimming to 200 characters even though only about 70 are shown because HTML can be quite verbose
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
    fieldBeingEditedErrors() {
      if (!(this.error instanceof Map) || !this.error.get(this.indexBeingEdited)) return new Map();
      const errors = this.error.get(this.indexBeingEdited);
      if (this.fieldBeingEdited.type === 'group') return errors || new Map();
      return new Map().set(this.fieldBeingEdited.key, errors);
    },
    isCompact() {
      return this.compact && this.options.compact;
    },
    transformedLabel() {
      if (this.error instanceof Map && this.error.get(this.fieldKey)) return this.error.get(this.fieldKey);
      if (this.validation && this.validation.max) return `${this.label} (${(this.modelValue && this.modelValue.length) || 0}/${this.validation.max})`;
      return this.label;
    },
  },
  created() {
    // this is a bit of a HACK to allow unique keys for each element in modelValue, but it will break if modelValue gets changed from the outside after creation (which it shouldn’t, and if that ever changes a clever watcher could help)
    if (Array.isArray(this.modelValue)) this.uniqueItemKeys = this.modelValue.map(() => pseudoId());
  },
  data() {
    return {
      indexBeingEdited: null,
      itemContextMenu: {
        options: [
          {
            action: () => this.openDetails(this.itemContextMenu.item),
            label: 'Edit',
            icon: 'pencil',
          },
          {
            action: () => this.duplicateItem(this.itemContextMenu.item),
            label: 'Duplicate',
            icon: 'duplicate',
          },
          {
            action: () => this.deleteItem(this.itemContextMenu.item),
            label: 'Delete',
            icon: 'trash',
            type: 'negative',
          },
        ],
        item: null,
        show: false,
        target: null,
        x: 0,
        y: 0,
      },
      showAddModal: false,
      showDetailsModal: false,
      uniqueItemKeys: [],
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

      this.uniqueItemKeys.push(pseudoId());
      this.handleInput((this.modelValue || []).concat([contentItem]));
      if (this.showAddModal) this.showAddModal = false;
    },
    closeDetails() {
      if (this.splitTarget) this.$emit('update:active', false);
      else this.showDetailsModal = false;
    },
    deleteItem(index) {
      if (typeof index !== 'number') return;

      const [idBackup] = this.uniqueItemKeys.splice(index, 1);
      const backup = this.modelValue[index];

      let errorBackup;
      if (this.error instanceof Map && this.error.get(index)) {
        errorBackup = this.error.get(index);
        const newError = _cloneDeep(this.error);
        newError.delete(index);
        this.$emit('update:error', newError.size > 0 ? newError : '');
      }

      if (index === this.indexBeingEdited) {
        this.indexBeingEdited = null;
        this.closeDetails();
      }

      this.handleInput(this.modelValue.filter((item, i) => i !== index));

      this.$store.commit('addToast', {
        action: () => {
          const modelClone = [...(this.modelValue || [])];
          modelClone.splice(index, 0, backup);
          this.handleInput(modelClone);
          this.uniqueItemKeys.splice(index, 0, idBackup);
          if (errorBackup) {
            const newError = _cloneDeep(this.error) || new Map();
            newError.set(index, errorBackup);
            this.$emit('update:error', newError);
          }
        },
        actionLabel: 'Undo',
        closeOnRouteChange: true,
        message: `The ${this.options.itemLabel || 'row'} was deleted`,
        timeout: 5000 - 200,
        type: 'warning',
      });
    },
    deleteItemBeingEdited() {
      this.deleteItem(this.indexBeingEdited);
    },
    duplicateItem(index) {
      if (typeof index !== 'number') return;

      const modelClone = _cloneDeep(this.modelValue);
      const itemClone = _cloneDeep(this.modelValue[index]);
      modelClone.splice(index + 1, 0, itemClone);
      this.uniqueItemKeys.splice(index + 1, 0, pseudoId());
      this.handleInput(modelClone);
    },
    errorForIndex(index) {
      if (!(this.error instanceof Map)) return null;
      const error = this.error.get(index);
      if (error instanceof Map) {
        if (error.size === 1) return 'A subfield has errors';
        return `${error.size} subfields have errors`;
      }
      return error;
    },
    handleAddClick() {
      if (this.children.length === 1) this.addItem(this.children[0]);
      else this.showAddModal = true;
    },
    handleFieldBeingEditedError(err) {
      const newError = _cloneDeep(this.error) || new Map();
      if (err.size === 0) newError.delete(this.indexBeingEdited);
      else newError.set(this.indexBeingEdited, this.fieldBeingEdited.type === 'group' ? err : err.get(this.fieldBeingEdited.key));

      this.$emit('update:error', newError.size > 0 ? newError : '');
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
      const currentIndex = this.uniqueItemKeys.indexOf(activeItem);
      const newVal = [...this.modelValue];
      let newIndex;
      if ((currentIndex < index && isBottomHalf) || (currentIndex > index && !isBottomHalf)) newIndex = index;
      else if (currentIndex < index && !isBottomHalf) newIndex = Math.max(0, index - 1);
      else if (currentIndex > index && isBottomHalf) newIndex = Math.min(index + 1, newVal.length - 1);

      if (currentIndex === this.indexBeingEdited) this.indexBeingEdited = newIndex;
      else if (currentIndex > this.indexBeingEdited && newIndex <= this.indexBeingEdited) this.indexBeingEdited += 1;
      else if (currentIndex < this.indexBeingEdited && newIndex >= this.indexBeingEdited) this.indexBeingEdited -= 1;

      newVal.splice(newIndex, 0, newVal.splice(currentIndex, 1)[0]);
      this.uniqueItemKeys.splice(newIndex, 0, this.uniqueItemKeys.splice(currentIndex, 1)[0]);
      this.handleInput(newVal);
    },
    openContextMenu(e, index) {
      if (!this.options.editable || !this.isCompact) return;

      this.itemContextMenu.item = index;
      this.itemContextMenu.target = e.currentTarget;
      this.itemContextMenu.x = e.clientX;
      this.itemContextMenu.y = e.clientY;
      this.itemContextMenu.show = true;
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
    resetRowContextMenu() {
      this.itemContextMenu.show = false;
      this.itemContextMenu.item = null;
      this.itemContextMenu.target = null;
      this.itemContextMenu.x = 0;
      this.itemContextMenu.y = 0;
    },
    updateFieldBeingEdited: debounce(function debouncedUpdate(newVal) {
      const newModelValue = [...this.modelValue];
      newModelValue.splice(this.indexBeingEdited, 1, newVal);
      this.handleInput(newModelValue);
    }, 500),
    validateItemBeingEdited() {
      if (this.indexBeingEdited === null) return;
      const fakeFields = this.fieldBeingEdited.type === 'group' ? this.fieldBeingEdited.value : [this.fieldBeingEdited];
      const errors = validateContent(this.modelValue[this.indexBeingEdited], { fields: fakeFields }, this.languages);
      this.handleFieldBeingEditedError(errors);

      this.indexBeingEdited = null;
    },
  },
  mixins: [field],
  watch: {
    active(nv) {
      if (!nv) this.validateItemBeingEdited();
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
