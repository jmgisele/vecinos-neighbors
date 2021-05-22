<template lang="html">
  <section class="image field">
    <div class="display-wrapper" :class="{ active, dark, error: cleanError, 'in-split': inSplit, 'no-display-value': !localisedDisplayValue }" tabindex="0" @click="openDetails" @keyup.enter.space="openDetails" @keydown.space.prevent>
      <div class="image-wrapper" :class="{ dark }">
        <img v-if="image" class="hidden" draggable="false" :src="image" alt="Image not found" @load="$event.target.classList.remove('hidden')">
        <MbIcon v-else icon="image" />
      </div>
      <div class="left">
        <p class="label" :class="{ unstyled: !localisedDisplayValue }">{{cleanError || labelWithSizeHint}}</p>
        <p v-if="localisedDisplayValue || cleanError" class="content">{{localisedDisplayValue || labelWithSizeHint}}</p>
      </div>
      <MbIcon v-if="compact" :icon="active ? 'cross' : cleanError ? 'error' : 'pencil'" />
    </div>
    <MbModal class="image-data" :dark="dark" :title="labelWithSizeHint" :visible="showDetailsModal" @after-close="validateContent" @close="closeDetails" @keyup.ctrl.enter="closeDetails">
      <teleport v-if="!teleportTarget || active" :disabled="!teleportTarget" :to="teleportTarget">
        <h2 v-if="teleportTarget" class="h3 split-title">{{labelWithSizeHint}}</h2>
      </teleport>
      <template #actions>
        <MbButton :dark="dark" type="primary" @click="closeDetails">Done</MbButton>
      </template>
    </MbModal>
    <MbModal class="media-select-modal" :dark="dark" :style="{ width: '60rem' }" title="Select an image…" :visible="showSelectModal" @close="showSelectModal = false">
      <div v-if="!mediaSettings.dir" class="unconfigured-state" :class="{ dark }">
        <h2>The Media Library hasn’t been configured yet</h2>
        <p>In order to upload and add images to your content, the Media Library has to be configured. Please ensure an upload directory has been added in the Project Settings.</p>
      </div>
      <MbFileList v-else :action="uploadAction" :active-file="selectedFilePath" :dark="dark" file-list-label="Media Files" folders-first only-images pretty-filenames ref="fileList" :root="mediaDir" thumbnails @fileclick="handleFileClick" @path-change="currentPath = $event" />
      <template #actions>
        <MbButton :dark="dark" @click="showSelectModal = false">Cancel</MbButton>
        <MbButton v-if="options && options.removable" :dark="dark" :disabled="!modelValue" type="negative" @click="clearImage">Remove current image</MbButton>
      </template>
    </MbModal>
    <MbModal class="media-upload-modal" :dark="dark" :permanent="uploading" title="Upload image" :visible="showUploadModal" @close="showUploadModal = false">
      <transition mode="out-in">
        <div v-if="uploading" class="uploading">
          <MbLoader />
        </div>
        <div v-else class="dropzone" :class="{ dark, 'drag-active': dragActive }" @dragenter.prevent="dragActive = true" @dragover.prevent @dragleave="dragActive = false" @drop="handleDrop">
          <p :class="{ dark }">Drop image files here to upload them, or select some by clicking the button below</p>
          <MbButton :dark="dark" icon="upload" @click="selectFiles('modalFileInput')">Select files</MbButton>
          <input accept="image/*" type="file" ref="modalFileInput" @change="handleFileInput">
        </div>
      </transition>
      <template #actions>
        <MbButton :dark="dark" :disabled="uploading" @click="showUploadModal = false">Cancel</MbButton>
      </template>
    </MbModal>
  </section>
</template>

<script>
import fs, { joinPath } from '../../fs';

import validateContent from '../../assets/js/validateContent';

import { imageRegExp } from '../../data/regExps';

import field from '../../mixins/field';

