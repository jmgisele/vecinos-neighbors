<template lang="html">
  <div class="tabs" :class="{ dark }">
    <div class="scroll-wrapper" ref="scrollWrapper" @scroll.passive="toggleShadow">
      <transition-group ref="tabs" tag="ul" @after-leave="resetActiveTab">
        <li v-for="(tab, index) in tabs" :data-index="index" :key="tab.value || tab" tabindex="0" @click.left="activateTab($event, index)" @keyup.enter="activateTab($event, index)" @keyup.space="activateTab($event, index)">{{tab.label || tab}}</li>
        <li v-if="showAddOption" class="add-option" key="mbTabsAddOption" tabindex="0" @click="addTab" @keyup.space="addTab" @keyup.enter="addTab" @mouseenter="showTooltip('Add new tab', $event.currentTarget)" @focus="showTooltip('Add new tab', $event.currentTarget)"><MbIcon icon="plus" /></li>
      </transition-group>
      <div class="active-indicator" :style="{ transform: indicatorTransform }"></div>
    </div>
    <div class="shadow left" :class="{ visible: shadow.left }" />
    <div class="shadow right" :class="{ visible: shadow.right }" />
  </div>
</template>

<script>
import { showTooltip, hideTooltip } from '@/mixins/tooltipFunctions';

export default {
  data() {
    return {
      mounted: false,
      shadow: {
        left: false,
        right: false,
      },
    };
  },
  computed: {
    indicatorTransform() {
      if (!this.mounted || !this.$refs.tabs) return 'translateX(0) scaleX(0)';

      const tabElement = this.$refs.tabs.$el.children[this.value];
      if (!tabElement) return 'translateX(0) scaleX(0)';

      const translate = tabElement.offsetLeft;
      const scale = tabElement.offsetWidth / 100; // 100 is the initial width of the active-indicator element in px
      return `translateX(${translate}px) scaleX(${scale})`;
    },
  },
  methods: {
    activateTab(e, index) {
      this.$emit('input', index);
      this.scrollTabIntoView(e.currentTarget);
    },
    addTab() {
      this.$emit('add-tab');
      hideTooltip();
      this.$nextTick(() => this.scrollTabIntoView(this.$refs.tabs.$el.lastChild));
    },
    resetActiveTab(el) {
      const activeTabBackup = this.value;
      if (el.dataset.index > activeTabBackup) this.$emit('input', activeTabBackup);
      else this.$emit('input', Math.max(0, activeTabBackup - 1));

      // the size of the wrapper changed so we should recalculate the shadows
      this.toggleShadow();
    },
    scrollTabIntoView(el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    },
    showTooltip,
    toggleShadow() {
      const hasHorizontalScrollbar = this.$refs.scrollWrapper.clientWidth < this.$refs.scrollWrapper.scrollWidth;

      const scrolledFromLeft = this.$refs.scrollWrapper.offsetWidth + this.$refs.scrollWrapper.scrollLeft;

      // Round using ceil to make sure it always disappears, even when the devicePixelRatio is off due to Chrome rounding
      const scrolledToRight = Math.ceil(scrolledFromLeft) >= Math.ceil(this.$refs.scrollWrapper.scrollWidth);
      const scrolledToLeft = this.$refs.scrollWrapper.scrollLeft === 0;

      this.shadow.right = hasHorizontalScrollbar && !scrolledToRight;
      this.shadow.left = hasHorizontalScrollbar && !scrolledToLeft;
    },
  },
  mounted() {
    this.toggleShadow();
    // needed so the active indicator can update its position
    this.mounted = true;
  },
  props: {
    dark: Boolean,
    showAddOption: Boolean,
    tabs: {
      type: Array,
      default: () => [],
    },
    value: Number,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.tabs
  position: relative
  color: $text
  background-color: $bg
  box-shadow: inset 0 -2px 0 0 $bg-secondary
  white-space: nowrap
  max-width: 100%
  user-select: none

  &.dark
    color: $text-dark
    background-color: $bg-dark
    box-shadow: inset 0 -2px 0 0 $bg-secondary-dark

    .scroll-wrapper > ul li
      &:hover,
      &:focus
        background-color: $bg-secondary-dark

  .scroll-wrapper
    position: relative
    overflow-x: auto
    overflow-y: hidden
    scrollbar-width: none
    -ms-overflow-style: none

    &::-webkit-scrollbar
      display: none

    > ul
      margin: 0
      width: 100%
      list-style: none
      padding: 0

      li
        display: inline-block
        padding: 1rem 1.5rem
        cursor: pointer
        border-top-left-radius: $radius-m
        border-top-right-radius: @border-top-left-radius
        position: relative
        transition: background-color 200ms ease

        &.add-option
          line-height: 0

        &:hover,
        &:focus
          background-color: $bg-secondary

        &:focus
          outline: none

        &.v-enter-active,
        &.v-leave-active
          transition: transform 200ms ease, opacity 200ms ease

          &.v-enter,
          &.v-leave-to
            transform: translateY(1rem)
            opacity: 0

    .active-indicator
      position: absolute
      width: 100px
      height: 2px
      background-color: $accent
      bottom: 0
      left: 0
      transform-origin: left
      transition: transform 200ms ease

  .shadow
    position: absolute
    top: 0
    bottom: 2px
    pointer-events: none
    opacity: 0
    transition: opacity 200ms ease

    &.visible
      opacity: 1

    &.left
      left: 0
      border-left: 2px dashed $accent-secondary

    &.right
      right: 0
      border-right: 2px dashed $accent-secondary
</style>
