<template lang="html">
  <div class="file-picker" :class="{ dark }" tabindex="0" @click="activate" @keydown.space.prevent @keyup.space.enter="activate">
    <MbIcon :icon="mode === 'folder' ? 'folder' : 'document'" />
    <span class="label" :class="{ placeholder: !modelValue }">{{label}}</span>
    <MbButton v-if="removable" v-show="modelValue" :dark="dark" icon="cross" ref="removeButton" rounded tooltip="Clear path" @click="$emit('update:modelValue', null)" />
    <MbPopover center-x class="picker-popover" :dark="dark" no-content-padding ref="popover" :visible="showPicker" :x="popover.x" :y="popover.y" @close="deactivate">
      <div class="content-wrapper">
        <MbFileList :dark="dark" :filterable="false" :folders-first="mode === 'file'" :folders-only="mode === 'folder'" ref="fileList" :root="root" :show-hidden="true" :sortable="false" @fileclick="pickEntity" />
        <MbButton v-if="mode === 'folder'" class="create-button" :dark="dark" icon="plus" type="positive" @click="handleFolderCreation">Add Folder</MbButton>
      </div>
      <template #footer>
        <MbButton :dark="dark" @click="deactivate">Cancel</MbButton>
        <MbButton v-if="mode === 'folder'" :dark="dark" type="primary" @click="pickEntity($refs.fileList.currentPath)">Pick this folder</MbButton>
      </template>
    </MbPopover>
    <EntityCreationModal :dark="dark" only="directory" :path="currentPath" title="Add folder" :visible="showEntityCreationModal" @after-close="activate" @close="showEntityCreationModal = false" @entity-created="handleEntityCreated" />
  </div>
</template>

<script>
import EntityCreationModal from './utility/EntityCreationModal.vue';

export default {
  beforeUnmount() {
    window.removeEventListener('scroll', this.deactivate, { capture: true, passive: true });
  },
  components: {
    EntityCreationModal,
  },
  computed: {
    label() {
      if (this.modelValue) return this.modelValue;
      if (this.placeholder) return this.placeholder;
      return `Pick a ${this.mode}…`;
    },
  },
  data() {
    return {
      currentPath: null,
      popover: {
        x: 0,
        y: 0,
      },
      showEntityCreationModal: false,
      showPicker: false,
    };
  },
  emits: ['update:modelValue'],
  methods: {
    activate(e) {
      if (e && this.removable && (e.target === this.$refs.removeButton.$el || this.$refs.removeButton.$el.contains(e.target))) return;
      const rect = this.$el.getBoundingClientRect();
      const remBase = Number.parseInt(window.getComputedStyle(document.documentElement).fontSize, 10);
      this.popover.x = rect.left + rect.width / 2;
      this.popover.y = rect.bottom + 0.5 * remBase;
      window.addEventListener('scroll', this.deactivate, { capture: true, passive: true });
      this.showPicker = true;
    },
    deactivate(e) {
      if (e && e.type === 'scroll' && this.$refs.popover.$refs.el.contains(e.target)) return;
      window.removeEventListener('scroll', this.deactivate, { capture: true, passive: true });
      this.showPicker = false;
      this.$el.focus();
    },
    handleEntityCreated(name) {
      this.$refs.fileList.openFolder(name);
    },
    handleFolderCreation() {
      this.deactivate();
      this.currentPath = this.$refs.fileList.currentPath;
      this.showEntityCreationModal = true;
    },
    pickEntity(path) {
      this.$emit('update:modelValue', path);
      this.showPicker = false;
    },
  },
  props: {
    dark: Boolean,
    mode: {
      type: String,
      default: 'folder',
      validator: (v) => ['file', 'folder'].includes(v),
    },
    modelValue: String,
    placeholder: String,
    removable: Boolean,
    root: {
      type: String,
      default: '/',
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.file-picker
  position: relative
  border: none
  background-color: $bg-secondary
  color: inherit
  border-radius: $radius-m
  padding: 1rem
  padding-right: 1.5rem
  display: inline-flex
  align-items: center
  cursor: pointer
  transition: background-color 200ms ease
  user-select: none
  text-align: left
  white-space: nowrap
  max-width: 100%

  &:hover
    background-color: $bg-tertiary

  &:focus
    background-color: $bg-secondary

    &::before
      opacity: 1

  &:active
    transform: translateY(2px)

  &.dark
    background-color: $bg-secondary-dark

    &:hover
      background-color: $bg-tertiary-dark

    &:focus
      background-color: $bg-secondary-dark

    .label.placeholder
      color: $text-secondary-dark

  &::before
    content: ''
    position: absolute
    top: -1px
    left: @top
    right: @top
    bottom: @top
    box-shadow: inset 0 0 0 0.125rem $accent
    opacity: 0
    border-radius: @border-radius
    transition: opacity 200ms ease

  .label
    margin-left: 0.75rem
    overflow: hidden
    text-overflow: ellipsis

    &.placeholder
      color: $text-secondary

  .icon
    flex-shrink: 0

  .button.icon
    margin: -0.5rem
    margin-left: 0.5rem
    margin-right: -1rem
    padding: (8.5 / 16)rem

.picker-popover
  .content-wrapper
    padding: 0 1rem
    max-height: 30rem

    &::after
      content: ''
      height: 1rem
      display: block

    .create-button
      width: 100%
      margin-top: 1rem

    .file-list
      width: 20rem
      max-width: 100%

      @media $mobile
        height: auto

      &.dark
        &::v-deep(> header)
          background-color: $bg-secondary-dark

        &::v-deep(.file),
        &::v-deep(.folder)
          background-color: $bg-tertiary-dark

          &:active
            background-color: $bg-dark

      &::v-deep(> header)
        position: sticky
        top: 0
        z-index: 1
        background-color: $bg
        padding: 1rem
        margin-bottom: 0
        margin-left: -1rem
        margin-right: @margin-left

      &::v-deep(.empty-state)
        text-align: center
        margin: 2rem 0

      &::v-deep(.folder-scroller)
        margin-left: -1rem
        margin-right: -1rem

        .folder-wrapper
          padding-left: 1rem
          padding-right: @padding-left

          &::after
            content: ''
            width: 1rem
            flex-shrink: 0

</style>
