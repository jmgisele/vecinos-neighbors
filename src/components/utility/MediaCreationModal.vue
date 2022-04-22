<template lang="html">
  <MbModal class="media-creation-modal" :dark="dark" :permanent="type === 'uploading'" :title="title" :visible="visible" @after-close="resetEntityCreation" @close="$emit('close')">
    <MbSegmentedSelector v-if="permissions.has('everything') || (permissions.has('upload') && permissions.has('createFolder'))" :dark="dark" :model-value="type" :options="[{ label: 'Upload', value: 'upload' }, { label: 'Folder', value: 'directory' }]" @update:modelValue="$emit('update-type', $event)" />
    <transition mode="out-in">
      <div v-if="type === 'directory'" class="input-group">
        <MbInput v-model="newFolderName" :dark="dark" :error="newFolderError" icon="folder-add" label="Name" :max-len="255" ref="nameInput" @keyup.ctrl.enter="createFolder" @update:model-value="validateNewFolderName" />
        <p class="name-hint" :class="{ dark, hidden: !newFolderName || newFolderError }">Will be created as: <strong>{{slugifiedNewFolderName}}</strong></p>
      </div>
      <div v-else-if="type === 'uploading'" class="uploading">
        <MbLoader />
      </div>
      <div v-else class="dropzone" :class="{ dark, 'drag-active': dragActive }" @dragenter.prevent="dragActive = true" @dragover.prevent @dragleave="dragActive = false" @drop="handleDrop">
        <p :class="{ dark }">Drop image files here to upload them, or select some by clicking the button below</p>
        <MbButton :dark="dark" icon="upload" @click="selectFiles">Select files</MbButton>
        <input multiple type="file" ref="modalFileInput" @change="handleFileInput">
      </div>
    </transition>
    <template #actions>
      <MbButton :dark="dark" :disabled="type === 'uploading'" @click="$emit('close')">Cancel</MbButton>
      <transition>
        <MbButton v-if="type === 'directory'" :dark="dark" :disabled="!newFolderName || Boolean(newFolderError)" type="primary" @click="createFolder">Create</MbButton>
      </transition>
    </template>
  </MbModal>
</template>

<script>
import slugify from '@sindresorhus/slugify';
import { debounce } from 'lodash-es';
import fs, { joinPath } from '../../fs';

import getFilenameAndExtension from '../../assets/js/getFilenameAndExtension';

export default {
  computed: {
    slugifiedNewFolderName() {
      return slugify(this.newFolderName, this.$store.state.currentProject.slugifyOptions || { lowercase: false, decamelize: false, preserveLeadingUnderscore: true });
    },
  },
  data() {
    return {
      dragActive: false,
      newFolderError: '',
      newFolderName: '',
    };
  },
  emits: ['close', 'entity-created', 'update-type'],
  methods: {
    async createFolder() {
      await this.validateNewFolderName();

      if (this.newFolderError) return;

      const { newFolderName: name, currentPath: path } = this;

      try {
        await fs.mkdir(joinPath(path, name));
        this.$emit('entity-created');
        this.$emit('close');
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while creating the directory: ${err.message}`, type: 'error' });
      }
    },
    handleFileInput(e) {
      this.saveFiles([...e.currentTarget.files]);
      e.currentTarget.value = '';
    },
    handleDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      const files = [...e.dataTransfer.files];

      this.saveFiles(files);
    },
    resetEntityCreation() {
      this.dragActive = false;
      this.newFolderError = '';
      this.newFolderName = '';
      this.$emit('update-type', 'upload');
    },
    async saveFiles(files) {
      this.$emit('update-type', 'uploading');
      try {
        const arrayBuffers = await Promise.allSettled(files.map((file) => file.arrayBuffer()));
        const existingFiles = await fs.readdir(this.currentPath);
        const writePromises = [];

        files.forEach((file, index) => {
          const slugifiedFileName = this.slugifyFileName(file.name);
          if (!arrayBuffers[index].value) this.$store.commit('addToast', { message: `“${slugifiedFileName}” was not uploaded because it is a folder`, type: 'warning' });
          else if (existingFiles.includes(slugifiedFileName)) this.$store.commit('addToast', { message: `The file “${slugifiedFileName}” was not uploaded because it already exists in this folder`, type: 'warning' });
          else writePromises.push(fs.writeFile(joinPath(this.currentPath, slugifiedFileName), arrayBuffers[index].value));
        });

        await Promise.all(writePromises);

        files.forEach((file) => this.$store.commit('addLocallyChangedFile', joinPath(this.currentPath, this.slugifyFileName(file.name))));
        await this.$store.dispatch('saveAppData');
        this.$store.commit('addToast', {
          message: files.length === 1 ? `${this.slugifyFileName(files[0].name)} was uploaded successfully` : `${writePromises.length} files were uploaded successfully`,
          timeout: 2000,
          type: 'positive',
        });
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while saving files: ${err.message}`, type: 'error' });
      }

      this.dragActive = false;
      this.$emit('entity-created');
      this.$emit('close');
    },
    selectFiles() {
      this.$refs.modalFileInput.click();
    },
    slugifyFileName(name) {
      const { filename, extension } = getFilenameAndExtension(name);
      return `${slugify(filename, this.$store.state.currentProject.slugifyOptions || { lowercase: false, decamelize: false, preserveLeadingUnderscore: true })}.${extension}`;
    },
    validateNewFolderName: debounce(async function () { // eslint-disable-line func-names
      let existingEntities = [];
      try {
        existingEntities = await fs.readdir(this.currentPath);
      } catch (err) {
        // don’t do anything, it’ll fail and be handled when trying to create
      }

      if (!this.slugifiedNewFolderName) this.newFolderError = 'A name is required';
      else if (this.slugifiedNewFolderName.length > 255) this.newFolderError = 'Name is too long';
      else if (existingEntities.length > 0 && existingEntities.includes(this.slugifiedNewFolderName)) this.newFolderError = 'A folder with this name already exists';
      else this.newFolderError = '';
    }, 250, { leading: true }),
  },
  props: {
    currentPath: String,
    dark: Boolean,
    permissions: Set,
    title: String,
    type: String,
    visible: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.media-creation-modal
  .segmented-selector
    margin-bottom: 2rem

  .input-group,
  .dropzone,
  .button,
  .uploading
    &.v-enter-active,
    &.v-leave-active
      transition: opacity 200ms ease

      &.v-enter-from,
      &.v-leave-to
        opacity: 0

  .input-group
    .input
      width: 100%
      margin-bottom: 0.5rem

    .name-hint
      color: $text-secondary
      margin: 0
      font-size: 0.875rem
      transition: opacity 200ms ease

      &.dark
        color: $text-secondary-dark

      &.hidden
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
