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
@require '../../assets/styles/colors'

.tab-content
  display: flex
  overflow-x: hidden

  &.split
    .content-wrapper
      &:first-child
        background-color: $bg-tertiary

        &.dark
          background-color: $bg-dark

  .content-wrapper
    width: 100%
    height: 100%
    overflow-y: auto
    background-color: $bg

    &:first-child
      transition: background-color 200ms ease

    &.dark
      background-color: $bg-dark

    &.padded
      padding: 0 2rem 8rem 2rem

    &.right
      position: relative

      &.dark
        background-color: $bg-secondary-dark

      &.v-enter-active,
      &.v-leave-active
        transition: transform 200ms ease, opacity 200ms ease

        &.v-enter-from,
        &.v-leave-to
          transform: translateX(8rem)
          opacity: 0
      //
      // &.v-enter-active
      //   transition-delay: 200ms

      .close-button
        position: absolute
        top: 1rem
        right: 1rem
</style>
