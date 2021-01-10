<template lang="html">
  <div class="file-list" :class="{ dark }">
    <header>
      <nav>
        <MbButton :disabled="currentPath === root" icon="chevron-left" rounded @click="back" />
        <p class="breadcrumb">
          <template v-for="(step, index) in breadcrumb" :key="index">
            <span class="step" :class="{ active: index === breadcrumb.length - 1 }" @click="jumpTo(index)">{{step}}</span>
            <span v-if="index !== breadcrumb.length - 1" class="separator">/</span>
          </template>
        </p>
      </nav>
      <div class="actions">
        <MbInput v-if="filterable" v-model="searchTerm" :dark="dark" icon="search" label="Search current directory" type="search" />
        <span class="select-label">Sort by:</span>
        <MbSelect v-model="sortBy" :dark="dark" :options="sortOptions" @update:model-value="sortEntities" />
        <MbButton :dark="dark" :icon="reverseOrder ? 'arrow-up' : 'arrow-down'" :tooltip="{ position: 'right', message: reverseOrder ? 'Descending' : 'Ascending' }" @click="reverseOrder = !reverseOrder; sortEntities()"/>
        <MbButton v-if="action && (action.label || action.icon) && action.callback" :dark="dark" :icon="action.icon" :icon-first="action.iconFirst !== false" :loading="action.loading" :tooltip="action.tooltip" :type="action.type" @click="action.callback">{{action.label}}</MbButton>
      </div>
    </header>
    <p class="h3">Folders</p>
    <MbScroller>
      <button v-for="folder in filteredFolders" class="folder" :key="folder.name" @click="openFolder(folder.name)">
        <MbIcon icon="folder"  />
        {{folder.name}}
      </button>
    </MbScroller>
    <p class="h3">Files</p>
    <ul>
      <li v-for="file in filteredFiles" class="file" :key="file.name">
        <MbIcon :icon="file.isFolder ? 'folder' : imageRegExp.test(file.name) ? 'image' : 'document'" />
        {{file.name}}
      </li>
    </ul>
  </div>
</template>

<script>
import fs from '../fs';

