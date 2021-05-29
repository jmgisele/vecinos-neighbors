<template lang="html">
  <section class="image field">
    <div class="display-wrapper" :class="{ active, dark, error: cleanError, 'in-split': inSplit, 'no-display-value': !displayValue }" tabindex="0" @click="openDetails" @keyup.enter.space="openDetails" @keydown.space.prevent>
      <div class="image-wrapper" :class="{ dark }">
        <img v-if="image" class="hidden" draggable="false" :src="image" alt="Image not found" @load="$event.target.classList.remove('hidden')">
        <MbIcon v-else icon="image" />
      </div>
      <div class="left">
        <p class="label" :class="{ unstyled: !displayValue }">{{cleanError || labelWithSizeHint}}</p>
        <p v-if="displayValue || cleanError" class="content">{{displayValue || labelWithSizeHint}}</p>
      </div>
      <MbIcon v-if="compact" :icon="active ? 'cross' : cleanError ? 'error' : 'pencil'" />
    </div>
    <MbModal v-if="mediaSettings.advanced" class="image-data" :dark="dark" :title="labelWithSizeHint" :visible="showDetailsModal" @after-close="handleModalClosed" @close="closeDetails" @keyup.ctrl.enter="closeDetails">
      <teleport v-if="!teleportTarget || active" :disabled="!teleportTarget" :to="teleportTarget">
        <h2 v-if="teleportTarget" class="h3 split-title">{{labelWithSizeHint}}</h2>
        <div class="image-details">
          <div class="thumbnail" :class="{ dark, empty: !modelValue || !modelValue.src }">
            <img v-show="image" :src="image" :alt="modelValue && modelValue.alt || 'Error loading file'" @load="setImageResolutionAndColor">
            <div class="button-wrapper">
              <MbButton dark :icon="modelValue ? 'replace-round' : 'plus'" @click="showSelectModal = true">{{ modelValue ? 'Replace image' : 'Add image'}}</MbButton>
              <MbButton v-if="options.removable && modelValue" dark icon="trash" type="negative" @click="handleInput(null)">Remove image</MbButton>
            </div>
          </div>
          <dl v-show="modelValue && modelValue.src" class="meta" :class="{ dark, 'in-split': teleportTarget }">
            <dl>
              <dt>Name:</dt>
              <dd>{{fileDetails.name}}</dd>
            </dl>
            <dl v-show="fileDetails.width !== null && fileDetails.height !== null">
              <dt>Resolution:</dt>
              <dd>{{fileDetails.width}}x{{fileDetails.height}}</dd>
            </dl>
            <dl v-show="fileDetails.dominantColor !== null">
              <dt>Color:</dt>
              <dd>
                <span class="color-indicator" :style="{ backgroundColor: fileDetails.dominantColor }" />
                <span class="color-code">{{fileDetails.dominantColor}}</span>
              </dd>
            </dl>
            <dl>
              <dt>Type:</dt>
              <dd>{{fileDetails.type}}</dd>
            </dl>
          </dl>
        <MbFieldsEditor v-show="modelValue && modelValue.src" :dark="dark" compact :error="error instanceof Map ? error : new Map()" :fields="$store.state.currentProject.media.customFields" :in-split="Boolean(teleportTarget)" :model-value="typeof modelValue === 'string' ? {} : modelValue" :languages="languages" @update:error="handleMetaError" @update:model-value="updateMeta" />
        </div>
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
import ColorThief from 'colorthief';
import { cloneDeep as _cloneDeep } from 'lodash-es';

import fs, {
  exists, joinPath, mkdirp, pathBasename, pathDirname,
} from '../../fs';

import generateDefaultContentFromSchema from '../../assets/js/generateDefaultContentFromSchema';
import rgbToHex from '../../assets/js/rgbToHex';
import validateContent from '../../assets/js/validateContent';

import { imageRegExp } from '../../data/regExps';

import field from '../../mixins/field';

