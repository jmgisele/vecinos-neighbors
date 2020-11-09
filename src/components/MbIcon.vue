<template lang="html">
  <transition mode="out-in">
    <svg class="icon" viewBox="0 0 24 24" fill="none" :key="icon" xmlns="http://www.w3.org/2000/svg">
      <use :key="icon" :xlink:href="`#mb_${icon}`" />
    </svg>
  </transition>
</template>

<script>
export default {
  props: {
    icon: {
      type: String,
      default: 'mattrbld',
    },
  },
};
</script>

<style lang="stylus" scoped>
.icon
  display: inline-block
  stroke-width: 2px
  stroke-linejoin: round
  stroke-linecap: round
  width: 1.5rem
  height: 1.5rem
  vertical-align: middle

  &.v-enter-active,
  &.v-leave-active
    transition: transform 200ms ease, opacity 200ms ease

    &.v-enter-from,
    &.v-leave-to
      opacity: 0

    &.v-enter-from
      transform: rotate(-45deg)

    &.v-leave-to
      transform: rotate(45deg)

</style>
