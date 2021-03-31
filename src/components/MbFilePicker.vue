<template lang="html">
  <div class="file-picker" :class="{ dark }" tabindex="0" @click="activate" @keydown.space.prevent @keyup.space.enter="activate">
    <MbIcon :icon="mode === 'folder' ? 'folder' : 'document'" />
    <span class="label" :class="{ placeholder: !modelValue }">{{label}}</span>
    <MbButton v-if="removable" v-show="modelValue" :dark="dark" icon="cross" ref="removeButton" rounded tooltip="Clear path" @click="$emit('update:modelValue', null)" />
    <MbModal class="picker-modal" :dark="dark" :title="`Pick a ${mode}…`" :visible="showPicker" @close="showPicker = false">
      <MbFileList :action="mode === 'folder' ? { callback: (path) => { currentPath = path; showEntityCreationModal = true; }, label: 'Add', icon: 'plus', type: 'positive'} : undefined" :dark="dark" :filterable="false" :folders-first="mode === 'file'" :folders-only="mode === 'folder'" ref="fileList" :root="root" :show-hidden="true" @fileclick="pickEntity" />
      <template #actions>
        <MbButton :dark="dark" @click="showPicker = false">Cancel</MbButton>
        <MbButton v-if="mode === 'folder'" :dark="dark" type="primary" @click="pickEntity($refs.fileList.currentPath)">Pick this folder</MbButton>
      </template>
    </MbModal>
    <EntityCreationModal :dark="dark" only="directory" :path="currentPath" title="Add folder" :visible="showEntityCreationModal" @close="showEntityCreationModal = false" @entity-created="handleEntityCreated" />
  </div>
</template>

<script>
import EntityCreationModal from './utility/EntityCreationModal.vue';

export default {
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
      showEntityCreationModal: false,
      showPicker: false,
    };
  },
  emits: ['update:modelValue'],
  methods: {
    activate(e) {
      if (this.removable && (e.target === this.$refs.removeButton.$el || this.$refs.removeButton.$el.contains(e.target))) return;
      this.showPicker = true;
    },
    handleEntityCreated() {
      this.$refs.fileList.refresh();
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

.picker-modal
  .file-list
    margin-top: 0.0625rem
    height: (624 / 16)rem
    max-height: 100%

    @media $mobile
      height: auto
</style>
