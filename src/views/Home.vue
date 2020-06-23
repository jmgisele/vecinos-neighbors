<template>
  <div class="home">
    <MbTabs />
    <div v-for="swatch in swatches" class="swatch" :class="[swatch]" :key="swatch">Aa</div>
  </div>
</template>

<script>
// @ is an alias to /src
import MbTabs from '@/components/MbTabs.vue';

export default {
  name: 'Home',
  data: () => ({
    swatches: [
      'accent',
      'accent-secondary',
      'text',
      'text-secondary',
      'text-tertiary',
      'bg',
      'bg-secondary',
      'bg-tertiary',
      'negative',
      'negative-saturated',
      'positive',
      'positive-saturated',
      'warning',
      'warning-saturated',
    ],
  }),
  components: {
    MbTabs,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'

.home
  .swatch
    display: inline-flex
    width: 4rem
    height: @width
    border-radius: (@width / 2)rem
    border: 1px solid $bg-tertiary
    justify-content: center
    align-items: center
    margin: 1rem

    &.accent
      background-color: $accent
      color: $bg

    &.accent-secondary
      background-color: $accent-secondary

    &.text
      background-color: $text
      color: $bg

    &.text-secondary
      background-color: $text-secondary

    &.text-tertiary
      background-color: $text-tertiary

    &.bg
      background-color: $bg

    &.bg-secondary
      background-color: $bg-secondary

    &.bg-tertiary
      background-color: $bg-tertiary

    &.negative
      background-color: $negative

    &.negative-saturated
      background-color: $negative-saturated
      color: $bg

    &.positive
      background-color: $positive

    &.positive-saturated
      background-color: $positive-saturated
      color: $bg

    &.warning
      background-color: $warning

    &.warning-saturated
      background-color: $warning-saturated

</style>
