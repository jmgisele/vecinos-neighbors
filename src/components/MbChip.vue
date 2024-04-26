<template>
  <div class="chip" :class="[color]">
    <transition mode="out-in">
      <MbInlineLoader v-if="loading" />
      <span v-else :key="label">{{label}}</span>
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
    };
  },
  props: {
    color: {
      type: String,
      default: 'accent',
      validator: (v) => ['accent', 'negative', 'positive', 'warning'].includes(v),
    },
    label: String,
    loading: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'

.chip
  padding: 0.5rem 0.75rem
  border-radius: 1rem
  background-color: $accent
  color: $text-dark
  white-space: nowrap
  overflow: hidden
  font-size: (12 / 16)rem
  font-weight: 700
  letter-spacing: 0.05em
  text-transform: uppercase
  vertical-align: middle
  display: inline-block
  line-height: 1
  transition: background-color 200ms ease

  &.negative
    background-color: $negative-saturated

  &.positive
    background-color: $positive-saturated

  &.warning
    color: $text-secondary
    background-color: $warning-saturated

    &.dark
      color: $text-dark

  .inline-loader
    height: (12 / 16)rem

  span
    display: block
    overflow: hidden
    text-overflow: ellipsis

    &.v-enter-active,
    &.v-leave-active
      transition: transform 200ms ease

      &.v-enter-from
        transform: translateY(-1.25rem)

      &.v-leave-to
        transform: translateY(1.25rem)
</style>