export default {
  beforeUnmount() {
    if (this.image) URL.revokeObjectURL(this.image);
    window.removeEventListener('dragenter', this.handleWindowDragEnter);
    window.removeEventListener('dragover', this.preventWindowDragEvent);
    window.removeEventListener('dragleave', this.handleWindowDragLeave);
    window.removeEventListener('drop', this.preventWindowDragEvent);
  },
  computed: {
    cleanError() {
      if (!this.error) return '';
      if (typeof this.error === 'string') return this.error;
      return this.error.size === 1 ? 'A subfield has errors' : `${this.error.size} subfields have errors`;
    },
    labelWithSizeHint() {
      if (!this.options.resolutionHint) return this.label;
      return `${this.label} (${this.options.resolutionHint})`;
    },
    localisedDisplayValue() {
      if (!this.modelValue) return null;
      const displayValue = this.modelValue.src || this.modelValue;

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
      let uploadAllowed = false;
      if (!this.mediaSettings.permissions) uploadAllowed = true;
      if (this.mediaSettings.permissions && this.mediaSettings.permissions.everybody && (this.mediaSettings.permissions.everybody.includes('upload') || this.mediaSettings.permissions.everybody.includes('everything'))) uploadAllowed = true;
      if (this.mediaSettings.permissions && this.mediaSettings.permissions[this.$store.getters.userInCurrentProject.role] && (this.mediaSettings.permissions[this.$store.getters.userInCurrentProject.role].includes('upload') || this.mediaSettings.permissions[this.$store.getters.userInCurrentProject.role].includes('everything'))) uploadAllowed = true;

      if (uploadAllowed) {
        return {
          callback: () => { this.showUploadModal = true; },
          label: 'Upload',
          icon: 'upload',
          iconFirst: true,
          type: 'primary',
        };
      }
      return null;
    },
  },
  created() {
    if (typeof this.modelValue === 'string') this.fetchImage(this.modelValue);
  },
  data() {
    return {
      currentPath: '/',
      dragActive: false,
      image: null,
      showDetailsModal: false,
      showSelectModal: false,
      showUploadModal: false,
      uploading: false,
    };
  },
  methods: {
    clearImage() {
      this.$emit('update:modelValue', null);
      if (this.image) {
        URL.revokeObjectURL(this.image);
        this.image = null;
      }
      this.showSelectModal = false;
    },
    closeDetails() {
      if (!this.mediaSettings.advanced) {
        this.showSelectModal = false;
        return;
      }

      if (this.splitTarget) this.$emit('update:active', false);
      else this.showDetailsModal = false;
    },
    async fetchImage(path) {
      if (!path) return;
      const realPath = path.startsWith(this.projectsDir) ? path : joinPath(this.projectsDir, path);
      try {
        const rawImage = await fs.readFile(realPath);
        this.image = URL.createObjectURL(new Blob([rawImage], realPath.endsWith('.svg') ? { type: 'image/svg+xml' } : undefined));
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong when fetching the image thumbnail for ${this.label}: ${err.message}`, type: 'error' });
      }
    },
    handleDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      const [file] = e.dataTransfer.files;

      this.saveFile(file);
    },
    async handleFileClick(path) {
      if (!this.mediaSettings.advanced) this.handleInput(path.replace(this.projectsDir, ''));

      if (this.validation && this.validation.max) {
        try {
          const size = await fs.du(path);
          const sizeInMb = size / 1024 / 1024;

          if (sizeInMb > this.validation.max) this.$emit('update:error', 'The selected image is too large');
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong when reading the filesize in ${this.label}: ${err.message}`, type: 'error' });
        }
      }

      this.showSelectModal = false;
    },
    handleFileInput(e) {
      this.saveFile(e.currentTarget.files[0]);
      e.currentTarget.value = '';
    },
    handleWindowDragEnter(e) {
      e.preventDefault();
      if (this.uploadAction) this.showUploadModal = true; // uploadAction is null if we don’t have permission
    },
    handleWindowDragLeave(e) {
      e.preventDefault();

      if (this.showUploadModal && e.clientX === 0 && e.clientY === 0) this.showUploadModal = false; // clientX and clientY are 0 if outside of the window
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
      else this.showDetailsModal = true;
    },
    preventWindowDragEvent(e) {
      e.preventDefault();
    },
    async saveFile(file) {
      if (!imageRegExp.test(file.name)) {
        this.$store.commit('addToast', { message: `“${file.name}” was not uploaded because it is not an image`, type: 'warning' });
        this.dragActive = false;
        return;
      }

      if (this.validation && this.validation.max) {
        const sizeInMb = file.size / 1024 / 1024;
        if (sizeInMb > this.validation.max) {
          this.$store.commit('addToast', { message: `“${file.name}” was not uploaded because it is too large`, type: 'warning' });
          this.dragActive = false;
          return;
        }
      }

      this.uploading = true;
      try {
        const arrayBuffer = await file.arrayBuffer();
        const existingFiles = await fs.readdir(this.currentPath);
        const path = joinPath(this.currentPath, file.name);

        if (!arrayBuffer) {
          this.$store.commit('addToast', { message: `“${file.name}” was not uploaded because it is a folder`, type: 'warning' });
          this.dragActive = false;
          this.uploading = false;
          return;
        }

        if (existingFiles.includes(file.name)) {
          this.$store.commit('addToast', { message: `The file “${file.name}” was not uploaded because it already exists in this folder`, type: 'warning' });
          this.dragActive = false;
          this.uploading = false;
          return;
        }

        await fs.writeFile(path, arrayBuffer);

        this.$store.commit('addLocallyChangedFile', path);
        await this.$store.dispatch('saveAppData');
        this.handleInput(path.replace(this.projectsDir, ''));
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while saving a file in ${this.label}: ${err.message}`, type: 'error' });
      }

      this.uploading = false;
      this.dragActive = false;
      this.showUploadModal = false;
      this.showSelectModal = false;
      this.$refs.fileList.refresh();
    },
    selectFiles(inputRef) {
      this.$refs[inputRef].click();
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
    modelValue(nv, ov) {
      if (nv === null && this.image) {
        URL.revokeObjectURL(this.image);
        this.image = null;
      } else if (typeof nv === 'string' && (!ov || nv !== ov || nv !== ov.src)) {
        if (this.image) URL.revokeObjectURL(this.image);
        this.fetchImage(nv);
      }
    },
    showSelectModal(nv) {
      if (nv) {
        window.addEventListener('dragenter', this.handleWindowDragEnter);
        window.addEventListener('dragover', this.preventWindowDragEvent);
        window.addEventListener('dragleave', this.handleWindowDragLeave);
        window.addEventListener('drop', this.preventWindowDragEvent);
      } else {
        window.removeEventListener('dragenter', this.handleWindowDragEnter);
        window.removeEventListener('dragover', this.preventWindowDragEvent);
        window.removeEventListener('dragleave', this.handleWindowDragLeave);
        window.removeEventListener('drop', this.preventWindowDragEvent);
      }
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

  .file-list
    min-height: 50vh

.media-upload-modal
  .uploading,
  .dropzone
    &.v-enter-active,
    &.v-leave-active
      transition: opacity 200ms ease

      &.v-enter-from,
      &.v-leave-to
        opacity: 0

  .dropzone
    border: 0.125rem dashed $accent-secondary
    padding: 2rem
    text-align: center
    border-radius: $radius-l

    &.drag-active
      background-color: $bg-secondary

      &.dark
        background-color: $bg-secondary-dark

      .button
        visibility: hidden

    p
      color: $text-secondary
      margin-top: 0
      margin-bottom: 2rem
      pointer-events: none

      &.dark
        color: $text-secondary-dark

    input[type=file]
      display: none

  .uploading
    padding: 2rem
</style>
