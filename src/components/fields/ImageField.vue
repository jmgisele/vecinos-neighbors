<template lang="html">
  <section class="image field">
    <div class="display-wrapper" :class="{ active, dark, error: cleanError, 'in-split': inSplit, 'no-display-value': !localisedDisplayValue }" tabindex="0" @click="openDetails" @keyup.enter.space="openDetails" @keydown.space.prevent>
      <div class="image-wrapper" :class="{ dark }">
        <img v-if="image" class="hidden" draggable="false" :src="image" alt="Image not found" @load="$event.target.classList.remove('hidden')">
        <MbIcon v-else icon="image" />
      </div>
      <div class="left">
        <p class="label" :class="{ unstyled: !localisedDisplayValue }">{{cleanError || label}}</p>
        <p v-if="localisedDisplayValue || cleanError" class="content">{{localisedDisplayValue || label}}</p>
      </div>
      <MbIcon v-if="compact" :icon="active ? 'cross' : cleanError ? 'error' : 'pencil'" />
    </div>
    <MbModal class="image-data" :dark="dark" :title="label" :visible="showModal" @after-close="validateContent" @close="closeDetails" @keyup.ctrl.enter="closeDetails">
      <teleport v-if="!teleportTarget || active" :disabled="!teleportTarget" :to="teleportTarget">
        <h2 v-if="teleportTarget" class="h3 split-title">{{label}}</h2>
      </teleport>
      <template #actions>
        <MbButton :dark="dark" type="primary" @click="closeDetails">Done</MbButton>
      </template>
    </MbModal>
    <MbModal class="media-select-modal" :dark="dark" :style="{ minHeight: '50vh', width: '60rem' }" title="Select an image…" :visible="showSelectModal" @close="showSelectModal = false">
      <div v-if="!mediaSettings.dir" class="unconfigured-state" :class="{ dark }">
        <h2>The Media Library hasn’t been configured yet</h2>
        <p>In order to upload and add images to your content, the Media Library has to be configured. Please ensure an upload directory has been added in the Project Settings.</p>
      </div>
      <MbFileList v-else :action="uploadAction" :active-file="selectedFilePath" :dark="dark" file-list-label="Media Files" folders-first pretty-filenames ref="fileList" :root="mediaDir" thumbnails @fileclick="handleFileClick" @path-change="currentPath = $event" />
    </MbModal>
  </section>
</template>

<script>
import { joinPath } from '../../fs';

import validateContent from '../../assets/js/validateContent';

import field from '../../mixins/field';

export default {
  beforeUnmount() {
    if (this.image) URL.revokeObjectURL(this.image);
  },
  computed: {
    cleanError() {
      if (!this.error) return '';
      return this.error.size === 1 ? 'A subfield has errors' : `${this.error.size} subfields have errors`;
    },
    localisedDisplayValue() {
      if (!this.displayField) return null;
      const displayValue = this.modelValue.alt || this.modelValue.title;

      if (displayValue !== null && typeof displayValue === 'object') return Object.values(displayValue).find((value) => value) || '';
      return displayValue;
    },
    mediaDir() {
      if (!this.mediaSettings.dir) return null;
      return joinPath(this.projectsDir, this.mediaSettings.dir);
    },
    mediaSettings() {
      return this.$store.state.currentProject.media;
    },
    projectsDir() {
      return joinPath('/projects', this.$store.state.currentProject.id);
    },
    selectedFilePath() {
      if (!this.modelValue || !this.modelValue.src) return null;
      return joinPath(this.projectsDir, this.modelValue.src || this.modelValue);
    },
    uploadAction() {
      return null;
    },
  },
  data() {
    return {
      currentPath: '/',
      image: null,
      showModal: false,
      showSelectModal: false,
    };
  },
  methods: {
    closeDetails() {
      if (!this.mediaSettings.advanced) {
        this.showSelectModal = false;
        return;
      }

      if (this.splitTarget) this.$emit('update:active', false);
      else this.showModal = false;
    },
    handleFileClick(path) {
      console.log(path);
    },
    openDetails() {
      if (this.active) {
        this.closeDetails();
        return;
      }

      if (!this.mediaSettings.advanced) {
        this.showSelectModal = true;
        return;
      }

      if (this.splitTarget) this.$emit('update:active', true);
      else this.showModal = true;
    },
    validateContent() {
      // TODO: check if advanced library and validate fields then, otherwise just validate image
      this.$emit('update:error', validateContent(this.modelValue || {}, { fields: [] }, this.languages));
    },
  },
  mixins: [field],
  watch: {
    active(nv) {
      if (!nv) this.validateContent();
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'
@require '../../assets/styles/fields'

.image.field
  .display-wrapper
    .image-wrapper
      width: 3rem
      height: @width
      display: flex
      align-items: center
      justify-content: center
      margin-right: 1rem
      color: $text-dark
      overflow: hidden
      border-radius: $radius-s
      background-image: linear-gradient(to right, rgba(0,0,0,0.75), rgba(0,0,0,0.75)), linear-gradient(to right, black 50%, white 50%), linear-gradient(to bottom, black 50%, white 50%)
      background-size: 1.5rem 1.5rem
      background-blend-mode: normal, difference

      &.dark
        background-image: linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,0.9)), linear-gradient(to right, black 50%, white 50%), linear-gradient(to bottom, black 50%, white 50%)

      .icon
        flex-shrink: 0
        margin-left: 0

      img
        display: block
        max-width: 100%
        max-height: 100%
        object-fit: cover
        transition: opacity 200ms ease

        &.hidden
          opacity: 0

.media-select-modal
  .unconfigured-state
    text-align: center
    color: $text-secondary
    max-width: 40rem
    margin-left: auto
    margin-right: auto

    &.dark
      color: $text-secondary-dark

    h2
      margin-top: 0
</style>
