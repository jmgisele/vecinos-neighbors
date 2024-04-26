<template>
  <div class="field-candidate-item" :class="{ 'has-children': children && children.length > 0, dark }">
    <section class="field-candidate">
      <span>{{fieldKey}}</span>
      <MbIcon v-if="localised" icon="language"  />
      <MbSelect allow-null :dark="dark" :model-value="type" :options="typeCandidates" @update:model-value="$emit('typechange', $event)" />
    </section>
    <section v-if="children && children.length > 0" class="children">
      <FieldCandidateItem v-for="candidate in children" :children="candidate.children" :dark="dark" :field-key="candidate.key" :key="candidate.key" :localised="candidate.localised" :type="candidate.type" :type-candidates="candidate.typeCandidates" @typechange="candidate.type = $event" />
    </section>
  </div>
</template>

<script>
export default {
  name: 'FieldCandidateItem',
  data() {
    return {
    };
  },
  emits: ['typechange'],
  props: {
    children: Array,
    dark: Boolean,
    fieldKey: String,
    localised: Boolean,
    type: String,
    typeCandidates: Array,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.field-candidate-item
  &.has-children
    > .field-candidate
      background-color: $bg-secondary
      margin-bottom: 0
      padding: 0.5rem 0.5rem 0.5rem 1rem
      border: 0.0625rem solid $bg-tertiary
      border-bottom: none
      border-top-left-radius: $radius-m
      border-top-right-radius: $radius-m

    &.dark
      > .field-candidate
        border-color: $bg-tertiary-dark
        background-color: $bg-secondary-dark

  &.dark
    .children
      border-color: $bg-secondary-dark

  .field-candidate
    display: flex
    align-items: center

    .icon:not(.button)
      flex-shrink: 0
      margin: 0 1rem
      opacity: 0.5

    ::v-deep(.select)
      margin-left: auto
      min-width: 8rem

      @media $mobile
        min-width: auto

  .children
    border-bottom-left-radius: $radius-m
    border-bottom-right-radius: $radius-m
    border: 0.0625rem solid $bg-secondary
    padding: 0.5rem
    padding-left: 1rem
    padding-top: 1rem

    > .field-candidate-item:not(:last-child)
      margin-bottom: 1rem

</style>
