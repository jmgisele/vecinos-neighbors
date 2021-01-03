<template lang="html">
  <transition-group class="snackbar" tag="div">
    <Toast v-for="toast in toasts" :dark="dark" :key="toast.id" :toast="toast" />
  </transition-group>
</template>

<script>
import Toast from './Toast.vue';

export default {
  components: {
    Toast,
  },
  computed: {
    toasts() {
      if (this.$store.state.application.mobile) return this.$store.state.application.toasts;
      return [...this.$store.state.application.toasts].reverse();
    },
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'

.snackbar
  position: fixed
  top: 1rem
  left: 50%
  transform: translateX(-50%)
  margin: 0 auto
  width: 100%
  max-width: 40rem
  pointer-events: none
  z-index: 100 // toasts should overlay everything like popovers

  @media $mobile
    top: auto
    bottom: 0

  .toast
    &.v-enter-active,
    &.v-leave-active,
    &.v-move
      transition: opacity 200ms ease, transform  250ms cubic-bezier(0.215, 0.610, 0.355, 1.000)

      &.v-enter-from,
      &.v-leave-to
        opacity: 0
        transform: scale(0.8)

        @media $mobile
          transform: translateY(100%)

      &.v-leave-to
        @media $mobile
          transform: translate(1rem, calc(-100% - 1rem)) scale(0.8)

    &.v-leave-active
      position: absolute
</style>
