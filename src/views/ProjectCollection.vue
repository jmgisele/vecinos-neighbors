<template lang="html">
  <div class="collection">
    <h1>{{collection.name}}</h1>
    <MbFileList v-if="typeof collection.dir !== 'undefined'" :action="action" :dark="dark" :drafts-dir="draftsDir" :empty-state="emptyState" :file-actions="fileActions" :file-list-label="fileListLabel" :filetypes="['json']" pretty-filenames :root="collection.dir" @fileclick="handleFileClick" />
  </div>
</template>

<script>
import pluralize from 'pluralize';

import fs, { joinPath, pathBasename } from '../fs';

import prettifyEntityName from '../assets/js/prettifyEntityName';

export default {
  async beforeRouteEnter(to, from, next) {
    const { path } = to.params;

    if (!path) return next({ name: 'NotFound', query: { type: 'collection' }, replace: true });

    try {
      const collection = JSON.parse(await fs.readFile(path, 'utf8'));
      return next((vm) => {
        vm.collection = { ...collection, name: prettifyEntityName(pathBasename(path)) }; // eslint-disable-line no-param-reassign
      });
    } catch (err) {
      if (err.code === 'ENOENT') return next({ name: 'NotFound', query: { type: 'collection' }, replace: true });
      return next({ name: 'Error', params: { code: err.code, name: err.name, message: err.message }, replace: true });
    }
  },
  async beforeRouteUpdate(to) {
    const { path } = to.params;

    if (!path) return { name: 'NotFound', query: { type: 'collection' }, replace: true };

    try {
      const collection = JSON.parse(await fs.readFile(path, 'utf8'));
      this.collection = { ...collection, name: prettifyEntityName(pathBasename(path)) };
      return true;
    } catch (err) {
      if (err.code === 'ENOENT') return { name: 'NotFound', query: { type: 'collection' }, replace: true };
      return { name: 'Error', replace: true };
    }
  },
  computed: {
    action() {
      return null;
    },
    draftsDir() {
      if (!this.collection.dir) return null;
      return joinPath(this.$store.state.currentProject.draftsDir, 'collection', pathBasename(this.collection.dir));
    },
    fileActions() {
      return [];
    },
    fileListLabel() {
      if (!this.collection.name) return 'Content Items';
      return pluralize.plural(this.collection.name);
    },
  },
  data() {
    return {
      collection: {},
      emptyState: {
        empty: 'There’s no content in this Collection',
        noFiles: 'There are no content items in this folder',
        noFolders: 'There are no folders in this Collection',
      },
    };
  },
  methods: {
    handleFileClick(path) {
      console.log(path);
    },
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'

.collection
  overflow-x: hidden
  padding: 0 2rem 8rem 2rem

  @media $tablet
    padding-left: 1rem
    padding-right: 1rem

  h1
    margin-top: 0

  .file-list
    max-width: (960 / 16)rem
    margin: 8rem auto

    @media $tablet
      margin-top: 4rem
      margin-bottom: 4rem

    @media $mobile
      margin-top: 2rem
      margin-bottom: 4rem

</style>
