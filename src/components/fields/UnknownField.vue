<template lang="html">
  <section class="unknown field" :class="{ dark }">
    <p>The field “{{label}}” is of an unknown type and cannot be displayed</p>
  </section>
</template>

<script>
import field from '../../mixins/field';

export default {
  mixins: [field],
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.unknown.field
  padding: 1rem
  border: 0.0625rem dashed $text-tertiary
  border-radius: $radius-l
  color: $text-secondary
  text-align: center

  &.dark
    color: $text-secondary-dark
    border-color: $text-tertiary-dark
</style>
