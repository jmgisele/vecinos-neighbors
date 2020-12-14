<template lang="html">
  <transition>
    <div v-show="visible" class="modal-overlay" :class="{dark}" @click="closeTopmostModal" />
  </transition>
</template>

<script>
export default {
  computed: {
    visible() {
      return this.$store.state.application.openModals.length > 0;
    },
  },
  methods: {
    closeTopmostModal() {
      this.$store.commit('closeTopmostModal');
    },
  },
  props: {
    dark: Boolean,
  },
  watch: {
    visible(nv) {
      // lock the scroll of the body
      if (nv) {
        document.documentElement.style.setProperty('overflow', 'hidden');
        document.body.style.setProperty('overflow', 'hidden');
      } else {
        document.documentElement.style.removeProperty('overflow');
        document.body.style.removeProperty('overflow');
      }
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'

.modal-overlay
  background-color: alpha($bg-dark, 0.6)
  position: fixed
  top: 0
  left: 0
  right: 0
  bottom: 0
  z-index: 1

  &.dark
    background-color: alpha(black, 0.6)

  &.v-enter-active,
  &.v-leave-active
    transition: opacity 200ms ease

    &.v-enter-from,
    &.v-leave-to
      opacity: 0
</style>
