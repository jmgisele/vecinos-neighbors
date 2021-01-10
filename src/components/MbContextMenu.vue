<template lang="html">
  <MbPopover class="context-menu" :dark="dark" :from-right="fromRight" no-content-padding :visible="show" :x="x" :y="y" @close="close" @keyup.arrow-down="focus(1)" @keyup.arrow-up="focus(-1)">
    <ul class="wrapper" ref="list" tabindex="-1">
      <li v-for="(option, index) in options" :class="[option.type, {dark, disabled: option.disabled, icon: withIcons && !option.icon}]" :key="index" :tabindex="option.disabled ? -1 : 0" @click="handleAction(option.action)" @keyup.space.enter="handleAction(option.action)" @mouseenter="handleMouseenter($event, index)" @mouseleave="handleMouseleave">
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
  computed: {
    withIcons() {
      return this.options.some((option) => option.icon);
    },
  },
  data() {
    return {
      currentlySelected: -1,
    };
  },
  emits: ['close'],
  methods: {
    close(e) {
      if (e) e.preventDefault();
      this.$emit('close');
      if (this.target) this.target.focus();
    },
    focus(direction) {
      const elements = this.$refs.list.querySelectorAll('li:not(.disabled)');
      if (elements.length === 0) return;

      if (direction < 0) { // focus previous
        if (this.currentlySelected > 0) this.currentlySelected -= 1;
        else this.currentlySelected = elements.length - 1;
      } else { // focus next
        // eslint-disable-next-line no-lonely-if
        if (this.currentlySelected < elements.length - 1) this.currentlySelected += 1;
        else this.currentlySelected = 0;
      }

      elements[this.currentlySelected].focus();
    },
    handleAction(action) {
      if (typeof action === 'function') action();
      this.close();
    },
    handleMouseenter(e, index) {
      if (this.show) {
        e.currentTarget.focus();
        this.currentlySelected = index;
      }
    },
    handleMouseleave(e) {
      if (this.show && document.activeElement) {
        document.activeElement.blur();
        e.currentTarget.parentElement.focus();
        this.currentlySelected = -1;
      }
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
      transition: background-color 200ms ease

      &.icon
        padding-left: 3.75rem

      &.negative
        color: $negative-saturated

      &.positive
        color: $positive-saturated

      &.warning
        color: $warning-saturated

      &.disabled
        pointer-events: none
        color: $text-tertiary

        span.hint kbd
          opacity: 0.38

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
        margin-right: 0.75rem
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
