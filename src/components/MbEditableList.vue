<template lang="html">
  <div class="editable-list">
    <MbSegmentedSelector v-model="mode" :dark="dark" :options="[{ label: 'Simple', value: 'simple' }, { label: 'Labelled', value: 'advanced' }, { label: 'From File', value: 'file' }]" />
    <transition mode="out-in">
      <div v-if="mode !== 'file'" class="mode" :key="mode">
        <MbSortableList v-slot="{ activeItem, item, index }" :items="itemsWithoutSoftDeleted" key-name="value" @itemmove="handleItemMove">
          <div class="item" :class="[mode, { 'being-dragged': activeItem === item, dark, error: errors.get(item) }]" :data-error="errors.get(item)">
            <div class="drag-handle" data-drag-handle>
              <MbIcon icon="drag-handle" />
            </div>
            <MbInput v-if="mode === 'advanced'" :dark="dark" :model-modifiers="{ lazy: true }" :model-value="item.label" placeholder="Label" @update:model-value="handleItemUpdate($event, index, 'label')" />
            <MbInput :dark="dark" :model-modifiers="{ lazy: true }" :model-value="item.value" placeholder="Value" @update:model-value="handleItemUpdate($event, index, 'value')" />
            <MbButton :dark="dark" icon="trash" type="negative" @click="deleteItem(item)" />
          </div>
        </MbSortableList>
        <div class="item" :class="[mode, { dark, error: newItem.error }]" :data-error="newItem.error">
          <div class="item-icon">
            <MbIcon :icon="newItem.error ? 'error' : 'document-add'" />
          </div>
          <MbInput v-if="mode === 'advanced'" v-model.lazy="newItem.label" :dark="dark" placeholder="Label" ref="labelInput" />
          <MbInput v-model.lazy="newItem.value" :dark="dark" :placeholder="mode === 'simple' ? 'New item' : 'Value'" @keyup.enter="addItem" />
          <MbButton :dark="dark" :disabled="newItem.error" icon="plus" type="positive" @click="addItem" />
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
    itemsWithoutSoftDeleted() {
      return this.model.items.filter((item) => !this.softDeleted.has(item));
    },
  },
  created() {
    if (Array.isArray(this.modelValue)) {
      if (typeof this.modelValue[0] === 'object') this.mode = 'advanced';
      else this.mode = 'simple';
    } else this.mode = 'file';

    if (this.mode === 'file') this.model = { items: [], file: this.modelValue };
    else if (this.mode === 'simple') this.model = { items: this.modelValue.map((item) => ({ label: '', value: item })), file: {} };
    else this.model = { items: this.modelValue, file: {} };
  },
  data() {
    return {
      errors: new Map(),
      internalChange: false,
      mode: null,
      model: null,
      newItem: {
        error: 'Cheese',
        label: '',
        value: '',
      },
      softDeleted: new Set(),
    };
  },
  emits: ['update:modelValue'],
  methods: {
    addItem() {
      if (this.mode === 'simple') this.model.items.push({ label: '', value: this.newItem.value });
      else if (this.mode === 'advanced') this.model.items.push({ label: this.newItem.label, value: this.newItem.value });
      this.updateModelValue();
      this.newItem.label = '';
      this.newItem.value = '';
      if (this.mode === 'advanced') this.$refs.labelInput.focus();
    },
    deleteItem(item) {
      const timeout = 5000;
      const timeoutId = window.setTimeout(() => {
        window.clearTimeout(timeoutId);
        this.model.items = this.model.items.filter((existingItem) => existingItem !== item);
        this.updateModelValue();
      }, timeout);

      this.softDeleted.add(item);
      this.$store.commit('addToast', {
        action: () => {
          window.clearTimeout(timeoutId);
          this.softDeleted.delete(item);
        },
        actionLabel: 'Undo',
        message: `“${item.label || item}” was deleted`,
        timeout: timeout - 200,
        type: 'warning',
      });
    },
    handleItemMove({ activeItem, index, isBottomHalf }) {
      const currentIndex = this.model.items.indexOf(activeItem);
      if ((currentIndex < index && isBottomHalf) || (currentIndex > index && !isBottomHalf)) {
        this.model.items.splice(index, 0, this.model.items.splice(currentIndex, 1)[0]);
      } else if (currentIndex < index && !isBottomHalf) {
        this.model.items.splice(Math.max(0, index - 1), 0, this.model.items.splice(currentIndex, 1)[0]);
      } else if (currentIndex > index && isBottomHalf) {
        this.model.items.splice(Math.min(index + 1, this.model.items.length - 1), 0, this.model.items.splice(currentIndex, 1)[0]);
      }
      this.updateModelValue();
    },
    handleItemUpdate(newVal, index, type) {
      this.model.items[index][type] = newVal;
      this.updateModelValue();
    },
    updateModelValue() {
      this.internalChange = true;
      if (this.mode === 'file') this.$emit('update:modelValue', this.model.file);
      else if (this.mode === 'simple') this.$emit('update:modelValue', this.model.items.map((item) => item.value));
      else this.$emit('update:modelValue', this.model.items);
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

      this.updateModelValue();
    },
    modelValue(nv) {
      if (this.internalChange) {
        this.internalChange = false;
        return;
      }

      if (this.mode === 'file') this.model.file = nv;
      else if (this.mode === 'simple') this.model.items = nv.map((value) => ({ label: '', value }));
      else this.model.items = nv;
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

    .sortable-list
      position: relative

      &::v-deep(.drag-item)
        margin-bottom: 0.5rem

        &.v-enter-active,
        &.v-leave-active
          transition: opacity 500ms ease // needs to be higher for the initial enter to look good

          &.v-enter-from,
          &.v-leave-to
            opacity: 0

        &.v-leave-active
          position: absolute
          width: 100%

.item
  display: flex
  align-items: center
  background-color: $bg-secondary
  border-radius: $radius-m
  padding-right: 0.25rem
  position: relative
  transition: box-shadow 200ms ease, color 200ms ease

  &.dark
    background-color: $bg-secondary-dark

    .input
      border-color: $bg-dark

  &.being-dragged
    opacity: 0.25

  &.advanced
    .input
      &:first-of-type
        margin-right: 0
        border-right: none

  &.error
    margin-top: 1.5rem

    &:not(:focus-within)
      box-shadow: 0 0 0 0.125rem $negative
      color: $negative-saturated

  &::before
    content: attr(data-error)
    color: $negative-saturated
    position: absolute
    top: -1.5rem
    left: $radius-m
    font-size: 0.875rem

  .drag-handle,
  .item-icon
    padding: 1rem

  .drag-handle
    cursor: move

  .input
    margin-top: 0
    flex-grow: 1
    border-radius: 0
    margin-right: 0.25rem
    border-left: 0.0625rem solid $bg
    border-right: @border-left
    border-top: none
    border-bottom: none

    &:focus-within
      border-radius: $radius-m

    &:first-child
      margin-left: 3.5rem

  .button
    flex-shrink: 0
</style>
