<template lang="html">
  <MbModal class="entity-creation-modal" :dark="dark" slim :title="title" :visible="visible" @close="$emit('close')">
    <MbSegmentedSelector v-if="!only" v-model="entity" :dark="dark" :options="[{ label: 'File', value: 'file' }, { label: 'Folder', value: 'directory' }]" />
    <div class="input-group">
      <MbInput v-model="name" :class="{ 'no-extension': !showExtension }" :dark="dark" :error="nameError" :icon="entity === 'file' ? 'document-add' : 'folder-add'" label="Name" :max-len="255 - currentFileExtension.length + 1" @update:model-value="validateName" />
      <template v-if="showExtension">
        <span v-if="typeof fileExtension === 'string'" :class="{ dark }">.{{fileExtension}}</span>
        <MbSelect v-else v-model="currentFileExtension" :dark="dark" :options="fileExtension" tooltip="This extension will automatically be added to the filename" />
      </template>
    </div>
    <p class="name-hint" :class="{ dark, hidden: !name || nameError }">Will be created as: <strong>{{fullName}}</strong></p>
    <template #actions>
      <MbButton :dark="dark" @click="handleCancel">Cancel</MbButton>
      <MbButton :dark="dark" :disabled="!name && Boolean(nameError)" type="primary" @click="createEntity">Create</MbButton>
    </template>
  </MbModal>
</template>

<script>
import slugify from '@sindresorhus/slugify';
import { debounce } from 'lodash-es';

import fs, { joinPath } from '../../fs';

export default {
  computed: {
    fullName() {
      if (!this.fileExtension || !this.currentFileExtension || this.entity === 'directory') return slugify(this.name, this.$store.state.currentProject.slugifyOptions || { lowercase: false, decamelize: false, preserveLeadingUnderscore: true });
      return `${slugify(this.name, this.$store.state.currentProject.slugifyOptions || { lowercase: false, decamelize: false, preserveLeadingUnderscore: true })}.${this.currentFileExtension}`;
    },
    showExtension() {
      return this.fileExtension && this.entity !== 'directory';
    },
  },
  created() {
    if (this.only) this.entity = this.only;
    else this.entity = 'file';

    if (Array.isArray(this.fileExtension)) [this.currentFileExtension] = this.fileExtension;
    else if (typeof this.fileExtension === 'string') this.currentFileExtension = this.fileExtension;
  },
  data() {
    return {
      currentFileExtension: null,
      entity: null,
      name: '',
      nameError: '',
    };
  },
  emits: ['close'],
  methods: {
    cleanup() {
      this.name = '';
      this.nameError = '';
      this.currentFileExtension = null;
      this.entity = null;
    },
    async createEntity() {
      await this.validateName();

      if (this.nameError) return;

      if (this.entity === 'directory') {
        try {
          await fs.mkdir(joinPath(this.path, this.fullName));
          this.cleanup();
          this.$emit('close');
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while creating the directory: ${err.message}` });
        }
      } else {
        try {
          await fs.writeFile(joinPath(this.path, this.fullName), this.fileContent || '', 'utf8');
          this.cleanup();
          this.$emit('close');
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while creating the file: ${err.message}` });
        }
      }
    },
    handleCancel() {
      this.cleanup();
      this.$emit('close');
    },
    validateName: debounce(async function () { // eslint-disable-line func-names
      let existingEntities = [];
      try {
        existingEntities = await fs.readdir(this.path);
      } catch (err) {
        // don’t do anything, it’ll fail and be handled when trying to create
      }

      if (!slugify(this.name, this.$store.state.currentProject.slugifyOptions || { lowercase: false, decamelize: false, preserveLeadingUnderscore: true })) this.nameError = 'A name is required';
      else if (this.fullName.length > 255) this.nameError = 'Name is too long';
      else if (existingEntities.length > 0 && existingEntities.includes(this.fullName)) this.nameError = `A ${this.entity} with this name already exists`;
      else this.nameError = '';
    }, 250),
  },
  props: {
    dark: Boolean,
    fileContent: String,
    fileExtension: [String, Array],
    only: {
      type: String,
      validator: (v) => ['file', 'directory'].includes(v),
    },
    path: {
      type: String,
      default: '/',
    },
    title: {
      type: String,
      default: 'Create new…',
    },
    visible: Boolean,
  },
  watch: {
    only(nv) {
      if (nv) this.entity = nv;
      else this.entity = 'file';
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.entity-creation-modal
  .segmented-selector
    margin-bottom: 2rem

  .input-group
    white-space: nowrap
    display: flex
    align-items: stretch
    margin-bottom: 0.5rem

    .input
      border: none
      width: 100%
      margin-top: 0
      border-top-right-radius: 0
      border-bottom-right-radius: @border-top-right-radius

      &.no-extension
        border-top-right-radius: $radius-m
        border-bottom-right-radius: @border-top-right-radius

    span
      display: inline-block
      padding: 1rem
      background-color: $bg-secondary
      color: $text-secondary
      border-top-right-radius: $radius-m
      border-bottom-right-radius: @border-top-right-radius
      margin-left: 0.0625rem

      &.dark
        background-color: $bg-secondary-dark
        color: $text-secondary-dark

    ::v-deep(.select)
      border-top-left-radius: 0
      border-bottom-left-radius: @border-top-left-radius
      min-width: auto
      border: none
      background-color: $bg-secondary
      margin-left: 0.0625rem

      &.dark
        background-color: $bg-secondary-dark

        .label
          color: $text-secondary-dark

      .label
        color: $text-secondary

        &::before
          content: '.'

      &::before
        border-top-left-radius: inherit
        border-bottom-left-radius: inherit
        border: none
        box-shadow: inset 0 0 0 0.125rem $accent
        top: 0
        left: 0
        right: 0
        bottom: 0

  .name-hint
    color: $text-secondary
    margin: 0
    font-size: 0.875rem
    transition: opacity 200ms ease

    &.dark
      color: $text-secondary-dark

    &.hidden
      opacity: 0
</style>
