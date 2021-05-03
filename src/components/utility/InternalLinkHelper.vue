<template lang="html">
  <div class="internal-link-helper">
    <transition mode="out-in">
      <div v-if="view === 'url'" class="view url" :class="{ dark }" key="url" tabindex="0" @click="activate" @keydown.space.prevent @keyup.space.enter="activate">
        <MbIcon icon="document-link" />
        <span class="label" :class="{ placeholder: !modelValue }">{{modelValue || placeholder}}</span>
      </div>
      <div v-else-if="view === 'collections'" class="view collections" key="collections">
        <p>Linkable Collections</p>
        <ul>
          <li v-for="collection in linkableCollections" :class="{ dark }" :key="collection.value" tabindex="0" @click="handleCollectionClick(collection.value)" @keyup.space.prevent @keyup.space.enter="handleCollectionClick(collection.value)">
            <MbIcon icon="folder" />
            <span class="label">{{collection.label}}</span>
          </li>
          <li :class="{ dark }" tabindex="0" @click="view = 'url'" @keyup.space.prevent @keyup.space.enter="view = 'url'">
            <MbIcon icon="chevron-left" />
            <span class="label">Cancel</span>
          </li>
        </ul>
      </div>
      <div v-else-if="view === 'files'" class="view files" :class="{ dark }" key="files">
        <MbFileList :action="{ callback: () => view = 'url', label: 'Cancel', type: 'negative' }" :dark="dark" :empty-state="{ noFiles: 'There are no content items in this directory', noFolders: 'There are no folders in this directory', empty: 'There are no content items in this collection' }" file-list-label="Content Items" :filetypes="['json']" :folders-first="false" pretty-filenames :root="currentRoot" :sortable="false" @fileclick="handleFileClick" />
      </div>
      <div v-else-if="view === 'loading'" class="view loading" key="loading">
        <MbLoader />
      </div>
    </transition>
  </div>
</template>

<script>
import slugify from '@sindresorhus/slugify';
import { get } from 'lodash-es';
import { isValid } from 'date-fns';
import fs, { pathDirname } from '../../fs';

import prettifyEntityName from '../../assets/js/prettifyEntityName';

