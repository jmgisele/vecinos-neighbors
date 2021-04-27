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
          <MbInput v-if="mode === 'advanced'" v-model.lazy="newItem.label" :dark="dark" :errors="newItem.error" placeholder="New item label" />
          <MbInput v-model.lazy="newItem.value" :dark="dark" :errors="newItem.error" :placeholder="mode === 'simple' ? 'New item' : 'New item value'" @keyup.enter="addItem" />
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
  data() {
    return {
      errors: new Map(),
      mode: 'simple',
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
  props: {
    dark: Boolean,
    modelValue: [Array, Object],
  },
  watch: {
    mode(nv, ov) {
      if (nv === 'file' || ov === 'file') {
        this.$emit('update:modelValue', []);
        return;
      }
      if (nv === 'simple') this.$emit('update:modelValue', this.modelValue.map((item) => item.value));
      else if (nv === 'advanced') this.$emit('update:modelValue', this.modelValue.map((item) => ({ label: '', value: item })));
    },
  },
};
</script>

<style lang="stylus" scoped>
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
      margin-bottom: 1rem

.item
  display: flex
  align-items: center

  &.being-dragged
    opacity: 0.25

  &.advanced
    .input
      &:first-of-type
        margin-right: 0
        border-bottom-right-radius: 0
        border-top-right-radius: 0

      &:last-of-type
        border-top-left-radius: 0
        border-bottom-left-radius: 0
        margin-left: 0.0625rem

  .drag-handle
    padding: 1rem
    cursor: move

  .input
    margin-top: 0
    flex-grow: 1
    margin-right: 1rem

    &:first-child
      margin-left: 3.5rem

    &.error
      margin-top: 1.5rem
</style>
