<template lang="html">
  <section class="color field" :class="{ dark, error, 'in-split': inSplit }">
    <span>{{label}}:</span>
    <MbColorPicker :class="{ error }" :dark="dark" :data-error="error" :format="options.format" :model-value="modelValue" :palette="palette" :palette-only="options.paletteOnly" :removable="options.removable" @update:model-value="handleInput" />
  </section>
</template>

<script>
import field from '../../mixins/field';

export default {
  computed: {
    palette() {
      let palette = [];

      if (this.options.useBrandPalette) palette = palette.concat(this.$store.state.currentProject.brandColors);
      if (this.options.palette) palette = palette.concat(this.options.palette);
      return palette;
    },
  },
  mixins: [field],
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.color.field
  display: flex
  align-items: center

  &.in-split.dark
    > .color-picker
      background-color: $bg-tertiary-dark

      &:hover
        background-color: lighten($bg-tertiary-dark, 5)

      &:active
        background-color: $bg-secondary-dark

  > span
    margin-right: auto

  > .color-picker
    margin-left: 1rem

    &.error
      &:not(:focus)::before
        opacity: 1
        border-color: $negative

      &::after
        content: attr(data-error)
        position: absolute
        top: -1.125rem
        left: $radius-m
        font-size: 0.75rem
        color: $negative-saturated
</style>