export default {
  data() {
    return {
      currentRoot: '/',
      linkableCollections: [],
      view: 'url',
    };
  },
  emits: ['update:modelValue'],
  methods: {
    async activate() {
      this.view = 'loading';
      await this.loadCollections();
      this.view = 'collections';
    },
    handleCollectionClick(dir) {
      this.currentRoot = dir;
      this.view = 'files';
    },
    async handleFileClick(path) {
      let newUrl;
      if (this.useFilePath || !this.urlTemplate) {
        const pathWithoutExtension = path.substring(0, path.lastIndexOf('.')); // we know there’s a .json at the end that we want to strip off, and since in the future we might also have .md or .yml / .yaml, let’s use this more ambiguous approach
        const fileRoot = pathDirname(this.currentRoot);
        newUrl = pathWithoutExtension.replace(fileRoot, '');
        if (typeof this.urlSuffix !== 'undefined') newUrl = `${pathWithoutExtension.replace(fileRoot, '')}${this.urlSuffix}`;
      } else {
        try {
          const fields = JSON.parse(await fs.readFile(path, 'utf8'));
          const hasParameters = /\[(year|month|day)\]/;
          newUrl = this.urlTemplate.replace(
            /:((?:\w|\.)+\[(?:year|month|day|[0-9])\]|(?:\w|\.)+)/g, // this regex matches any word, dot, or parameter in [] between : and a non-word character. It could probably be made more DRY, but I don’t know how
            (match, fieldKey) => { // passing replacer functions to string.replace is a powerful thing
              if (hasParameters.test(fieldKey)) { // we’re trying to get something out of a date
                const [rawKey, parameterWithBracket] = fieldKey.split('[');
                const parameter = parameterWithBracket.slice(0, -1);
                const value = get(fields, rawKey);
                const potentialDate = new Date(value); // if value is not a valid date, it’s not our problem
                if (isValid(potentialDate)) {
                  if (parameter === 'day') return String(potentialDate.getDate()).padStart(2, '0');
                  if (parameter === 'month') return String(potentialDate.getMonth() + 1).padStart(2, '0'); // months are zero-based
                  if (parameter === 'year') return String(potentialDate.getFullYear());
                }
                return 'invalid-date';
              }

              const value = get(fields, fieldKey);

              if (typeof value === 'object' && !Array.isArray(value)) { // it might be a localised field
                if (!this.lang) return 'undefined';
                const localisedValue = value[this.lang];
                if (localisedValue) return slugify(String(localisedValue), this.$store.state.currentProject.slugifyOptions || { lowercase: true, decamelize: true, preserveLeadingUnderscore: true });
                return 'undefined';
              }
              return slugify(String(value), this.$store.state.currentProject.slugifyOptions || { lowercase: true, decamelize: true, preserveLeadingUnderscore: true });
            },
          );
        } catch (err) {
          if (err.name === 'SyntaxError') {
            this.$store.commit('addToast', { message: 'The file you selected is not a valid JSON file', type: 'error' });
            return;
          }
          this.$store.commit('addToast', { message: `Something went wrong while reading the selected file: ${err.message}`, type: 'error' });
          return;
        }
      }
      this.$emit('update:modelValue', newUrl.replace(/\\\./g, '.')); // we’re replacing escaped dots here since that’s the only way to separate a dot from a property-path
      this.view = 'url';
    },
    async loadCollections() {
      if (this.linkableCollections.length > 0) return; // we don’t need to load them again
      try {
        const collectionFiles = await fs.readdir(this.collectionsPath);
        const collectionStrings = await Promise.all(collectionFiles.map((file) => fs.readFile(`${this.collectionsPath}/${file}`, 'utf8')));
        const collections = collectionStrings.map((collection) => collection && JSON.parse(collection)).filter((collection) => typeof collection !== 'undefined');
        this.linkableCollections = collections.reduce((acc, collection, index) => {
          if (collection.linkable && collection.dir) acc.push({ label: prettifyEntityName(collectionFiles[index]), value: collection.dir });
          return acc;
        }, []);
      } catch (err) {
        this.$store.commit('addToast', { message: `Somethin went wrong while fetching all linkable collections: ${err.message}`, type: 'error' });
      }
    },
  },
  props: {
    collectionsPath: {
      type: String,
      required: true,
    },
    dark: Boolean,
    lang: String,
    modelValue: String,
    placeholder: {
      type: String,
      default: 'Select a content item…',
    },
    urlSuffix: String,
    urlTemplate: String,
    useFilePath: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.internal-link-helper
  .view
    &.loading
      padding: 2rem 0

    &.collections
      p
        font-weight: bold
      ul
        margin: 0
        list-style: none

        > li:not(:last-child)
          margin-bottom: 0.5rem

    &.collections ul > li
    &.url
      position: relative
      border: none
      background-color: $bg-secondary
      color: inherit
      border-radius: $radius-m
      padding: 1rem
      padding-right: 1.5rem
      display: flex
      align-items: center
      cursor: pointer
      transition: background-color 200ms ease
      user-select: none
      text-align: left
      white-space: nowrap
      max-width: 100%
      overflow: hidden

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
        top: 0px
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
        margin-right: auto

        &.placeholder
          color: $text-secondary

      .icon
        flex-shrink: 0

    &.files
      .file-list::v-deep(header .actions)
        .input
          flex-grow: 1
          margin-right: 1rem

          @media $mobile
            margin-right: 0

        .button
          margin-left: 0

    &.v-enter-active,
    &.v-leave-active
      transition: opacity 200ms ease

      &.v-enter-from,
      &.v-leave-to
        opacity: 0
</style>
