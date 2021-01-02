<template lang="html">
  <MbButton v-bind="$attrs" class="select" :class="{ placeholder: modelValue === null }" :dark="dark" :disabled="disabled" icon="chevron-down" :icon-first="false" :loading="loading" ref="button" :rounded="rounded" :tooltip="tooltip" @click="activate">
    {{currentOption}}
  </MbButton>
  <MbPopover center-x class="item-wrapper" :dark="dark" no-content-padding ref="popover" :style="{ width: `${popoverWidth}px` }" :visible="active" :x="position.x" :y="position.y" @close="deactivate">
    <template v-if="filterable" #header>
      <MbInput v-model="filter" :dark="dark" icon="search" placeholder="Filter Items" />
    </template>
    <ul class="items" :class="{ dark }">
      <li v-for="option in filteredOptions" :class="{ active: option.value ? option.value === modelValue : option === modelValue, disabled: option.disabled }" :key="option.value" :tabindex="option.disabled ? -1 : 0" @click="selectOption(typeof option.value !== 'undefined' ? option.value : option)" @keyup.enter="selectOption(option.value || option)" @keyup.space="selectOption(option.value || option)">{{option.label || option.value || option}}</li>
    </ul>
  </MbPopover>
</template>

<script>
export default {
  beforeUnmount() {
    window.removeEventListener('scroll', this.deactivate, { capture: true });
  },
  computed: {
    currentOption() {
      if (this.modelValue === null) return this.placeholder;
      const activeOption = this.options.find((option) => option.value === this.modelValue);
      if (!activeOption) return this.modelValue;
      return activeOption.label || activeOption.value;
    },
    filteredOptions() {
      if (!this.filter) return this.options;
      return this.options.filter((option) => (option.label && option.label.toLowerCase().includes(this.filter.toLowerCase())) || String(option.value).toLowerCase().includes(this.filter.toLowerCase()));
    },
  },
  data() {
    return {
      active: false,
      filter: '',
      popoverWidth: 0,
      position: {
        x: 0,
        y: 0,
      },
    };
  },
  emits: ['update:modelValue'],
  methods: {
    activate() {
      const buttonRect = this.$refs.button.$el.getBoundingClientRect();
      const remBase = Number.parseInt(window.getComputedStyle(document.documentElement).fontSize, 10);
      this.filter = '';
      this.position.x = buttonRect.left + buttonRect.width / 2;
      this.position.y = Math.round(buttonRect.top);
      this.popoverWidth = buttonRect.width + remBase;
      this.active = true;
      window.addEventListener('scroll', this.deactivate, { capture: true });
    },
    deactivate(e) {
      if (e && (e.target === this.$refs.popover.$refs.el || this.$refs.popover.$refs.el.contains(e.target))) return; // hacky but needed since it’s teleporting
      this.active = false;
      this.$refs.button.$el.focus();
      window.removeEventListener('scroll', this.deactivate, { capture: true });
    },
    selectOption(value) {
      this.$emit('update:modelValue', value);
      this.deactivate();
    },
  },
  props: {
    dark: Boolean,
    disabled: Boolean,
    filterable: Boolean,
    options: {
      type: Array,
      required: true,
    },
    loading: Boolean,
    modelValue: {},
    placeholder: {
      type: String,
      default: 'Select something…',
    },
    rounded: Boolean,
    tooltip: [String, Object],
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.select
  min-width: (192 / 16)rem

  @media $mobile
    min-width: (128 / 16)rem

  &.icon.reversed
    padding-left: 1rem

  &.placeholder
    ::v-deep(.label)
      color: $text-secondary

    &.dark
      ::v-deep(.label)
        color: $text-secondary-dark

  ::v-deep(.label)
    margin-right: auto
    width: auto

.item-wrapper
  .input
    margin: 0.5rem
    margin-bottom: 0
    width: calc(100% - 1rem)
    padding: 0.75rem

    &.dark
      background-color: $bg-tertiary-dark

  .items
    list-style: none
    user-select: none
    padding: 0.5rem
    margin: 0

    &.dark
      li
        &.disabled
          color: $text-tertiary-dark

        &:hover,
        &:focus
          background-color: $bg-tertiary-dark

          &.active
            color: $text-dark

    li
      padding: 0.75rem 1rem
      white-space: nowrap
      overflow: hidden
      text-overflow: ellipsis
      cursor: pointer
      border-radius: $radius-m
      transition: background-color 200ms ease

      &:not(:last-child)
        margin-bottom: 0.5rem

      &.active
        background-color: $accent
        color: $text-dark

      &.disabled
        pointer-events: none
        color: $text-tertiary

      &:hover,
      &:focus
        background-color: $bg-secondary

        &.active
          color: $text
          box-shadow: inset 0 0 0 (2 / 16)rem $accent
</style>
