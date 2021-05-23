<template lang="html">
  <section class="rows field">
    <div class="container" :class="{ dark, empty, error }">
      <p class="label">{{transformedLabel}}</p>
      <p v-show="empty" class="empty-state">This field is empty</p>
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
  </section>
</template>

<script>
import { cloneDeep as _cloneDeep } from 'lodash-es';

import generateDefaultContentFromSchema from '../../assets/js/generateDefaultContentFromSchema';

import field from '../../mixins/field';

export default {
  computed: {
    empty() {
      return !this.modelValue || this.modelValue.length === 0;
    },
    transformedLabel() {
      if (this.error instanceof Map && this.error.get(this.fieldKey)) return this.error.get(this.fieldKey);
      if (this.validation && this.validation.max) return `${this.label} (${(this.modelValue && this.modelValue.length) || 0}/${this.validation.max})`;
      return this.label;
    },
  },
  data() {
    return {
      showAddModal: false,
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
      } else contentItem = { ...generateDefaultContentFromSchema({ fields: item.fields }), ___mb_type: item.key };

      this.handleInput((this.modelValue || []).concat([contentItem]));
      if (this.showAddModal) this.showAddModal = false;
    },
    handleAddClick() {
      if (this.children.length === 1) this.addItem(this.children[0]);
      else this.showAddModal = true;
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
  },
  mixins: [field],
  watch: {
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
    &:not(:last-child)
      margin-bottom: 1rem

    .button
      width: 100%
</style>
