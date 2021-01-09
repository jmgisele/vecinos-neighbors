<template lang="html">
  <teleport to="body">
    <transition>
      <div v-show="visible" v-bind="$attrs" class="popover" :class="{ dark, right: fromRight, transition }" ref="el" :style="{ left, top, transformOrigin }" tabindex="-1" @keyup.esc="close">
        <header v-if="$slots.header" :class="{ 'no-padding': noContentPadding }">
          <slot name="header" />
        </header>
        <div class="content" :class="{ 'no-padding': noContentPadding }">
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
    this.$store.commit('observers/removeResizeListener', this.$refs.el);
  },
  data() {
    return {
      left: '0px',
      top: '0px',
      transition: false,
      transformOrigin: null,
    };
  },
  emits: ['close'],
  inheritAttrs: false, // because this technically qualifies as a fragment since it teleports
  mounted() {
    if (this.visible) {
      this.update();
      window.addEventListener('resize', this.close);
      window.addEventListener('click', this.close);
      this.$store.commit('observers/addResizeListener', { el: this.$refs.el, cb: this.update });
    }
  },
  methods: {
    close(e) {
      if (e.type === 'click' && this.visible && !this.$refs.el.contains(e.target)) this.$emit('close');
      if ((e.type === 'resize' || e.type === 'keyup') && this.visible) this.$emit('close');
    },
    update(width, height) {
      const { height: rectHeight, width: rectWidth } = this.$refs.el.getBoundingClientRect(); // could probably only be asked conditionally if width/height are undefined
      const wWidth = window.innerWidth;
      const wHeight = window.innerHeight;
      const remBase = Number.parseInt(window.getComputedStyle(document.documentElement).fontSize, 10);
      const margin = 0.5 * remBase;
      const realWidth = Math.min(width || (rectWidth * 1.25), wWidth - 2 * margin); // needs to be scaled up since its size is 0.8 on enter, but not if the sizes come from the resize observer
      const realHeight = Math.min(height || (rectHeight * 1.25), wHeight - 2 * margin); // needs to be scaled up since its size is 0.8 on enter, but not if the sizes come from the resize observer
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

      const xOffset = this.x - left;
      const yOffset = this.y - top;

      this.transformOrigin = `${xOffset}px ${yOffset}px`;

      this.left = `${left}px`;
      this.top = `${top}px`;

      if (!document.activeElement || (document.activeElement !== this.$refs.el && !this.$refs.el.contains(document.activeElement))) this.$refs.el.focus();
    },
  },
  props: {
    centerX: Boolean,
    centerY: Boolean,
    dark: Boolean,
    fromRight: Boolean,
    noContentPadding: Boolean,
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
        window.setTimeout(() => {
          window.addEventListener('resize', this.close);
          window.addEventListener('click', this.close);
          this.$store.commit('observers/addResizeListener', { el: this.$refs.el, cb: this.update }); // will update the popover since it transitions from size 0 to actual size once v-show === true
        }, 0);
      } else {
        window.removeEventListener('resize', this.close);
        window.removeEventListener('click', this.close);
        this.$store.commit('observers/removeResizeListener', this.$refs.el);
      }
    },
  },
};
</script>

<style lang="stylus">
// so we can overwrite from the outside
.popover
  header,
  .content,
  footer
    > :first-child
      margin-top: 0

    > :last-child
      margin-bottom: 0
</style>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.popover
  position: fixed
  max-width: calc(100% - 1rem)
  max-height: calc(100% - 1rem)
  background-color: $bg
  border-radius: $radius-l
  border: 1px solid $bg-secondary
  box-shadow: 0 0.75rem 2rem 0 alpha($bg-dark, .18)
  overflow: hidden
  display: flex
  flex-direction: column
  z-index: 100 // HACK: this is a hack that’s needed because of the modal z-indexes so modals don’t cover popovers

  &.dark
    background-color: $bg-secondary-dark
    border-color: $bg-tertiary-dark

    footer
      background-color: $bg-tertiary-dark

  &.v-enter-active,
  &.v-leave-active
    transform-origin: top left
    transition: opacity 150ms ease, transform 150ms cubic-bezier(0.215, 0.610, 0.355, 1.000)

    &.v-enter-from,
    &.v-leave-to
      opacity: 0
      transform: scale(0.8)

  &.v-leave-active
    transition-timing-function: cubic-bezier(0.645, 0.045, 0.355, 1.000)

  header
    flex-shrink: 0

    &:not(.no-padding)
      padding: 1rem
      padding-bottom: 0

  .content
    overflow-x: hidden
    overflow-y: auto
    background-color: inherit

    &:not(.no-padding)
      padding: 1rem

  footer
    display: flex
    padding: 0.5rem
    background-color: $bg-secondary
    flex-shrink: 0

    ::v-deep(.button)
      width: 100%

      @media $mobile
        min-width: 0

      &:not(:last-child)
        margin-right: 0.5rem
</style>
