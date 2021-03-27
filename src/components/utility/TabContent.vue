<template lang="html">
  <main class="tab-content" :class="{ split: showSplit }">
    <div class="content-wrapper" :class="{ dark, padded }">
      <slot />
    </div>
    <transition>
      <div v-if="!isMobile" v-show="showSplit" class="content-wrapper right" :class="{ dark, padded }">
        <MbButton class="close-button" :dark="dark" icon="cross" rounded @click="$emit('split-close')" />
        <slot name="right" />
      </div>
    </transition>
    <MbModal v-if="isMobile" :dark="dark" :visible="showSplit" @close="$emit('split-close')">
      <slot name="right" />
    </MbModal>
  </main>
</template>

<script>
export default {
  computed: {
    isMobile() {
      return this.$store.state.application.mobile;
    },
  },
  data() {
    return {
      entering: false,
    };
  },
  emits: ['split-close'],
  props: {
    dark: Boolean,
    padded: {
      type: Boolean,
      default: true,
    },
    showSplit: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'

.tab-content
  overflow-x: hidden
  position: relative

  &.split
    .content-wrapper
      &:first-child
        width: 50%
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000)
        background-color: $bg-tertiary

        @media $mobile
          width: 100%

        &.dark
          background-color: $bg-dark

  .content-wrapper
    width: 100%
    height: 100%
    overflow-y: auto
    background-color: $bg

    &:first-child
      transition: background-color 200ms ease, width 200ms cubic-bezier(0.645, 0.045, 0.355, 1.000)

    &.dark
      background-color: $bg-dark

    &.padded
      padding: 0 2rem 8rem 2rem

    &.right
      position: absolute
      top: 0
      left: 50%
      width: 50%

      &.dark
        background-color: $bg-secondary-dark

      &.v-enter-active,
      &.v-leave-active
        transition: transform 200ms cubic-bezier(0.215, 0.610, 0.355, 1.000)

        &.v-enter-from,
        &.v-leave-to
          transform: translateX(100%)

      &.v-leave-active
        transition-timing-function: cubic-bezier(0.645, 0.045, 0.355, 1.000)

      .close-button
        position: absolute
        top: 1rem
        right: 1rem
</style>
