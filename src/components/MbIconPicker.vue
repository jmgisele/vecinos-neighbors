<template>
  <div class="icon-picker" :class="{ dark }" tabindex="0" @click="activate" @keydown.space.prevent @keyup.space.enter="activate">
    <MbIcon :icon="modelValue || 'mattrbld'" />
    <span class="label" :class="{ placeholder: !modelValue }">{{modelValue || placeholder}}</span>
    <MbButton v-if="removable" v-show="modelValue" :dark="dark" icon="cross" ref="removeButton" rounded tooltip="Clear path" @click="$emit('update:modelValue', null)" />
    <MbPopover center-x class="picker-popover" :dark="dark" no-content-padding ref="popover" :visible="showPicker" :x="popover.x" :y="popover.y" @after-close="iconFilter = ''" @close="deactivate">
      <div class="content-wrapper">
        <header>
          <MbInput v-model="iconFilter" :dark="dark" icon="search" placeholder="Filter icons…" />
        </header>
        <MbScroller direction="vertical">
          <ul>
            <li v-for="icon in filteredIcons" :class="{ active: icon === modelValue, dark }" :key="icon" tabindex="0" @click="pickIcon(icon)" @keydown.space.prevent @keyup.space.enter="pickIcon(icon)">
              <MbIcon :icon="icon" />
              <span>{{icon}}</span>
            </li>
          </ul>
        </MbScroller>
      </div>
      <template #footer>
        <MbButton :dark="dark" @click="deactivate">Cancel</MbButton>
      </template>
    </MbPopover>
  </div>
</template>

<script>
import { pathBasename } from '../fs';

function generateIconsList() {
  return Object.keys(import.meta.glob('@/assets/icons/**.svg')).map((path) => pathBasename(path).replace(/^(.*)\.\w+$/, '$1'));
}

export default {
  availableIcons: generateIconsList(),
  computed: {
    filteredIcons() {
      if (!this.iconFilter) return this.$options.availableIcons;
      return this.$options.availableIcons.filter((icon) => icon.includes(this.iconFilter.toLowerCase()));
    },
  },
  data() {
    return {
      iconFilter: '',
      popover: {
        x: 0,
        y: 0,
      },
      showPicker: false,
    };
  },
  emits: ['update:modelValue'],
  methods: {
    activate(e) {
      if (e && this.removable && (e.target === this.$refs.removeButton.$el || this.$refs.removeButton.$el.contains(e.target))) return;
      const rect = this.$el.getBoundingClientRect();
      const remBase = Number.parseInt(window.getComputedStyle(document.documentElement).fontSize, 10);
      this.listWidth = Math.max(20, rect.width / remBase);
      this.popover.x = rect.left + rect.width / 2;
      this.popover.y = rect.bottom + 0.5 * remBase;
      window.addEventListener('scroll', this.deactivate, { capture: true, passive: true });
      this.showPicker = true;
    },
    deactivate(e) {
      if (e && e.type === 'scroll' && this.$refs.popover.$refs.el.contains(e.target)) return;
      window.removeEventListener('scroll', this.deactivate, { capture: true, passive: true });
      this.showPicker = false;
      this.$el.focus();
    },
    pickIcon(icon) {
      this.$emit('update:modelValue', icon);
      this.deactivate();
    },
  },
  props: {
    dark: Boolean,
    modelValue: String,
    placeholder: {
      type: String,
      default: 'Pick an icon…',
    },
    removable: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.icon-picker
  position: relative
  border: none
  background-color: $bg-secondary
  color: inherit
  border-radius: $radius-m
  padding: 1rem
  padding-right: 1.5rem
  display: inline-flex
  align-items: center
  cursor: pointer
  transition: background-color 200ms ease
  user-select: none
  text-align: left
  white-space: nowrap
  max-width: 100%
  overflow: hidden

  &:hover
    background-color: $bg-tertiary

  &:focus
    background-color: $bg-secondary

    &::before
      opacity: 1

  &:active
    transform: translateY(2px)

  &.dark
    background-color: $bg-secondary-dark

    &:hover
      background-color: $bg-tertiary-dark

    &:focus
      background-color: $bg-secondary-dark

    .label.placeholder
      color: $text-secondary-dark

  &::before
    content: ''
    position: absolute
    top: 0px
    left: @top
    right: @top
    bottom: @top
    box-shadow: inset 0 0 0 0.125rem $accent
    opacity: 0
    border-radius: inherit
    transition: opacity 200ms ease

  .label
    margin-left: 0.75rem
    overflow: hidden
    text-overflow: ellipsis
    margin-right: auto

    &.placeholder
      color: $text-secondary

  .icon
    flex-shrink: 0

  .button.icon
    margin: -0.5rem
    margin-left: 0.5rem
    margin-right: -1rem
    padding: (8.5 / 16)rem

.picker-popover
  .content-wrapper
    background-color: inherit

    header
      padding: 0.5rem

      .input
        width: 100%

        &.dark
          background-color: $bg-tertiary-dark

    ul
      user-select: none
      max-height: 30rem
      margin: 0
      padding: 0.5rem
      padding-top: 0
      list-style: none
      // overflow-y: auto
      background-color: inherit
      display: flex
      flex-wrap: wrap
      max-width: ((3 * (88 + 16) + 16) / 16)rem

      &::after
        content: ''
        display: block
        height: 0.5rem
        width: 100%

      li
        margin: 0.5rem
        padding: 0.5rem
        display: flex
        flex-direction: column
        align-items: center
        background-color: $bg-secondary
        border-radius: $radius-m
        width: (88 / 16)rem
        overflow: hidden
        cursor: pointer
        transition: background-color 200ms ease
        position: relative

        &:hover
          background-color: $bg-tertiary

        &:focus::before
          opacity: 1

        &:active
          transform: translateY(0.125rem)
          background-color: $bg

        &.dark
          background-color: $bg-tertiary-dark
          box-shadow: inset 0 0 0 0.0625rem lighten($bg-tertiary-dark, 3)

          &:hover
            background-color: lighten($bg-tertiary-dark, 5)

          &:active
            background-color: $bg-secondary-dark

          span
            color $text-secondary-dark

        &.active
          background-color: $accent
          color: $text-dark

          &:hover,
          &:focus
            background-color: darken($accent, 5)

          span
            color: $text-secondary-dark

        &::before
          content: ''
          position: absolute
          top: 0px
          left: @top
          right: @top
          bottom: @top
          box-shadow: inset 0 0 0 0.125rem $accent
          opacity: 0
          border-radius: inherit
          transition: opacity 200ms ease

        .icon
          display: block
          margin-bottom: 0.5rem
          margin-top: @margin-bottom

        span
          font-size: 0.875rem
          color: $text-secondary
          overflow: hidden
          text-overflow: ellipsis
          white-space: nowrap
          max-width: 100%
</style>
