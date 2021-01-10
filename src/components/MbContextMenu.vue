<template lang="html">
  <MbPopover class="context-menu" :dark="dark" :from-right="fromRight" no-content-padding :visible="show" :x="x" :y="y" @close="close">
    <ul class="wrapper">
      <li v-for="(option, index) in options" :class="[option.type, {dark, disabled: option.disabled}]" :key="index" tabindex="0" @click="handleAction(option.action)">
        <MbIcon v-if="option.icon" :icon="option.icon" />
        <span :class="{ hinted: option.shortcut }">{{option.label}}</span>
        <span v-if="option.shortcut" class="hint"><span v-for="(key, index) in option.shortcut" :key="index"><kbd>{{key}}</kbd>{{index < option.shortcut.length - 1 ? '+' : ''}}</span></span><!-- eslint-disable-line -->
      </li>
    </ul>
  </MbPopover>
</template>

<script>
export default {
  beforeUnmount() {
    if (this.show) {
      window.removeEventListener('contextmenu', this.close);
      window.removeEventListener('scroll', this.close);
    }
  },
  emits: ['close'],
  methods: {
    close(e) {
      if (e) e.preventDefault();
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
      if (nv) {
        window.setTimeout(() => { // so it doesn’t immediately close again
          window.addEventListener('contextmenu', this.close);
          window.addEventListener('scroll', this.close);
        }, 0);
      } else {
        window.removeEventListener('contextmenu', this.close);
        window.removeEventListener('scroll', this.close);
      }
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.context-menu
  .wrapper
    list-style: none
    padding: 0.5rem
    margin: 0
    user-select: none

    li
      display: flex
      align-items: center
      width: 100%
      padding: 0.75rem 1rem
      cursor: pointer
      border-radius: $radius-m
      white-space: nowrap

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
        flex-shrink: 0

      span
        max-width: 100%
        overflow: hidden
        text-overflow: ellipsis

        &.hinted
          margin-right: 1rem

        &.hint
          margin-left: auto
</style>
