<template lang="html">
  <div class="localised-fields-container" :class="{ dark, error, 'in-split': inSplit }" tabindex="0" @click="showModal = true" @keyup.enter.space="showModal = true" @keydown.space.prevent>
    <div class="left">
      <p class="label">{{errorMessage || `${label} (localised)`}}</p>
      <p class="content" :class="{ empty }">{{!empty ? displayValue : 'Not set'}}</p>
    </div>
    <MbIcon :icon="error ? 'error' : 'pencil'" />
    <MbModal class="localisation-modal" :dark="dark" :title="`${label} (localised)`" :visible="showModal" @close="showModal = false" @after-close="$emit('modal-closed')" @keyup.ctrl.enter="showModal = false">
      <teleport :disabled="!teleportTarget" :to="teleportTarget">
        <template v-for="lang in languages" :key="lang">
          <slot :lang="lang" />
        </template>
      </teleport>
      <template #actions>
        <MbButton :dark="dark" type="primary" @click="showModal = false">Done</MbButton>
      </template>
    </MbModal>
  </div>
</template>

<script>
export default {
  computed: {
    empty() {
      return this.displayValue === null || this.displayValue === '' || typeof this.displayValue === 'undefined';
    },
    errorMessage() {
      if (this.error && typeof this.error === 'string') return this.error;
      if (this.error && Object.values(this.error).some((value) => value)) return 'One or more subfields have errors';
      return '';
    },
  },
  data() {
    return {
      showModal: false,
    };
  },
  emits: ['modal-closed', 'modal-open'],
  props: {
    dark: Boolean,
    displayValue: {}, // could be anything
    error: [String, Object],
    inSplit: Boolean,
    label: String,
    languages: Array,
    teleportTarget: HTMLElement,
  },
  watch: {
    showModal(nv) {
      if (nv) this.$emit('modal-open');
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.localised-fields-container
  display: flex
  align-items: center
  background-color: $bg-secondary
  border-radius: $radius-m
  padding: 1rem
  overflow: hidden
  cursor: pointer
  position: relative
  transition: background-color 200ms ease

  &.dark
    background-color: $bg-secondary-dark

    &.in-split
      background-color: $bg-tertiary-dark

      &:hover
        background-color: lighten($bg-tertiary-dark, 5)

      &:active
        background-color: $bg-secondary-dark

    &:hover
      background-color: $bg-tertiary-dark

    &:active
      background-color: $bg-dark

    .left
      .label
        color: $text-secondary-dark

      .content.empty
        color: $text-tertiary-dark

  &.error
    &::before
      border-color: $negative
      opacity: 1

    &:focus-visible::before
      border-color: $accent

    .left .label,
    .icon
      color: $negative-saturated

  &:hover
    background-color: $bg-tertiary

  &:focus-visible,
  &:active
    &::before
      opacity: 1

  &:active
    transform: translateY(0.125rem)
    background-color: $bg

  &::before
    content: ''
    position: absolute
    top: 0px
    left: @top
    right: @top
    bottom: @top
    border: 0.125rem solid $accent
    opacity: 0
    border-radius: inherit
    z-index: 1
    pointer-events: none
    transition: opacity 200ms ease

  .left
    margin-right: 1rem
    overflow: hidden

    > p
      margin-top: 0
      margin-bottom: 0
      white-space: nowrap
      text-overflow: ellipsis
      overflow: hidden

    .label
      font-size: 0.875rem
      color: $text-secondary

    .content.empty
      color: $text-tertiary

  .icon
    flex-shrink: 0
    margin-left: auto

</style>
