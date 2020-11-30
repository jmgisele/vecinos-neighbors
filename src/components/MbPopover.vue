<template lang="html">
  <teleport to="body">
    <transition>
      <div v-show="visible" v-bind="$attrs" class="popover" :class="{ 'center-x': centerX, 'center-y': centerY, dark, right: fromRight, transition }" ref="el" :style="{ left, top, }">
        <header v-if="$slots.header">
          <slot name="header" />
        </header>
        <div class="content">
          <slot />
        </div>
        <footer v-if="$slots.footer">
          <slot name="footer" />
        </footer>
      </div>
    </transition>
  </teleport>
</template>

<script>
export default {
  beforeUnmount() {
    window.removeEventListener('resize', this.close);
    window.removeEventListener('click', this.close);
  },
  data() {
    return {
      left: '0px',
      top: '0px',
      transition: false,
    };
  },
  inheritAttrs: false, // because this technically qualifies as a fragment since it teleports
  mounted() {
    if (this.visible) {
      this.update();
      window.addEventListener('resize', this.close);
      window.addEventListener('click', this.close);
    }
  },
  methods: {
    close(e) {
      if (e.type === 'click' && this.visible && !this.$refs.el.contains(e.target)) this.$emit('close');
      if (e.type === 'resize' && this.visible) this.$emit('close');
    },
    update() {
      const { height, width } = this.$refs.el.getBoundingClientRect();
      const wWidth = window.innerWidth;
      const wHeight = window.innerHeight;
      const remBase = Number.parseInt(window.getComputedStyle(document.documentElement).fontSize, 10);
      const margin = 0.5 * remBase;
      const realWidth = Math.min(width * 1.25, wWidth - 2 * margin); // needs to be scaled up since its size is 0.8 on enter
      const realHeight = Math.min(height * 1.25, wHeight - 2 * margin); // needs to be scaled up since its size is 0.8 on enter
      let left = 0;
      let top = 0;

      if (!this.centerX) {
        if (!this.fromRight) {
          if (this.x + realWidth + margin < wWidth) left = this.x;
          else left = wWidth - margin - realWidth;
        } else if (this.x - realWidth > 0) left = this.x - realWidth;
        else left = margin;
      } else if (this.x - realWidth / 2 + realWidth < wWidth) left = this.x - realWidth / 2;
      else left = wWidth - margin - realWidth;

      if (left <= margin) left = margin;

      if (!this.centerY) {
        if (this.y + realHeight + margin < wHeight) top = this.y;
        else top = wHeight - realHeight - margin;
      } else if (this.y - realHeight / 2 + realHeight < wHeight) top = this.y - realHeight / 2;
      else top = wHeight - margin - realHeight;

      if (top <= margin) top = margin;

      this.left = `${left}px`;
      this.top = `${top}px`;
    },
  },
  props: {
    centerX: Boolean,
    centerY: Boolean,
    dark: Boolean,
    fromRight: Boolean,
    visible: Boolean,
    x: {
      type: Number,
      default: 0,
    },
    y: {
      type: Number,
      default: 0,
    },
  },
  watch: {
    visible(nv) {
      if (nv) {
        this.$nextTick(this.update);
        window.setTimeout(() => {
          window.addEventListener('resize', this.close);
          window.addEventListener('click', this.close);
        }, 0);
      } else {
        window.removeEventListener('resize', this.close);
        window.removeEventListener('click', this.close);
      }
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.popover
  position: fixed
  max-width: calc(100% - 1rem)
  background-color: $bg
  border-radius: $radius-l
  border: 1px solid $bg-secondary
  box-shadow: 0 0.75rem 2rem 0 alpha($bg-dark, .18)
  overflow: hidden

  &.dark
    background-color: $bg-secondary-dark
    border-color: $bg-tertiary-dark

    footer
      background-color: $bg-tertiary-dark

  &.v-enter-active,
  &.v-leave-active
    transform-origin: top left
    transition: opacity 150ms ease, transform 150ms cubic-bezier(0.215, 0.610, 0.355, 1.000)

    &.center-x
      transform-origin: top center

    &.center-y
      transform-origin: center left

    &.center-x.center-y
      transform-origin: center

    &.right:not(.center-x)
      transform-origin: top right

      &.center-y
        transform-origin: center right

    &.v-enter-from,
    &.v-leave-to
      opacity: 0
      transform: scale(0.8)

  &.v-leave-active
    transition-timing-function: cubic-bezier(0.645, 0.045, 0.355, 1.000)

  header,
  .content,
  footer
    > :first-child
      margin-top: 0

    > :last-child
      margin-bottom: 0

  header
    padding: 1rem
    padding-bottom: 0

  .content
    padding: 1rem

  footer
    display: flex
    // justify-content: flex-end
    padding: 0.5rem
    background-color: $bg-secondary

    ::v-deep(.button)
      width: 100%

      &:not(:last-child)
        margin-right: 0.5rem
</style>
