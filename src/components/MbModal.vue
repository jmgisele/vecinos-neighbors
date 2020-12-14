<template lang="html">
  <teleport to="body">
    <div class="centerer">
      <transition>
        <div v-show="visible" v-bind="$attrs" class="modal" :class="{dark, darkened: nextModal }" ref="el" :style="{ opacity, pointerEvents, transform }">
          <header v-if="title">
            <h2 class="h3">{{title}}</h2>
          </header>
          <div class="body">
            <slot />
          </div>
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
    opacity() {
      if (this.visible && this.modalIndex < this.$store.state.application.openModals.length - 2) return 0;
      return null;
    },
  },
  data() {
    return {
      pointerEvents: null,
      transform: null,
    };
  },
  emits: ['close'],
  inheritAttrs: false,
  methods: {
    updateOffsets() {
      const nextModalRect = this.nextModal.getBoundingClientRect();
      const ownRect = this.$refs.el.getBoundingClientRect();
      const remBase = Number.parseInt(window.getComputedStyle(document.documentElement).fontSize, 10);
      const margin = 2 * remBase;
      if (this.mobile) {
        const yDelta = (nextModalRect.height - ownRect.height * 0.8);
        if (yDelta > 0) this.transform = `translateY(-${yDelta + margin}px) scale(0.8)`;
        else this.transform = 'scale(0.8)';
      } else {
        const yDelta = (nextModalRect.height * 1.25 - ownRect.height * 0.8) / 2;
        this.transform = `translateY(${yDelta + margin}px) scale(0.8)`;
      }
      this.pointerEvents = 'none';
    },
  },
  props: {
    dark: Boolean,
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
  max-width: 40rem
  max-height: 90vh
  background-color: $bg
  border-radius: $radius-xl
  border: 1px solid $bg-secondary
  box-shadow: 0 0.75rem 2rem 0 alpha($bg-dark, .18)
  overflow: hidden
  padding: (32 / 16)rem
  pointer-events: auto // needed to revert the pointer-events: none from the parent
  transition: transform 200ms ease, opacity 200ms ease, background-color 200ms ease

  @media $mobile
    align-self: flex-end;
    width: 100%
    border-bottom-left-radius: 0
    border-bottom-right-radius: 0
    transition-duration: 250ms
    box-shadow: 0 -0.75rem 2rem 0 alpha($bg-dark, .18)
    transform-origin: bottom

  &.darkened
    background-color: $bg-secondary

  &.dark
    background-color: $bg-secondary-dark
    border-color: $bg-tertiary-dark

    &.darkened
      background-color: $bg-dark
      border-color: $bg-secondary-dark

  &.v-enter-active,
  &.v-leave-active
    transition: opacity 150ms ease, transform 150ms cubic-bezier(0.215, 0.610, 0.355, 1.000)

    @media $mobile
      transition-duration: 250ms

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
    text-align: center
    margin-bottom: 2rem

    .h3
      margin: 0
</style>