export default {
  computed: {
    breadcrumb() {
      const rootName = this.root.split('/').slice(-1)[0] || 'Root';
      const steps = this.currentPath.replace(this.root, '').split('/').slice(1);

      if (steps.length === 0) return [rootName];
      return [rootName, ...steps].slice(-4); // so it doesn’t get too long
    },
    filteredFiles() {
      return this.files.filter((file) => file.name.includes(this.searchTerm));
    },
    filteredFolders() {
      return this.folders.filter((folder) => folder.name.includes(this.searchTerm));
    },
    showBack() {
      return this.currentPath !== this.root;
    },
  },
  created() {
    this.sortBy = this.initialSortBy;
    this.reverseOrder = this.initialReverseSortOrder;
    this.currentPath = this.root;
  },
  data() {
    return {
      currentPath: null,
      files: [],
      folders: [],
      imageRegExp: /\.(gif|jpg|jpeg|tiff|png|webp|svg)$/i,
      loading: false,
      searchTerm: '',
      sortBy: null,
      sortOptions: [
        {
          label: 'Name',
          value: 'name',
        },
        {
          label: 'Last Edited',
          value: 'edited',
        },
      ],
      reverseOrder: false,
    };
  },
  methods: {
    back() {
      if (this.currentPath === this.root) return;
      const newPath = this.currentPath.substring(0, this.currentPath.lastIndexOf('/'));
      this.currentPath = newPath || '/';
    },
    async fetchData() {
      try {
        const contents = await fs.readdir(this.currentPath);
        const statPromises = [];
        contents.forEach((entity) => statPromises.push(fs.stat(`${this.currentPath}/${entity}`)));
        const stats = await Promise.all(statPromises);
        const entities = contents.map((name, index) => ({
          isFolder: stats[index].isDirectory(),
          localChanges: this.$store.getters.hasLocalChanges(`${this.currentPath}/${name}`),
          name,
          size: stats[index].size,
          updatedAt: stats[index].mtimeMs,
        }));

        entities.sort((a, b) => {
          let nameA;
          let nameB;
          switch (this.sortBy) {
            case 'edited':
              if (!this.reverseOrder) return a.updatedAt - b.updatedAt;
              return b.updatedAt - a.updatedAt;
            case 'name':
            default:
              nameA = a.name.toUpperCase();
              nameB = b.name.toUpperCase();
              if (nameA > nameB) return !this.reverseOrder ? 1 : -1;
              if (nameA < nameB) return !this.reverseOrder ? -1 : 1;
              return 0;
          }
        });

        this.folders = [];
        this.files = [];
        if (this.foldersOnly && this.foldersFirst) this.folders = entities.filter((entity) => entity.isFolder && entity.name !== '.git');
        else if (this.foldersOnly && !this.foldersFirst) this.files = entities.filter((entity) => entity.isFolder && entity.name !== '.git');
        else if (!this.foldersFirst && this.showHidden) this.files = entities.filter((entity) => entity.name !== '.git');
        else if (!this.foldersFirst && !this.showHidden) this.files = entities.filter((entity) => !entity.name.startsWith('.'));
        else if (this.showHidden) {
          entities.forEach((entity) => {
            if (entity.isFolder && entity.name !== '.git') this.folders.push(entity);
            else if (!entity.isFolder) this.files.push(entity);
          });
        } else {
          entities.forEach((entity) => {
            if (entity.name.startsWith('.')) return;
            if (entity.isFolder) this.folders.push(entity);
            else this.files.push(entity);
          });
        }
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while reading files: ${err.message}`, type: 'error' });
      }
    },
    joinPath(...parts) { // taken from https://github.com/isomorphic-git/lightning-fs/blob/main/src/path.js
      if (parts.length === 0) return '';
      let path = parts.join('/');
      // Replace consecutive '/'
      path = path.replace(/\/{2,}/g, '/');
      return path;
    },
    jumpTo(index) {
      if (this.currentPath === this.root) return;
      const split = this.currentPath.split('/').slice(1);
      let newPath;
      // index is a number between 0 and 3 showing which of the last four items in split was clicked
      if (split.length < 4) newPath = split.slice(0, index + 1);
      else newPath = split.slice(0, split.length - (3 - index)); // no need for +1 since split.length includes that
      this.currentPath = `/${newPath.join('/')}`;
    },
    openFolder(name) {
      this.currentPath = this.joinPath(this.currentPath, name);
    },
    sortEntities(type) {
      if (!type || !['files', 'folders'].includes(type)) {
        this.sortEntities('files');
        if (this.foldersFirst) this.sortEntities('folders');
        return;
      }

      this[type].sort((a, b) => {
        let nameA;
        let nameB;
        switch (this.sortBy) {
          case 'edited':
            if (!this.reverseOrder) return a.updatedAt - b.updatedAt;
            return b.updatedAt - a.updatedAt;
          case 'name':
          default:
            nameA = a.name.toUpperCase();
            nameB = b.name.toUpperCase();
            if (nameA > nameB) return !this.reverseOrder ? 1 : -1;
            if (nameA < nameB) return !this.reverseOrder ? -1 : 1;
            return 0;
        }
      });
    },
  },
  props: {
    action: Object,
    dark: Boolean,
    fileActions: {
      type: Array,
      default: () => [],
    },
    filterable: {
      type: Boolean,
      default: true,
    },
    foldersFirst: {
      type: Boolean,
      default: true,
    },
    foldersOnly: Boolean,
    initialSortBy: {
      type: String,
      default: 'name',
    },
    initialReverseSortOrder: Boolean,
    root: {
      type: String,
      default: '/',
    },
    showHidden: Boolean,
  },
  watch: {
    currentPath(nv, ov) {
      if (nv !== ov) this.fetchData();
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'

.file-list
  user-select: none

  &.dark
    header
      > .breadcrumb
        color: $text-secondary-dark
        span
          &.step:hover
            color: $text-dark

  header
    nav
      display: flex
      align-items: center
      margin-bottom: 1rem

      .button
        margin-right: 1rem

      > .breadcrumb
        font-weight: 700
        color: $text-secondary
        white-space: nowrap
        overflow: hidden
        text-overflow: ellipsis
        margin: 0

        span
          &.step
            cursor: pointer
            transition: color 200ms ease

            &:hover
              color: $text

            &.active
              color: $accent

          &.separator
            margin: 0 0.5rem

    .actions
      display: flex
      align-items: center

      .input
        margin-top: 0
        margin-right: 1rem

      .select-label
        margin-left: auto
        margin-right: 0.5rem
        white-space: nowrap

      ::v-deep(.select)
        min-width: 10rem
        border-top-right-radius: 0
        border-bottom-right-radius: 0

        &::before
          border-top-right-radius: 0
          border-bottom-right-radius: 0

      .button.no-label
        margin-right: 1rem
        border: 0.0625rem solid $accent
        border-left: none
        border-top-left-radius: 0
        border-bottom-left-radius: 0

        &::before
          border-top-left-radius: 0
          border-bottom-left-radius: 0
</style>
