<template lang="html">
  <teleport to="body">
    <div class="centerer">
      <transition>
        <div v-show="visible" v-bind="$attrs" class="modal" :class="{dark, darkened: nextModal, transition: !swiping, swiping }" ref="el" :style="{ opacity, pointerEvents, transform }" @touchstart="swipeStart" @touchmove="swipeUpdate" @touchend="swipeEnd">
          <header v-if="title">
            <h2 class="h3">{{title}}</h2>
          </header>
          <div class="body" :class="{ padded: paddedBody, 'no-footer': !$slots.actions }" ref="body">
            <slot />
          </div>
          <footer v-if="$slots.actions">
            <slot name="actions" />
          </footer>
        </div>
      </transition>
    </div>
  </teleport>
</template>

<script>
export default {
  computed: {
    mobile() {
      return this.$store.state.application.mobile;
    },
    modalIndex() {
      return this.$store.state.application.openModals.indexOf(this.$refs.el);
    },
    nextModal() {
      const { openModals } = this.$store.state.application;
      if (this.modalIndex > -1 && this.modalIndex < openModals.length - 1) return openModals[this.modalIndex + 1];
      return null;
    },
    previousModal() {
      const { openModals } = this.$store.state.application;
      if (this.modalIndex > 0) return openModals[this.modalIndex - 1];
      return null;
    },
    opacity() {
      if (this.visible && this.modalIndex < this.$store.state.application.openModals.length - 2) return 0;
      return null;
    },
  },
  data() {
    return {
      maxSwipeDistance: 0,
      pointerEvents: null,
      previousModalTransform: null,
      startY: 0,
      swiping: false,
      transform: null,
    };
  },
  emits: ['close'],
  inheritAttrs: false,
  methods: {
    swipeEnd(e) {
      if (!this.swiping) return;
      const finalY = e.changedTouches[0].clientY;
      const distance = finalY - this.startY;
      this.swiping = false;
      if (this.previousModal) {
        this.previousModal.style.removeProperty('transition');
        this.previousModal.style.transform = `translateY(${this.previousModalTransform}px) scale(0.8)`; // restore original transform
      }

      if (distance > this.maxSwipeDistance / 2 || distance > window.innerHeight / 3) {
        this.transform = 'translateY(100%)';
        this.$emit('close');
      } else this.transform = null;
    },
    swipeStart(e) {
      if (this.$refs.body.scrollTop !== 0) return; // we’ll be scrolling
      this.maxSwipeDistance = this.$refs.el.getBoundingClientRect().height;
      this.startY = e.changedTouches[0].clientY;
      this.swiping = true;
      if (this.previousModal) {
        this.previousModal.style.transition = 'none';
        // Based on: https://zellwk.com/blog/css-translate-values-in-javascript/ only works because we translate before we scale
        this.previousModalTransform = Number.parseInt(window.getComputedStyle(this.previousModal).transform.match(/matrix.*\((.+)\)/)[1].split(', ')[5], 10);
      }
    },
    swipeUpdate(e) {
      if (!this.swiping) return;
      const currentY = e.changedTouches[0].clientY;
      const distance = currentY - this.startY;
      if (distance > 0 && e.cancelable) e.preventDefault();
      this.transform = `translateY(${Math.max(distance, 0)}px)`;
      if (this.previousModal) this.previousModal.style.transform = `translateY(${this.previousModalTransform - this.previousModalTransform * (Math.max(distance, 0) / this.maxSwipeDistance)}px) scale(${0.8 + 0.2 * (Math.max(distance, 0) / this.maxSwipeDistance)})`;
    },
    updateOffsets() {
      const nextModalRect = this.nextModal.getBoundingClientRect();
      const ownRect = this.$refs.el.getBoundingClientRect();
      const remBase = Number.parseInt(window.getComputedStyle(document.documentElement).fontSize, 10);
      const margin = 2 * remBase;
      if (this.mobile) {
        const yDelta = (nextModalRect.height - ownRect.height * 0.8); // ownRect has to be scaled to account for later scale-down
        if (yDelta > 0) this.transform = `translateY(-${yDelta + margin}px) scale(0.8)`;
        else this.transform = 'scale(0.8)';
      } else {
        const yDelta = (nextModalRect.height * 1.25 - ownRect.height * 0.8) / 2; // nextModal is at 0.8 size when entering, ownRect has to be scaled to account for later scale-down
        this.transform = `translateY(${yDelta + margin}px) scale(0.8)`;
      }
      this.pointerEvents = 'none';
    },
  },
  props: {
    dark: Boolean,
    paddedBody: {
      type: Boolean,
      default: true,
    },
    title: String,
    visible: Boolean,
  },
  watch: {
    modalIndex(nv) {
      if (nv < 0) this.$emit('close');
    },
    nextModal(nv) {
      if (!nv) {
        this.transform = null;
        this.pointerEvents = null;
      } else this.$nextTick(this.updateOffsets);
    },
    visible(nv) {
      if (nv) {
        this.transform = null;
        this.$store.commit('addOpenModal', this.$refs.el);
      } else if (this.modalIndex >= 0) this.$store.commit('closeModal', this.modalIndex);
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.centerer
  position: fixed
  top: 0
  left: 0
  bottom: 0
  right: 0
  display: flex
  align-items: center
  justify-content: center
  pointer-events: none
  z-index: 1

.modal
  width: 40rem
  max-width: 100%
  max-height: 70vh
  display: flex
  flex-direction: column
  background-color: $bg
  border-radius: $radius-xl
  border: 1px solid $bg-secondary
  box-shadow: 0 0.75rem 2rem 0 alpha($bg-dark, .18)
  overflow: hidden
  pointer-events: auto // needed to revert the pointer-events: none from the parent
  touch-action: pan-y

  &.transition
    transition: transform 200ms ease, opacity 200ms ease, background-color 200ms ease, border-radius 200ms ease

  @media $mobile
    align-self: flex-end
    max-height: 90vh
    border-bottom-left-radius: 0
    border-bottom-right-radius: 0
    box-shadow: 0 -0.75rem 2rem 0 alpha($bg-dark, .18)
    transform-origin: bottom

    &.transition
      transition-duration: 250ms

  &.darkened
    background-color: $bg-secondary
    border-bottom-left-radius: $radius-xl
    border-bottom-right-radius: $radius-xl

  &.dark
    background-color: $bg-secondary-dark
    border-color: $bg-tertiary-dark

    &.darkened
      background-color: $bg-dark
      border-color: $bg-secondary-dark

  &.v-enter-active,
  &.v-leave-active
    transition: opacity 150ms ease, transform 150ms cubic-bezier(0.215, 0.610, 0.355, 1.000) !important // Hack: needed so the leave transition works after swiping modal away

    @media $mobile
      transition-duration: 250ms !important // Hack: needed so the leave transition works after swiping modal away

    &.v-enter-from,
    &.v-leave-to
      opacity: 0
      transform: scale(0.8)

      @media $mobile
        transform: translateY(100%)
        opacity: 1

  &.v-leave-active
    transition-timing-function: cubic-bezier(0.645, 0.045, 0.355, 1.000)

  header
    flex-shrink: 0
    text-align: center
    padding: (32 / 16)rem

    @media $mobile
      padding: 1rem

    .h3
      margin: 0

  .body
    overflow-y: auto

    &.padded
      padding: 0 (32 / 16)rem

      @media $mobile
        padding: 0 1rem

    &.no-footer
      padding-bottom: (32 / 16)rem

      @media $mobile
        padding-bottom: 1rem

  footer
    flex-shrink: 0
    padding: (32 / 16)rem
    text-align: right

    @media $mobile
      padding: 1rem
</style>
