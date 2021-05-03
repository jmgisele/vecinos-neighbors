<template lang="html">
  <div class="item-list">
    <MbSortableList v-slot="{ activeItem, item }" :items="modelValue" @itemmove="handleItemMove">
      <div class="item" :class="{ 'being-dragged': activeItem === item, dark }" >
        <div class="drag-handle" data-drag-handle>
          <MbIcon icon="drag-handle" />
        </div>
        <span>{{labelForItem(item)}}</span>
        <MbButton :dark="dark" icon="trash" tooltip="Delete item" type="negative" @click="deleteItem(item)" />
      </div>
    </MbSortableList>
    <div class="new-item">
      <MbSelect v-model="newItem" :dark="dark" :options="filteredOptions" :placeholder="placeholder" />
      <MbButton :dark="dark" icon="plus" tooltip="Add item" type="positive" @click="addItem" />
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    filteredOptions() {
      return this.options.filter((option) => {
        const valueToTest = option.value || option;
        return !this.modelValue.includes(valueToTest);
      });
    },
  },
  data() {
    return {
      newItem: null,
    };
  },
  methods: {
    deleteItem(item) {
      this.$emit('update:modelValue', this.modelValue.filter((existingItem) => existingItem !== item));
    },
    handleItemMove({ activeItem, index, isBottomHalf }) {
      const modelCopy = [...this.modelValue];
      const currentIndex = modelCopy.indexOf(activeItem);
      if ((currentIndex < index && isBottomHalf) || (currentIndex > index && !isBottomHalf)) {
        modelCopy.splice(index, 0, modelCopy.splice(currentIndex, 1)[0]);
      } else if (currentIndex < index && !isBottomHalf) {
        modelCopy.splice(Math.max(0, index - 1), 0, modelCopy.splice(currentIndex, 1)[0]);
      } else if (currentIndex > index && isBottomHalf) {
        modelCopy.splice(Math.min(index + 1, modelCopy.length - 1), 0, modelCopy.splice(currentIndex, 1)[0]);
      }
      this.$emit('update:modelValue', modelCopy);
    },
    labelForItem(item) {
      const optionItem = this.options.find((option) => option.value === item);
      return (optionItem && optionItem.label) || item;
    },
  },
  props: {
    dark: Boolean,
    modelValue: Array,
    options: Array,
    placeholder: String,
  },
};
</script>

<style lang="stylus" scoped>
</style>
