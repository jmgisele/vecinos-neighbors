<template lang="html">
  <div class="scroller" :class="[direction]">
    <div class="scroll-area" ref="scrollArea" @scroll.passive="toggleScrollShadows">
      <slot />
    </div>
    <div class="shadow start" :class="{ visible: shadow.start }" />
    <div class="shadow end" :class="{ visible: shadow.end }" />
  </div>
</template>

<script>
export default {
  beforeUnmount() {
    this.$store.commit('observers/removeResizeListener', this.$refs.scrollArea);
    this.observer.disconnect();
  },
  data() {
    return {
      observer: null,
      shadow: {
        start: false,
        end: false,
      },
    };
  },
  methods: {
    toggleScrollShadows() {
      if (this.direction === 'horizontal') {
        const hasHorizontalScrollbar = this.$refs.scrollArea.clientWidth < this.$refs.scrollArea.scrollWidth;

        const scrolledFromLeft = this.$refs.scrollArea.offsetWidth + this.$refs.scrollArea.scrollLeft;

        // Round using ceil to make sure it always disappears, even when the devicePixelRatio is off due to Chrome rounding
        const scrolledToRight = Math.ceil(scrolledFromLeft) >= Math.ceil(this.$refs.scrollArea.scrollWidth);
        const scrolledToLeft = this.$refs.scrollArea.scrollLeft === 0;

        this.shadow.end = hasHorizontalScrollbar && !scrolledToRight;
        this.shadow.start = hasHorizontalScrollbar && !scrolledToLeft;
      } else {
        const hasVerticalScrollbar = this.$refs.scrollArea.clientHeight < this.$refs.scrollArea.scrollHeight;

        const scrolledFromTop = this.$refs.scrollArea.offsetHeight + this.$refs.scrollArea.scrollTop;

        // Round using ceil to make sure it always disappears, even when the devicePixelRatio is off due to Chrome rounding
        const scrolledToBottom = Math.ceil(scrolledFromTop) >= Math.ceil(this.$refs.scrollArea.scrollHeight);
        const scrolledToTop = this.$refs.scrollArea.scrollTop === 0;

        this.shadow.end = hasVerticalScrollbar && !scrolledToBottom;
        this.shadow.start = hasVerticalScrollbar && !scrolledToTop;
      }
    },
  },
  mounted() {
    this.toggleScrollShadows();
    this.$store.commit('observers/addResizeListener', { el: this.$refs.scrollArea, cb: this.toggleScrollShadows });

    if ('MutationObserver' in window) {
      this.observer = new MutationObserver(this.toggleScrollShadows);
      this.observer.observe(this.$refs.scrollArea, { childList: true, subtree: true });
    } else console.warn('Mutation Observers are not supported in this browser / context');
  },
  props: {
    direction: {
      type: String,
      default: 'horizontal',
      validator: (v) => ['horizontal', 'vertical'].includes(v),
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'

.scroller
  position: relative
  overflow: hidden

  &.horizontal
    .scroll-area
      overflow-x: auto
      overflow-y: hidden

  &.vertical
    .scroll-area
      overflow-x: hidden
      overflow-y: auto

    .shadow
      left: 0
      right: 0

      &.start
        top: 0
        bottom: auto
        border-top: 2px dashed $accent-secondary

      &.end
        bottom: 0
        top: auto
        border-bottom: 2px dashed $accent-secondary

  .scroll-area
    max-height: inherit
    max-width: inherit
    scrollbar-width: none
    -ms-overflow-style: none

    &::-webkit-scrollbar
      display: none

  .shadow
    position: absolute
    top: 0
    bottom: 0
    pointer-events: none
    opacity: 0
    transition: opacity 200ms ease

    &.visible
      opacity: 1

    &.start
      left: 0
      border-left: 2px dashed $accent-secondary

    &.end
      right: 0
      border-right: 2px dashed $accent-secondary
</style>