const IMAGE_TOO_LARGE_ERROR = 'The selected image is too large';

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
      if (this.error instanceof Map && this.error.get(this.fieldKey)) return this.error.get(this.fieldKey);
      return this.error.size === 1 ? 'A subfield has errors' : `${this.error.size} subfields have errors`;
    },
    labelWithSizeHint() {
      if (!this.options.resolutionHint) return this.label;
      return `${this.label} (${this.options.resolutionHint})`;
    },
    displayValue() {
      if (!this.modelValue) return null;
      return this.modelValue.src || this.modelValue;
    },
    mediaDir() {
      if (!this.mediaSettings.dir) return null;
      return joinPath(this.projectsDir, this.mediaSettings.dir);
    },
    mediaSettings() {
      return this.$store.state.currentProject.media;
    },
    normalisedSrc() {
      if (this.modelValue && typeof this.modelValue === 'object') {
        if (this.modelValue.src && this.outputPath && this.modelValue.src.startsWith(this.outputPath)) return this.modelValue.src.replace(this.outputPath, this.mediaSettings.dir);
        return this.modelValue.src;
      }
      if (this.outputPath && this.modelValue && this.modelValue.startsWith(this.outputPath)) return this.modelValue.replace(this.outputPath, this.mediaSettings.dir);
      return this.modelValue;
    },
    outputPath() {
      return this.mediaSettings.outputPath;
    },
    projectsDir() {
      return joinPath('/projects', this.$store.state.currentProject.id);
    },
    selectedFilePath() {
      if (!this.normalisedSrc) return null;
      return joinPath(this.projectsDir, this.normalisedSrc);
    },
    uploadAction() {
      let uploadAllowed = false;
      if (!this.mediaSettings.permissions || this.userPermissions.has('everything') || this.userPermissions.has('upload')) uploadAllowed = true;

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
    userPermissions() {
      if (!this.mediaSettings.permissions || !this.$store.getters.userInCurrentProject) return new Set();

      const { role } = this.$store.getters.userInCurrentProject;

      return new Set([
        ...(this.mediaSettings.permissions.everybody || []),
        ...(this.mediaSettings.permissions[role] || []),
      ]);
    },
  },
  created() {
    if (this.normalisedSrc) this.fetchImage(this.normalisedSrc);
  },
  data() {
    return {
      currentPath: '/',
      dragActive: false,
      fileDetails: {
        dominantColor: null,
        height: null,
        name: null,
        type: null,
        width: null,
      },
      image: null,
      metaIsNew: false,
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
        if (err.code === 'ENOENT') this.$store.commit('addToast', { message: `The image for “${this.label}” could not be found. It may have been moved, renamed, or deleted and should be updated accordingly`, timeout: 10000, type: 'warning' });
        else this.$store.commit('addToast', { message: `Something went wrong when fetching the image thumbnail for ${this.label}: ${err.message}`, type: 'error' });
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
      else {
        let meta;
        const mediaMetaDir = joinPath(this.projectsDir, '.mattrbld', 'media');
        const pathInMediaDir = path.replace(this.mediaDir, '');
        try {
          const metadata = JSON.parse(await fs.readFile(joinPath(mediaMetaDir, `${pathInMediaDir}.json`), 'utf8'));
          meta = metadata;
        } catch (err) {
          if (err.code !== 'ENOENT') this.$store.commit('addToast', { message: `Something went wrong while reading the metadata for this file: ${err.message}`, type: 'error' });
          else {
            try {
              const mediaMetaDirExists = await exists(joinPath(mediaMetaDir, pathDirname(pathInMediaDir)));
              if (!mediaMetaDirExists) await mkdirp(joinPath(mediaMetaDir, pathDirname(pathInMediaDir)));
              const defaultMeta = generateDefaultContentFromSchema({ fields: this.mediaSettings.customFields }, path.replace(this.projectsDir, ''));
              await fs.writeFile(joinPath(mediaMetaDir, `${pathInMediaDir}.json`), JSON.stringify(defaultMeta, null, 2), 'utf8');
              this.$store.commit('addLocallyChangedFile', joinPath(mediaMetaDir, `${pathInMediaDir}.json`));
              this.$store.dispatch('saveAppData');
              meta = defaultMeta;
              this.metaIsNew = true;
            } catch (innerErr) {
              this.$store.commit('addToast', { message: `Something went wrong while creating the metadata file: ${innerErr.message}`, type: 'error' });
            }
          }
        }

        this.handleInput({ src: path.replace(this.projectsDir, ''), ...meta });
      }

      if (this.validation && this.validation.max) {
        try {
          const size = await fs.du(path);
          const sizeInMb = size / 1024 / 1024;

          if (sizeInMb > this.validation.max) this.$emit('update:error', (this.error instanceof Map ? _cloneDeep(this.error) : new Map()).set(this.fieldKey, IMAGE_TOO_LARGE_ERROR));
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
    handleInput(newVal) {
      const error = this.validate(newVal);
      const fieldError = this.error && this.error.get(this.fieldKey);

      if (error) {
        if ((fieldError && fieldError !== error) || (!fieldError && this.error)) this.$emit('update:error', _cloneDeep(this.error).set(this.fieldKey, error));
        else if (!fieldError && !this.error) this.$emit('update:error', new Map().set(this.fieldKey, error));
      } else if (fieldError && this.error) {
        const clone = _cloneDeep(this.error);
        clone.delete(this.fieldKey);
        this.$emit('update:error', clone.size > 0 ? clone : '');
      }

      let prefixedNewVal = newVal;
      if (newVal && this.outputPath) {
        if (typeof newVal === 'string') prefixedNewVal = newVal.replace(this.mediaSettings.dir, this.outputPath);
        else if (newVal.src) prefixedNewVal.src = newVal.src.replace(this.mediaSettings.dir, this.outputPath);
      }

      this.$emit('update:modelValue', prefixedNewVal);
    },
    handleMetaError(err) {
      if (!err || err.size === 0) this.$emit('update:error', '');
      else this.$emit('update:error', err);
    },
    async handleModalClosed() {
      this.validateContent();
      await this.$nextTick(); // wait a tick so this.error is up to date
      this.saveNewMeta();
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

      this.fileDetails.name = this.modelValue && this.modelValue.src && pathBasename(this.modelValue && this.modelValue.src);
      if (this.fileDetails.name) this.fileDetails.type = this.fileDetails.name.slice(this.fileDetails.name.lastIndexOf('.') + 1).toUpperCase();

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
        this.dragActive = false;
        this.showUploadModal = false;
        this.handleFileClick(path);
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while saving a file in ${this.label}: ${err.message}`, type: 'error' });
      }

      this.uploading = false;
      this.$refs.fileList.refresh();
    },
    async saveNewMeta() {
      if (!this.error && this.metaIsNew && (this.userPermissions.has('everything') || this.userPermissions.has('editMedia'))) {
        this.metaIsNew = false;
        const mediaMetaDir = joinPath(this.projectsDir, '.mattrbld', 'media');
        const pathInMediaDir = this.normalisedSrc.replace(this.mediaSettings.dir, '');
        const newMeta = _cloneDeep(this.modelValue);
        delete newMeta.src;
        await fs.writeFile(joinPath(mediaMetaDir, `${pathInMediaDir}.json`), JSON.stringify(newMeta, null, 2), 'utf8');
        this.$store.commit('addLocallyChangedFile', joinPath(mediaMetaDir, `${pathInMediaDir}.json`));
        this.$store.dispatch('saveAppData');
      }
    },
    selectFiles(inputRef) {
      this.$refs[inputRef].click();
    },
    setImageResolutionAndColor(e) {
      const img = e.target;
      this.fileDetails.width = img.naturalWidth;
      this.fileDetails.height = img.naturalHeight;

      try {
        const ct = new ColorThief();
        const c = ct.getColor(img, 10);
        this.fileDetails.dominantColor = rgbToHex(c);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.warn(err);
        // do nothing, it’s not that important
      }
    },
    updateMeta(newValue) {
      this.handleInput(newValue);
    },
    validateContent() {
      if (!this.normalisedSrc || typeof this.modelValue === 'string') return;
      const errors = validateContent(this.modelValue || {}, { fields: this.mediaSettings.customFields }, this.languages);
      if (this.error && this.error.get(this.fieldKey)) {
        if (errors.size === 0) return;
        this.$emit('update:error', new Map([...this.error, ...errors]));
      } else this.$emit('update:error', errors.size > 0 ? errors : '');
    },
  },
  mixins: [field],
  watch: {
    async active(nv) {
      if (!nv) {
        this.validateContent();
        await this.$nextTick(); // need to wait a tick so we have an up-to-date error
        this.saveNewMeta();
      }
    },
    modelValue(nv, ov) {
      if (nv === null) {
        if (this.image) URL.revokeObjectURL(this.image);
        this.fileDetails.dominantColor = null;
        this.fileDetails.height = null;
        this.fileDetails.name = null;
        this.fileDetails.type = null;
        this.fileDetails.width = null;
        this.image = null;
        if (this.error && this.error.get(this.fieldKey) === IMAGE_TOO_LARGE_ERROR) {
          const clone = _cloneDeep(this.error);
          clone.delete(this.fieldKey);
          this.$emit('update:error', clone.size > 0 ? clone : '');
        }
      } else if (typeof nv === 'string' && (!ov || nv !== ov || nv !== ov.src)) {
        if (this.image) URL.revokeObjectURL(this.image);
        this.fetchImage(this.normalisedSrc);
      } else if (typeof nv === 'object' && (!ov || !ov.src || nv.src !== ov.src)) {
        if (this.image) URL.revokeObjectURL(this.image);
        this.fileDetails.dominantColor = null;
        this.fileDetails.height = null;
        this.fileDetails.name = this.modelValue && this.modelValue.src && pathBasename(this.modelValue && this.modelValue.src);
        this.fileDetails.type = this.fileDetails.name.slice(this.fileDetails.name.lastIndexOf('.') + 1).toUpperCase();
        this.fileDetails.width = null;
        this.fetchImage(this.normalisedSrc);
        if (this.error && this.error.get(this.fieldKey)) {
          const clone = _cloneDeep(this.error);
          clone.delete(this.fieldKey);
          this.$emit('update:error', clone.size > 0 ? clone : '');
        }
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
      flex-shrink: 0
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

.image-details
  .thumbnail
    height: 16rem
    color: $text-dark
    display: flex
    align-items: center
    justify-content: center
    background-image: linear-gradient(to right, rgba(0,0,0,0.75), rgba(0,0,0,0.75)), linear-gradient(to right, black 50%, white 50%), linear-gradient(to bottom, black 50%, white 50%)
    background-size: 1.5rem 1.5rem
    background-blend-mode: normal, difference
    position: relative
    border-top-left-radius: $radius-l
    border-top-right-radius: @border-top-left-radius
    overflow: hidden

    @media $mobile
      height: 12rem

    &.dark
      background-image: linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,0.9)), linear-gradient(to right, black 50%, white 50%), linear-gradient(to bottom, black 50%, white 50%)

    &.empty
      border-bottom-left-radius: @border-top-left-radius
      border-bottom-right-radius: @border-bottom-left-radius

    img
      max-width: 100%
      max-height: 100%

    .button-wrapper
      position: absolute
      align-self: flex-end
      background-color: alpha($bg-dark, 0.8)
      width: 100%
      text-align: center

      .button
        margin: 0.5rem

  .meta
    background-color: $bg-secondary
    margin: 0
    padding: 1rem
    display: flex
    justify-content: center
    border-bottom-left-radius: $radius-l
    border-bottom-right-radius: @border-bottom-left-radius

    &.dark
      background-color: $bg-secondary-dark

      &.in-split
        background-color: $bg-tertiary-dark

      dl
        dt
          color: $text-secondary-dark

        dd .color-indicator
          box-shadow: inset 0 0 0 0.0625rem $text-tertiary-dark

    dl
      margin: 0
      overflow: hidden
      flex-shrink: 0

      &:first-child
          flex-shrink: 1

      &:not(:last-child)
        margin-right: 4rem

      dt,
      dd
        margin: 0
        white-space: nowrap
        overflow: hidden
        text-overflow: ellipsis

      dt
        color: $text-secondary
        font-size: 0.875rem

      dd
        .color-indicator
          vertical-align: middle
          margin-right: 0.5rem
          display: inline-block
          width: 1rem
          height: @width
          border-radius: 50%
          box-shadow: inset 0 0 0 0.0625rem $text-tertiary

        .color-code
          vertical-align: middle
          user-select: all

    @media $mobile
      display: block
      padding: 1rem
      border-bottom-left-radius: $radius-m
      border-bottom-right-radius: $radius-m

      dl:not(:last-child)
        margin-right: 0
        margin-bottom: 0.5rem
</style>
