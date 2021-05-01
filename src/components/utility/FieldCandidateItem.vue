<template lang="html">
  <div class="field-candidate-item" :class="{ dark }">
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
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.field-candidate-item
  padding: 1rem
  border-radius: $radius-m
  border: 0.0625rem solid alpha($text, 0.1)

  &.dark
    border-color: alpha($text-dark, 0.1)

  .field-candidate
    display: flex
    align-items: center

    .icon:not(.button)
      flex-shrink: 0
      margin: 0 1rem
      opacity: 0.5

    ::v-deep(.select)
      margin-left: auto

  .children
    margin-top: 1rem

    > .field-candidate-item:not(:last-child)
      margin-bottom: 1rem

</style>
