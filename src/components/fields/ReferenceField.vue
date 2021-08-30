<template lang="html">
  <section class="reference field" :class="{ dark, localised: showLocalisedOptions }">
    <template v-if="!showLocalisedOptions">
      <span class="label" :class="{ dark, error }">{{error || label}}</span>
      <InternalLinkHelper :class="{ dark, error, 'in-split': inSplit }" :collections-path="collectionsPath" :dark="dark" :full-path="!template" :limit-to="options.collections" :model-value="safeModelValue" :removable="options.removable" :slugify="false" :url-template="template" :use-file-path="!template" @update:model-value="handleInput($event)" />
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
      <InternalLinkHelper :class="{ dark, error: error instanceof Map && error.get(lang), 'in-split': teleportTarget }" :collections-path="collectionsPath" :dark="dark" :full-path="!template" :lang="lang" :limit-to="options.collections" :model-value="safeModelValue[lang]" :removable="options.removable" :slugify="false" :url-template="template" :use-file-path="!template" @update:model-value="handleInput($event, lang)" />
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
      if (!this.options.field) return null;
      return `:${this.options.field}`;
    },
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
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.label
  display: block
  font-size: 0.75rem
  margin-bottom: 0.25rem
  color: $text-secondary

  &.dark
    color: $text-secondary-dark

  &.error
    color: $negative-saturated

.internal-link-helper
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
