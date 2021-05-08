<template lang="html">
  <div class="collection">
    <h1>{{collection.name}}</h1>
    <MbFileList v-if="typeof collection.dir !== 'undefined'" :action="action" :dark="dark" :drafts-dir="draftsDir" :empty-state="emptyState" :file-actions="fileActions" :file-list-label="fileListLabel" :filetypes="['json']" pretty-filenames :root="collection.dir" @fileclick="handleFileClick" @list-change="listedFiles = $event.files" @path-change="currentPath = $event" />
    <MbButton v-if="userPermissions.has('createContent') && listedFiles === 0" :dark="dark" icon="plus" type="positive" @click="showEntityCreation = true">Create one</MbButton>
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
        vm.currentPath = collection.dir; // eslint-disable-line no-param-reassign
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
      this.currentPath = collection.dir;
      return true;
    } catch (err) {
      if (err.code === 'ENOENT') return { name: 'NotFound', query: { type: 'collection' }, replace: true };
      return { name: 'Error', replace: true };
    }
  },
  computed: {
    action() {
      if (this.userPermissions.has('everything') || this.userPermissions.has('createFolder') || this.userPermissions.has('createContent')) {
        let label;
        if (this.userPermissions.has('everything') || (this.userPermissions.has('createFolder') && this.userPermissions.has('createContent'))) label = 'Add';
        else if (this.userPermissions.has('createFolder')) label = 'Add folder';
        else if (this.userPermissions.has('createContent')) label = `Add ${pluralize.singular(this.collection.name)}`;

        return {
          callback: () => { this.showEntityCreation = true; },
          label,
          icon: 'plus',
          iconFirst: true,
          type: 'primary',
        };
      }
      return null;
    },
    draftsDir() {
      if (!this.collection.dir || !this.$store.state.currentProject.draftsDir) return null;
      return joinPath(this.$store.state.currentProject.draftsDir, 'collection', pathBasename(this.collection.dir));
    },
    fileActions() {
      const actions = [];

      if (this.userPermissions.has('everything')) {
        actions.push(
          {
            action: this.handleFileClick,
            label: 'Edit',
            icon: 'pencil',
            filesOnly: true,
          },
          {
            action: this.renameEntity,
            label: 'Rename',
            icon: 'text-input',
          },
          {
            action: this.moveEntity,
            label: 'Move',
            icon: 'arrow-right',
          },
        );

        if (this.draftsDir) actions.push({ action: this.toggleDraft, label: 'Toggle draft', icon: 'document-draft', filesOnly: true }); // eslint-disable-line object-curly-newline

        // so delete is always last
        actions.push(
          {
            action: this.deleteEntity,
            label: 'Delete',
            icon: 'trash',
            type: 'negative',
          },
        );

        return actions;
      }

      if (this.userPermissions.has('editContent')) {
        actions.push(
          {
            action: this.handleFileClick,
            label: 'Edit',
            icon: 'pencil',
            filesOnly: true,
          },
          {
            action: this.renameEntity,
            label: 'Rename',
            icon: 'text-input',
            filesOnly: !this.userPermissions.has('editFolder'),
          },
          {
            action: this.moveEntity,
            label: 'Move',
            icon: 'arrow-right',
            filesOnly: !this.userPermissions.has('editFolder'),
          },
        );
      } else if (this.userPermissions.has('editFolder')) {
        actions.push(
          {
            action: this.renameEntity,
            label: 'Rename',
            icon: 'text-input',
            foldersOnly: true,
          },
          {
            action: this.moveEntity,
            label: 'Move',
            icon: 'arrow-right',
            foldersOnly: true,
          },
        );
      }

      if (this.draftsDir && this.userPermissions.has('publishDrafts')) actions.push({ action: this.toggleDraft, label: 'Toggle draft', icon: 'document-draft', filesOnly: true }); // eslint-disable-line object-curly-newline

      if (this.userPermissions.has('deleteContent')) {
        actions.push(
          {
            action: this.deleteEntity,
            label: 'Delete',
            icon: 'trash',
            type: 'negative',
            filesOnly: !this.userPermissions.has('deleteFolder'),
          },
        );
      } else if (this.userPermissions.has('deleteFolder')) {
        actions.push(
          {
            action: this.deleteEntity,
            label: 'Delete',
            icon: 'trash',
            type: 'negative',
            foldersOnly: true,
          },
        );
      }

      return actions;
    },
    fileListLabel() {
      if (!this.collection.name) return 'Content Items';
      return pluralize.plural(this.collection.name);
    },
    userPermissions() {
      if (!this.collection.permissions) return new Set();

      const { role } = this.$store.getters.userInCurrentProject;

      return new Set([
        ...(this.collection.permissions.everybody || []),
        ...(this.collection.permissions[role] || []),
      ]);
    },
  },
  data() {
    return {
      collection: {},
      currentPath: null,
      emptyState: {
        empty: 'There’s no content in this Collection',
        noFiles: 'There are no content items in this folder',
        noFolders: 'There are no folders in this Collection',
      },
      entityBeingModified: null,
      listedFiles: 0,
      showEntityCreation: false,
      showEntityMove: false,
      showEntityRename: false,
    };
  },
  methods: {
    deleteEntity(path) {
      console.log(path);
    },
    handleFileClick(path) {
      console.log(path);
    },
    renameEntity(path) {
      console.log(path);
    },
    moveEntity(path) {
      console.log(path);
    },
    toggleDraft(path) {
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
    padding-bottom: 4rem

  @media $mobile
    padding-bottom: 2rem

  h1
    margin-top: 0

  .file-list
    max-width: (960 / 16)rem
    margin: 0 auto
    margin-top: 8rem
    margin-bottom: 1rem

    @media $tablet
      margin-top: 4rem

    @media $mobile
      margin-top: 2rem

    & + .button
      display: flex
      margin-left: auto
      margin-right: auto

</style>
