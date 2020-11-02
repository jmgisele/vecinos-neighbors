<template lang="html">
  <div class="loader">
    <div class="brick one" />
    <div class="brick two" />
    <div class="brick three" />
    <div class="brick four" />
  </div>
</template>

<script>
export default {
};
</script>

<style lang="stylus" scoped>
.loader
  display: flex
  align-items: center
  justify-content: center

  .brick
    width: 2rem
    height: 1rem
    background-color: currentColor
    opacity: 0
    animation: fromTop 2000ms ease infinite

    &:not(:first-child)
      margin-left: -1rem

    &:nth-child(even)
      margin-bottom: 2rem

    &.two, &.three
      background-color: transparent
      box-shadow: inset 0 0 0 2px currentColor

    &.two
      animation-delay: 500ms

    &.three
      animation-delay: 250ms

    &.four
      animation-delay: 750ms

    @keyframes fromTop
      5%
        opacity: 0
        transform: translateY(-1rem)
      25%,
      50%
        opacity: 1
        transform: none
      100%
        opacity: 0
</style>
