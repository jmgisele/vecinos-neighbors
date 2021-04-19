<template lang="html">
  <div class="field-arrangement-item" :class="{ 'drag-active': $store.state.application.dragActive, dragging, 'hide-outline': hideOutline }">
    <div class="info" :class="{ active, dark }" @click="$emit('fieldclick')" @pointerdown.left="startDrag">
      <MbIcon class="drag-handle" icon="drag-handle" ref="dragHandle" />
      <div class="field-icon">
        <MbIcon :icon="icon" />
      </div>
      <span class="label"><strong>{{label}}</strong></span>
      <span v-if="localised" class="chip">Localised</span>
      <span v-if="required" class="chip">Required</span>
      <span class="key">{{fieldKey}}</span>
      <MbIcon v-if="hidden" class="hidden" icon="hide" />
      <MbIcon class="action" :icon="active ? 'cross' : 'pencil'" />
    </div>
    <FieldArrangementList v-if="nestedFields" :dark="dark" :field-being-edited="fieldBeingEdited" :fields="nestedFields" :parent-key="parentKey !== '___toplevel'  ? `${parentKey}.${fieldKey}` : fieldKey" />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';

export default {
  name: 'FieldArrangementItem',
  components: {
    FieldArrangementList: defineAsyncComponent(() => import('./FieldArrangementList.vue')),
  },
  computed: {
    isMobile() {
      return this.$store.state.application.mobile;
    },
  },
  data() {
    return {
      cloneClickDelta: null,
      dragging: false,
      draggingClone: null,
      hideOutline: false,
      lastEl: null,
      wasBottomHalf: null,
    };
  },
  emits: ['fieldclick', 'fieldmove'],
  methods: {
    handlePointerMove(e) {
      this.draggingClone.style.left = `${e.clientX - this.cloneClickDelta.x}px`;
      this.draggingClone.style.top = `${e.clientY - this.cloneClickDelta.y}px`;

      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || !el.dataset.index || !el.dataset.parent || el === this.dragging) return;
      const index = Number.parseInt(el.dataset.index, 10);
      const { parent } = el.dataset;

      if (parent !== this.parentKey) this.hideOutline = true;
      else this.hideOutline = false;

      if (el.classList.contains('empty-state')) { // if it’s empty we don’t need to check the position
        if (el === this.lastEl) return;
        this.$emit('fieldmove', { parent, index, dropzone: true });
        this.lastEl = el;
        return;
      }

      const elRect = el.getBoundingClientRect();
      const isBottomHalf = (e.clientY - elRect.top) > elRect.height / 2;

      if (el === this.lastEl && isBottomHalf === this.wasBottomHalf) return;

      if (isBottomHalf) this.$emit('fieldmove', { parent, index, isBottomHalf });
      else this.$emit('fieldmove', { parent, index });
      this.wasBottomHalf = isBottomHalf;
      this.lastEl = el;
    },
    startDrag(e) {
      if (this.isMobile && e.target !== this.$refs.dragHandle.$el && !this.$refs.dragHandle.$el.contains(e.target)) return; // only allow dragging on drag handle on mobile
      if (this.draggingClone) this.destroyClone();
      this.$store.commit('setAppProperty', { key: 'dragActive', value: true });
      this.dragging = e.currentTarget;
      const rect = e.currentTarget.getBoundingClientRect();
      const clone = e.currentTarget.cloneNode(true);
      this.cloneClickDelta = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      clone.style.position = 'fixed';
      clone.style.left = `${e.clientX - this.cloneClickDelta.x}px`;
      clone.style.top = `${e.clientY - this.cloneClickDelta.y}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.pointerEvents = 'none';
      clone.style.zIndex = 999;
      clone.style.margin = 0;
      document.body.append(clone);
      this.draggingClone = clone;
      const style = document.createElement('STYLE');
      style.innerText = '* { cursor: grabbing !important; }';
      style.id = 'fieldThumbnailGrabbingStyle';
      document.querySelector('head').append(style);
      window.addEventListener('pointerup', this.stopDrag);
      window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    },
    destroyClone() {
      this.draggingClone.remove();
      this.draggingClone = null;
      this.dragging = false;
      this.cloneClickDelta = null;
      this.hideOutline = false;
      this.lastEl = null;
      this.wasBottomHalf = null;
    },
    stopDrag() {
      window.removeEventListener('pointerup', this.stopDrag);
      window.removeEventListener('pointermove', this.handlePointerMove, { passive: true });
      document.getElementById('fieldThumbnailGrabbingStyle').remove();
      this.$store.commit('setAppProperty', { key: 'dragActive', value: false });
      const targetRect = this.dragging.getBoundingClientRect();
      const { left: currentLeft, top: currentTop } = this.draggingClone.style;
      if (this.hideOutline || (Number.parseInt(currentLeft, 10) === Math.floor(targetRect.left) && Number.parseInt(currentTop, 10) === Math.floor(targetRect.top))) {
        this.destroyClone();
        return;
      }
      this.draggingClone.style.transition = 'left 200ms ease, top 200ms ease';
      this.draggingClone.style.left = `${targetRect.left}px`;
      this.draggingClone.style.top = `${targetRect.top}px`;
      this.draggingClone.addEventListener('transitionend', this.destroyClone, { once: true });
    },
  },
  props: {
    active: Boolean,
    dark: Boolean,
    fieldBeingEdited: Object,
    fieldKey: String,
    hidden: Boolean,
    icon: {
      type: String,
      default: 'mattrbld',
    },
    label: {
      type: String,
      default: 'Unlabled field',
    },
    localised: Boolean,
    nestedFields: Array,
    parentKey: String,
    required: Boolean,
    type: {
      type: String,
      default: 'Unknown',
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.field-arrangement-item
  &.drag-active
    > .info
      pointer-events: none

  &.dragging
    border-radius: $radius-l
    box-shadow: inset 0 0 0 0.125rem $accent
    pointer-events: none

    > .info,
    > .field-arrangement-list
      opacity: 0

    > .field-arrangement-list
      transform: translateY(-2rem)

  &.hide-outline
    height: 0
    overflow: hidden

  .field-arrangement-list
    padding-top: 1rem // so it still counts as field space
    margin-right: 0.125rem
    margin-left: 2rem
    transition: opacity 200ms ease, transform 200ms ease

// needs to be outdented so the styles work on the clone
.info
  display: flex
  align-items: center
  padding: 1rem
  background-color: $bg-secondary
  border-radius: $radius-l
  cursor: pointer
  transition: background-color 200ms ease

  &:hover
    background-color: $bg

  &.dark
    background-color: $bg-secondary-dark

    &:hover
      background-color: $bg-tertiary-dark

    span
      &.chip
        background-color: $bg-dark

      &.key
        color: $text-secondary-dark

    .hidden
      color: $text-tertiary-dark

  &.active
    background-color: $accent
    color: $text-dark

    &:hover
      background-color: $accent-secondary

    .field-icon
      box-shadow: inset 0 0 0 0.0625rem $text-dark

    span
      &.chip
        background-color: $accent-secondary
        color: $text

      &.key
        color: $text-secondary-dark

    .hidden
      color: $text-tertiary-dark

  .drag-handle
    margin-right: 1rem
    cursor: move
    flex-shrink: 0
    touch-action: none

  .field-icon
    padding: 0.5rem
    background-color: $accent
    color: $text-dark
    border-radius: $radius-m
    margin-right: 1rem

    .icon
      display: block

  span
    white-space: nowrap
    overflow: hidden
    text-overflow: ellipsis

    &.label
      margin-right: 1rem

      @media $tablet
        margin-right: auto

    &.chip
      padding: (4 / 16)rem (12 / 16)rem
      background-color: $bg
      margin-right: 0.5rem
      border-radius: 1rem

      @media $tablet
        display: none

    &.key
      margin-left: auto
      margin-right: 0.5rem
      color: $text-secondary

      @media $tablet
        display: none

  .hidden
    flex-shrink: 0
    color: $text-tertiary
    margin: 0 0.5rem

  .action
    margin: 0 0.5rem
    flex-shrink: 0

    @media $mobile
      display: none
</style>
