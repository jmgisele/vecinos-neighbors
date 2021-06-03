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
          <li v-if="linkableCollections.length === 0" class="empty-state" :class="{ dark }">
            <p>There are no linkable collections in this project yet</p>
          </li>
          <li v-for="collection in linkableCollections" :class="{ dark }" :key="collection.value" tabindex="0" @click="handleCollectionClick(collection.value, collection.type)" @keydown.space.prevent @keyup.space.enter="handleCollectionClick(collection.value, collection.type)">
            <MbIcon icon="folder" />
            <span class="label">{{collection.label}}</span>
          </li>
          <li :class="{ dark }" tabindex="0" @click="view = 'url'" @down.space.prevent @keyup.space.enter="view = 'url'">
            <MbIcon icon="chevron-left" />
            <span class="label">Back</span>
          </li>
        </ul>
      </div>
      <div v-else-if="view === 'files'" class="view files" :class="{ dark }" key="files">
        <MbFileList :dark="dark" :empty-state="{ noFiles: 'There are no content items in this directory', noFolders: 'There are no folders in this directory', empty: 'There are no content items in this collection' }" file-list-label="Content Items" :filetypes="[filetype]" :folders-first="false" pretty-filenames :root="currentRoot" :sortable="false" @fileclick="handleFileClick" />
        <MbButton :dark="dark" icon="chevron-left" @click="linkableCollections.length === 1 ? view = 'url' : view = 'collections'">Back</MbButton>
      </div>
      <div v-else-if="view === 'loading'" class="view loading" key="loading">
        <MbLoader />
      </div>
    </transition>
  </div>
</template>

<script>
import * as matter from 'gray-matter';
import slugify from '@sindresorhus/slugify';
import { get } from 'lodash-es';
import { isValid } from 'date-fns';
import fs, { joinPath, pathBasename, pathDirname } from '../../fs';

import prettifyEntityName from '../../assets/js/prettifyEntityName';

export default {
  computed: {
    projectDir() {
      return this.collectionsPath.replace('/.mattrbld/collections', '');
    },
  },
  data() {
    return {
      currentRoot: '/',
      filetype: 'json',
      linkableCollections: [],
      view: 'url',
    };
  },
  emits: ['update:modelValue'],
  methods: {
    async activate() {
      this.view = 'loading';
      await this.loadCollections();
      if (this.linkableCollections.length === 1) this.handleCollectionClick(this.linkableCollections[0].value, this.linkableCollections[0].type);
      else this.view = 'collections';
    },
    handleCollectionClick(dir, type) {
      this.currentRoot = joinPath(this.projectDir, dir);
      this.filetype = type;
      this.view = 'files';
    },
    async handleFileClick(path) {
      let newUrl;
      if (this.useFilePath || !this.urlTemplate) {
        if (this.fullPath) newUrl = path.replace(this.projectDir, '');
        else {
          const pathWithoutExtension = path.substring(0, path.lastIndexOf('.')); // we know there’s a .json at the end that we want to strip off, and since in the future we might also have .md or .yml / .yaml, let’s use this more ambiguous approach
          const fileRoot = pathDirname(this.currentRoot);
          newUrl = pathWithoutExtension.replace(fileRoot, '');
          if (typeof this.urlSuffix === 'string') newUrl = `${newUrl}${this.urlSuffix}`;
        }
      } else {
        try {
          let fields;
          if (this.filetype === 'json') fields = JSON.parse(await fs.readFile(path, 'utf8'));
          else if (this.filetype === 'md') fields = matter(await fs.readFile(path, 'utf8')).data;

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

              if (value && typeof value === 'object' && !Array.isArray(value)) { // it might be a localised field
                if (!this.lang) return 'undefined';
                const localisedValue = value[this.lang];
                if (localisedValue) return this.slugify ? slugify(String(localisedValue), this.$store.state.currentProject.slugifyOptions || { lowercase: true, decamelize: true, preserveLeadingUnderscore: true }) : localisedValue;
                return 'undefined';
              }
              return this.slugify ? slugify(String(value), this.$store.state.currentProject.slugifyOptions || { lowercase: true, decamelize: true, preserveLeadingUnderscore: true }) : value;
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
        let collectionFiles;
        if (!this.limitTo || this.limitTo.length === 0) collectionFiles = await fs.readdir(this.collectionsPath);
        else collectionFiles = this.limitTo.map((path) => pathBasename(path));
        const collectionStrings = await Promise.all(collectionFiles.map((file) => fs.readFile(joinPath(this.collectionsPath, file), 'utf8')));
        const collections = collectionStrings.map((collection) => collection && JSON.parse(collection)).filter((collection) => typeof collection !== 'undefined');
        this.linkableCollections = collections.reduce((acc, collection, index) => {
          if (((this.limitTo && this.limitTo.length > 0) || collection.linkable) && collection.dir) acc.push({ label: prettifyEntityName(collectionFiles[index]), type: collection.type, value: collection.dir });
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
    fullPath: Boolean,
    lang: String,
    limitTo: Array,
    modelValue: String,
    placeholder: {
      type: String,
      default: 'Select a content item…',
    },
    slugify: {
      type: Boolean,
      default: true,
    },
    urlSuffix: String,
    urlTemplate: String,
    useFilePath: Boolean,
  },
  watch: {
    limitTo() {
      this.linkableCollections = [];
      this.loadCollections();
    },
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

    &.collections ul > li:not(.empty-state),
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
        border: 0.125rem solid $accent
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

    &.collections ul > li
      &.empty-state
        text-align: center
        color: $text-secondary

        &.dark
          color: $text-secondary-dark

        p
          font-weight: normal
          margin: 2rem 0

      &:last-child
        background-color: transparent
        border: 0.0625rem solid $accent
        padding: 1rem 2.5rem 1rem 1rem
        height: (52 / 16)rem
        margin-top: 1rem

        &.dark
          &:hover
            background-color: $bg-tertiary-dark

          &:active
            background-color: $bg-secondary-dark

        &:hover
          background-color: $bg-tertiary

        &:active
          background-color: $bg-secondary

        &::before
          top: -1px
          left: @top
          right: @top
          bottom: @top

        .label
          flex-grow: 1
          text-align: center

    &.files
      .file-list::v-deep(header .actions)
        .input
          flex-grow: 1
          max-width: none
          margin-right: 0

          @media $mobile
            margin-right: 0

        .button
          margin-left: 0

      .button
        width: 100%
        margin-top: 1rem

    &.v-enter-active,
    &.v-leave-active
      transition: opacity 200ms ease

      &.v-enter-from,
      &.v-leave-to
        opacity: 0
</style>
