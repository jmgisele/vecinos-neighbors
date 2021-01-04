<template lang="html">
  <MbPopover class="context-menu" :dark="dark" :from-right="fromRight" no-content-padding :visible="show" :x="x" :y="y" @close="close">
    <ul class="wrapper">
      <li v-for="(option, index) in options" :class="[option.type, {dark, disabled: option.disabled}]" :key="index" tabindex="0" @click="handleAction(option.action)">
        <MbIcon v-if="option.icon" :icon="option.icon" />
        <span>{{option.label}}</span>
      </li>
    </ul>
  </MbPopover>
</template>

<script>
export default {
  beforeUnmount() {
    if (this.show) window.removeEventListener('contextmenu', this.close, { capture: true });
  },
  emits: ['close'],
  methods: {
    close() {
      this.$emit('close');
      if (this.target) this.target.focus();
    },
    handleAction(action) {
      if (typeof action === 'function') action();
      this.close();
    },
  },
  props: {
    dark: Boolean,
    fromRight: Boolean,
    options: Array,
    show: Boolean,
    target: HTMLElement,
    x: Number,
    y: Number,
  },
  watch: {
    show(nv) {
      if (nv) window.addEventListener('contextmenu', this.close, { capture: true });
      else window.removeEventListener('contextmenu', this.close, { capture: true });
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.context-menu
  user-select: none

  .wrapper
    list-style: none
    padding: 0.5rem
    margin: 0

    li
      display: flex
      align-items: center
      width: 100%
      padding: 0.75rem 1rem
      cursor: pointer
      border-radius: $radius-m

      &.negative
        color: $negative-saturated

      &.positive
        color: $positive-saturated

      &.warning
        color: $warning-saturated

      &.disabled
        pointer-events: none
        color: $text-tertiary

      &.dark
        &:hover,
        &:focus
          background-color: $bg-tertiary-dark

        &.disabled
          color: $text-tertiary-dark

      &:not(:last-child)
        margin-bottom: 0.5rem

      &:hover,
      &:focus
        background-color: $bg-secondary

      .icon
        margin-right: 1rem
</style>
