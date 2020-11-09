<template lang="html">
  <div class="inline-loader">
    <div class="brick left" />
    <div class="brick right" />
  </div>
</template>

<script>
export default {
};
</script>

<style lang="stylus" scoped>

.inline-loader
  overflow: hidden
  height: 0.625rem
  width: 2.125rem
  padding: (1 / 16)rem
  display: flex
  justify-content: space-between

  .brick
    position: relative
    width: 43.75%
    height: 100%
    box-shadow: inset 0 0 0 (1 / 16)rem currentColor, 0 0 0 (1 / 16)rem currentColor

    &.left
      animation: build-left 1s ease infinite

      @keyframes build-left
        0%
        50%
          transform: none
        100%
          transform: translateX(calc(-100% - 0.25rem))

      &::after
        content: ''
        display: block
        background-color: currentColor
        width: 100%
        height: 100%
        position: absolute
        top: 0
        left: 0
        transform-origin: left
        transform: scaleX(0)
        animation: fill-left 1s ease infinite

        @keyframes fill-left
          0%
            transform: scalex(0)
          25%
          100%
            transform: none

    &.right
      animation: build-right 1s ease infinite

      @keyframes build-right
        0%
          transform: translateY(calc(-100% - 0.25rem))
          opacity: 0
        50%
          transform: none
          opacity: 1
        100%
          transform: translateX(calc(-100% - 0.25rem))
</style>
