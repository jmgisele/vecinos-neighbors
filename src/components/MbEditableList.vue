<template lang="html">
  <div class="editable-list">
    <MbSegmentedSelector v-model="mode" :dark="dark" :options="[{ label: 'Simple Options', value: 'simple' }, { label: 'Labelled Options', value: 'advanced' }, { label: 'From File', value: 'file' }]" />
    <transition mode="out-in">
      <div v-if="mode !== 'file'" class="mode" :key="mode">
        <MbSortableList v-slot="{ activeItem, item, index }" :items="modelValue" key-name="value" @itemmove="handleItemMove">
          <div class="item" :class="[mode, { 'being-dragged': activeItem === item }]">
            <div class="drag-handle" data-drag-handle>
              <MbIcon icon="drag-handle" />
            </div>
            <MbInput :dark="dark" :errors="errors.item" :model-modifiers="{ lazy: true }" :model-value="mode === 'simple' ? item : item.label" placeholder="Label" @update:model-value="handleItemUpdate($event, item, index, 'label')" />
            <MbInput v-if="mode === 'advanced'" :dark="dark" :errors="errors.get(item)" :model-modifiers="{ lazy: true }" :model-value="item.value" placeholder="Value" @update:model-value="handleItemUpdate($event, item, index, 'value')" />
            <MbButton :dark="dark" icon="trash" type="negative" @click="deleteItem(item)" />
          </div>
        </MbSortableList>
        <div class="item" :class="[mode]">
          <div class="item-icon">
            <MbIcon icon="document-add" />
          </div>
          <MbInput v-if="mode === 'advanced'" v-model.lazy="newItem.label" :dark="dark" :errors="newItem.error" placeholder="Label" />
          <MbInput v-model.lazy="newItem.value" :dark="dark" :errors="newItem.error" :placeholder="mode === 'simple' ? 'New item' : 'Value'" @keyup.enter="addItem" />
          <MbButton :dark="dark" icon="plus" type="positive" @click="addItem" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  computed: {
    isMobile() {
      return this.$store.state.application.mobile;
    },
  },
  created() {
    if (Array.isArray(this.modelValue)) {
      if (typeof this.modelValue[0] === 'object') this.mode = 'advanced';
      else this.mode = 'simple';
    } else this.mode = 'file';

    this.backups[this.mode] = this.modelValue;
  },
  data() {
    return {
      backups: {
        simple: null,
        advanced: null,
        file: null,
      },
      errors: new Map(),
      mode: null,
      newItem: {
        error: '',
        label: '',
        value: '',
      },
    };
  },
  emits: ['update:modelValue'],
  methods: {
    addItem() {
      if (this.mode === 'simple') this.$emit('update:modelValue', [...this.modelValue, this.newItem.value]);
      else if (this.mode === 'advanced') this.$emit('update:modelValue', [...this.modelValue, { label: this.newItem.label, value: this.newItem.value }]);
      this.newItem.label = '';
      this.newItem.value = '';
    },
    deleteItem(item) {
      console.log('delete', item);
    },
    handleItemMove({ activeItem, index, isBottomHalf }) {
      console.log(activeItem, index, isBottomHalf);
    },
    handleItemUpdate(newVal, item, index) {
      console.log(newVal, item, index);
    },
  },
  mounted() {
    this.initialised = true;
  },
  props: {
    dark: Boolean,
    modelValue: [Array, Object],
  },
  watch: {
    mode(nv, ov) {
      if (!ov) return; // initial change
      if (ov === 'file') this.$emit('update:modelValue', []);
      else if (nv === 'file') this.$emit('update:modelValue', { path: null, key: '' });
      else if (nv === 'simple') this.$emit('update:modelValue', this.modelValue.map((item) => item.value));
      else if (nv === 'advanced') this.$emit('update:modelValue', this.modelValue.map((item) => ({ label: '', value: item })));
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.editable-list
  .segmented-selector
    margin-bottom: 1rem

  .mode
    &.v-enter-active,
    &.v-leave-active
      transition: opacity 200ms ease

      &.v-enter-from,
      &.v-leave-to
        opacity: 0

    .sortable-list::v-deep(.drag-item)
      margin-bottom: 0.5rem

.item
  display: flex
  align-items: center
  background-color: $bg-secondary
  border-radius: $radius-m
  padding-right: 0.25rem

  &.being-dragged
    opacity: 0.25

  &.advanced
    .input
      &:first-of-type
        margin-right: 0
        border-right: none

  .drag-handle,
  .item-icon
    padding: 1rem

  .drag-handle
    cursor: move

  .input
    margin-top: 0
    flex-grow: 1
    margin-right: 0.25rem
    border-left: 0.0625rem solid $bg
    border-right: @border-left

    &:first-child
      margin-left: 3.5rem

    &.error
      margin-top: 1.5rem

  .button
    flex-shrink: 0
</style>
