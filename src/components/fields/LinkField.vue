<template lang="html">
  <section class="link field" :class="{ dark, localised: showLocalisedOptions }">
    <template v-if="!showLocalisedOptions">
      <span class="label" :class="{ dark, error }">{{error || label}}</span>
      <MbSegmentedSelector v-if="options.type === 'both'" v-model="linkType" :class="{ 'in-split': inSplit }" :dark="dark" :options="[{ label: 'Internal', value: 'internal' }, { label: 'External', value: 'external' }]" />
      <InternalLinkHelper v-if="linkType === 'internal'" :class="{ dark, error, 'in-split': inSplit }" :collections-path="collectionsPath" :dark="dark" :model-value="safeModelValue" :url-suffix="options.urlSuffix" :url-template="template" :use-file-path="options.byFilePath" @update:model-value="handleInput($event)" />
      <MbInput v-else :class="{ error, 'in-split': inSplit }" :dark="dark" icon="link" :model-modifiers="{ lazy: true }" :model-value="safeModelValue" placeholder="https://example.com" @update:model-value="handleInput" />
    </template>
    <LocalisedFieldsContainer
      v-else
      v-slot="{ lang }"
      :active="active"
      :dark="dark"
      :display-value="firstLocalisedValue"
      :error="error"
      :in-split="inSplit"
      :label="label"
      :languages="languages"
      :teleport-target="teleportTarget"
      @modal-closed="$emit('update:error', validateLocalisedValues(safeModelValue, ''))"
      @update:active="$emit('update:active', $event)"
    >
      <span class="label" :class="{ dark, error: error instanceof Map && error.get(lang) }">{{error instanceof Map && error.get(lang) || lang}}</span>
      <MbSegmentedSelector v-if="options.type === 'both'" v-model="linkType" :class="{ 'in-split': teleportTarget }" :dark="dark" :options="[{ label: 'Internal', value: 'internal' }, { label: 'External', value: 'external' }]" />
      <InternalLinkHelper v-if="linkType === 'internal'" :class="{ dark, error: error instanceof Map && error.get(lang), 'in-split': teleportTarget }" :collections-path="collectionsPath" :dark="dark" :lang="lang" :model-value="safeModelValue[lang]" :url-suffix="options.urlSuffix" :url-template="template" :use-file-path="options.byFilePath" @update:model-value="handleInput($event, lang)" />
      <MbInput v-else :class="{ error: error instanceof Map && error.get(lang), 'in-split': teleportTarget, 'in-modal': !teleportTarget }" :dark="dark" icon="link" :model-modifiers="{ lazy: true }" :model-value="safeModelValue[lang]" placeholder="https://example.com" @update:model-value="handleInput($event, lang)" />
    </LocalisedFieldsContainer>
  </section>
</template>

<script>
import { joinPath } from '../../fs';

import field from '../../mixins/field';

import InternalLinkHelper from '../utility/InternalLinkHelper.vue';
import LocalisedFieldsContainer from '../utility/LocalisedFieldsContainer.vue';

export default {
  components: {
    InternalLinkHelper,
    LocalisedFieldsContainer,
  },
  computed: {
    collectionsPath() {
      return joinPath('/projects', this.$route.params.id, '.mattrbld', 'collections');
    },
    firstLocalisedValue() {
      if (this.modelValue && Array.isArray(this.modelValue)) return this.modelValue.join(', ');
      if (this.modelValue && typeof this.modelValue === 'object') {
        const firstVal = Object.values(this.modelValue).find((value) => value);
        if (!firstVal) return null;
        if (Array.isArray(firstVal)) return firstVal.join(', ');
        return firstVal;
      }
      return this.modelValue || null;
    },
    safeModelValue() {
      if (this.showLocalisedOptions) {
        if (this.modelValue && typeof this.modelValue === 'object' && !Array.isArray(this.modelValue)) return this.modelValue;
        return this.languages.reduce((acc, lang, index) => {
          if (index === 0 && this.modelValue) acc[lang] = this.modelValue;
          else acc[lang] = null;
          return acc;
        }, {});
      }
      if (this.modelValue && typeof this.modelValue === 'object' && !Array.isArray(this.modelValue)) return Object.values(this.modelValue)[0] || null;
      return this.modelValue || null;
    },
    template() {
      if (this.options.byFilePath || !this.options.urlTemplate) return null;
      return this.options.urlTemplate;
    },
  },
  created() {
    if (this.options.type === 'external') this.linkType = 'external';
  },
  data() {
    return {
      linkType: 'internal',
    };
  },
  methods: {
    convertLocalisedValue(localised) {
      if (localised) {
        return this.languages.reduce((acc, lang, index) => {
          if (index === 0 && this.modelValue) acc[lang] = this.modelValue;
          else acc[lang] = null;
          return acc;
        }, {});
      }
      return Object.values(this.modelValue)[0] || null;
    },
  },
  mixins: [field],
  watch: {
    active(nv) {
      if (!nv) this.$emit('update:error', this.validateLocalisedValues(this.safeModelValue, ''));
    },
    'options.type': {
      handler(nv) {
        if (nv !== 'both') this.linkType = nv;
      },
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.link.field .input
  width: 100%
  margin-top: 0

.input
  &.in-modal,
  &.in-split
    width: 100%
    margin-top: 0

  &.in-split.dark
    background-color: $bg-tertiary-dark

.localisation-modal
  .input
    display: flex
    width: 100%
    margin-top: 0

    &.in-split.dark
      background-color: $bg-tertiary-dark

.label
  display: block
  font-size: 0.75rem
  margin-bottom: 0.25rem
  color: $text-secondary

  &:not(:first-child)
    margin-top: 2rem

  &.dark
    color: $text-secondary-dark

  &.error
    color: $negative-saturated

.segmented-selector
  margin-bottom: 0.5rem

  &.dark.in-split
    background-color: $bg-tertiary-dark
    box-shadow: 0 0 0 0.125rem @background-color

.internal-link-helper
  margin-bottom: 0.125rem

  &.error
    &::v-deep(.view.url::before)
      opacity: 1
      border-color: $negative

  &.in-split
    &::v-deep(.view.url.dark),
    &::v-deep(.collections ul > li.dark:not(.empty-state))
      background-color: $bg-tertiary-dark

      &:hover
        background-color: lighten($bg-tertiary-dark, 5)

    &::v-deep(.view.files.dark .file-list)
      header .actions .input
        background-color: $bg-tertiary-dark

      .files .file
        background-color: $bg-tertiary-dark

        &:hover
          background-color: lighten($bg-tertiary-dark, 5)
</style>
