<template lang="html">
  <div class="file-list" :class="{ dark }">
    <header>
      <nav>
        <MbButton :dark="dark" :disabled="currentPath === root" icon="chevron-left" rounded @click="back" />
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
    <MbScroller class="folder-wrapper">
      <div v-for="folder in filteredFolders" class="folder" :class="{ 'no-actions': fileActions.length === 0 }" :key="folder.name" tabindex="0" @click="openFolder(folder.name, $event)" @contextmenu.prevent="openMenu($event, joinPath(currentPath, folder.name), true)">
        <header>
          <MbIcon icon="folder"  />
          <MbButton v-if="fileActions.length > 0" :dark="dark" icon="more-vertical" rounded tooltip="More" @click="openMenu($event, joinPath(currentPath, folder.name), true)" />
        </header>
        <p><span v-show="folder.localChanges" class="local-changes-indicator"/>{{folder.name}}</p>
        <p class="meta">{{formattedUpdatedAt(folder.updatedAt)}}</p>
      </div>
    </MbScroller>
    <p v-if="foldersFirst" class="h3">Files</p>
    <ul v-show="files.length > 0" class="files">
      <li v-for="file in filteredFiles" class="file" :class="{ 'no-actions': fileActions.length === 0 }" :key="file.name" tabindex="0" @click="file.isFolder ? openFolder(file.name, $event) : handleFileClick(file.name, $event)" @contextmenu.prevent="openMenu($event, joinPath(currentPath, file.name), file.isFolder)">
        <MbIcon :icon="file.isFolder ? 'folder' : imageRegExp.test(file.name) ? 'image' : 'document'" />
        <span v-show="file.localChanges" class="local-changes-indicator"/>
        <span>{{file.name}}</span>
        <span class="meta">{{formattedUpdatedAt(file.updatedAt)}}</span>
        <MbButton v-if="fileActions.length > 0" :dark="dark" icon="more-vertical" rounded tooltip="More" @click="openMenu($event, joinPath(currentPath, file.name), file.isFolder)" />
      </li>
    </ul>
    <p v-show="files.length === 0" class="empty-state">{{ foldersFirst ? 'There are no files in this directory' : 'There is nothing in this directory' }}</p>
    <MbContextMenu class="options" :dark="dark" :from-right="popover.fromRight" :options="popover.isFolder ? modifiedFolderActions : modifiedFileActions" :show="popover.show" :target="popover.target" :x="popover.x" :y="popover.y" @close="popover.show = false" />
  </div>
</template>

<script>
import { formatDistanceToNowStrict } from 'date-fns';

import fs from '../fs';

export default {
  computed: {
    breadcrumb() {
      const rootName = this.root.split('/').slice(-1)[0] || 'Root';
      if (this.currentPath === this.root) return [rootName];

      let steps;
      if (this.root !== '/') steps = this.currentPath.replace(this.root, '').split('/').slice(1);
      else steps = this.currentPath.split('/').slice(1);

      return [rootName, ...steps].slice(-4); // so it doesn’t get too long
    },
    filteredFiles() {
      return this.files.filter((file) => file.name.includes(this.searchTerm));
    },
    filteredFolders() {
      return this.folders.filter((folder) => folder.name.includes(this.searchTerm));
    },
    modifiedFileActions() { // we need to pass the current filepath to the callback and check if it’s applicable for this type
      const actions = [];

      if (this.fileActions.length === 0) return this.fileActions;

      this.fileActions.forEach((action) => {
        if (!action.foldersOnly) actions.push({ ...action, action: () => action.action(this.currentFile) });
      });

      return actions;
    },
    modifiedFolderActions() { // we need to pass the current filepath to the callback and check if it’s applicable for this type
      const actions = [];

      if (this.fileActions.length === 0) return this.fileActions;

      this.fileActions.forEach((action) => {
        if (!action.filesOnly) actions.push({ ...action, action: () => action.action(this.currentFile) });
      });

      return actions;
    },
    showBack() {
      return this.currentPath !== this.root;
    },
  },
  created() {
    this.sortBy = this.initialSortBy;
    this.reverseOrder = this.initialReverseSortOrder;
    this.currentPath = this.root;
    this.$store.commit('addLocallyChangedFile', '/projects/portfolio-v2');
  },
  data() {
    return {
      currentFile: null,
      currentPath: null,
      files: [],
      folders: [],
      imageRegExp: /\.(gif|jpg|jpeg|tiff|png|webp|svg)$/i,
      loading: false,
      popover: {
        isFolder: false,
        show: false,
        target: null,
        x: 0,
        y: 0,
      },
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
  emits: ['fileclick'],
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
    formattedUpdatedAt(updatedAt) {
      const distance = formatDistanceToNowStrict(updatedAt, { addSuffix: true });
      if (distance !== '0 seconds ago') return distance;
      return 'just now';
    },
    handleFileClick(name, e) {
      if (e.target.classList.contains('button')) return; // buttons have a ::before that covers them completely, so this is enough
      this.$emit('fileclick', this.joinPath(this.currentPath, name));
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
      let steps;
      if (this.root !== '/') steps = this.currentPath.replace(this.root, '').split('/');
      else steps = this.currentPath.split('/');
      // the index is a number between 0 and 3, representing the point clicked  in the breadcrumb (max-length: 4)
      // we want the path from the start of the path up to that number, but since the path might be longer than 4, we have to offset it by the difference
      // also the index has to be +1 because the end of slice() is non-inclusive
      const newPath = steps.slice(0, steps.length - Math.min(steps.length, 4) + index + 1);
      this.currentPath = this.joinPath(this.root, ...newPath.slice(1)); // strip the leading empty string (since currentPath always starts with a slash)
    },
    openFolder(name, e) {
      if (e.target.classList.contains('button')) return; // buttons have a ::before that covers them completely, so this is enough
      this.currentPath = this.joinPath(this.currentPath, name);
    },
    openMenu(e, path, isFolder) {
      if (this.popover.show) return; // close it first
      this.currentFile = path;
      if (e.type === 'contextmenu') {
        this.popover.x = e.clientX;
        this.popover.y = e.clientY;
        this.popover.fromRight = false;
      } else {
        const rect = e.target.getBoundingClientRect();
        this.popover.fromRight = true;
        this.popover.x = rect.right;
        this.popover.y = rect.top;
      }
      this.popover.isFolder = isFolder;
      this.popover.target = e.currentTarget;
      this.popover.show = true;
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
@require '../assets/styles/corners'

.file-list
  user-select: none

  &.dark
    header
      nav > .breadcrumb
        color: $text-secondary-dark
        span
          &.step:hover
            color: $text-dark

    .folder-wrapper .folder
      background-color: $bg-secondary-dark

      &:hover
        background-color: $bg-tertiary-dark

      p.meta
        color: $text-secondary-dark

    .files li
      background-color: $bg-secondary-dark

      &:hover
        background-color: $bg-tertiary-dark

      span.meta
        color: $text-secondary-dark

    .empty-state
      color: $text-secondary-dark

    .folder-wrapper .folder,
    .files li
      &:active
        background-color: $bg-dark

  header
    margin-bottom: 1rem
    nav
      display: flex
      align-items: center
      margin-bottom: 1rem

      .button
        margin-right: 0.5rem

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

            &.active
              color: $accent

            &:hover
              color: $text

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

  .folder-wrapper
    &::v-deep(.scroll-area)
      display: flex
      scroll-snap-type: x mandatory
      padding-bottom: 0.125rem

    .folder
      border: none
      background-color: $bg-secondary
      border-radius: $radius-m
      align-items: center
      padding-left: 1rem
      padding-top: 0.5rem
      padding-right: 0.5rem
      padding-bottom: 1rem
      white-space: nowrap
      cursor: pointer
      min-width: (192 / 16)rem
      scroll-snap-align: center
      transition: background-color 200ms ease

      &:not(:last-child)
        margin-right: 1rem

      &.no-actions
        padding-top: (0.5rem + (9 / 16))rem

      &:hover
        background-color: $bg-tertiary

      header
        display: flex
        align-items: center

        .icon:not(.button)
          margin-right: 1rem
          width: 2rem
          height: @width
          margin-right: auto
          color: $accent

      p
        margin-bottom: 0
        margin-right: 3rem
        font-weight: 700

        &:not(.meta) // ie the name
          display: flex
          align-items: center

        &.meta
          font-weight: 400
          margin-top: 0
          margin-bottom: 0
          font-size: 0.875rem
          color: $text-secondary

  > p.h3
    font-size: 1rem

  .files
    list-style: none
    padding: 0
    margin: 1.5rem 0

    li
      background-color: $bg-secondary
      padding: 0.5rem
      padding-left: 1rem
      border-radius: $radius-m
      display: flex
      align-items: center
      cursor: pointer
      transition: background-color 200ms ease

      &:hover
        background-color: $bg-tertiary

      &.no-actions
        padding-top: (0.5rem + (13 / 16))rem
        padding-bottom: @padding-top
        padding-right: (0.5rem + (13 / 16))rem

      &:not(:last-child)
        margin-bottom: 1rem

      .icon:not(.button)
        margin-right: 1rem

      span
        &.meta
          margin-left: auto
          font-size: 0.875rem
          color: $text-secondary

      .button
        margin-left: 1rem

  .empty-state
    color: $text-secondary
    margin-bottom: 0

  .folder-wrapper .folder,
  .files li
    position: relative

    &:focus::before
      opacity: 1

    &:active
      transform: translateY(0.125rem)
      background-color: $bg

    &::before
      content: ''
      position: absolute
      top: 0px
      left: @top
      right: @top
      bottom: @top
      border: 2px solid $accent
      opacity: 0
      border-radius: $radius-m
      z-index: 1
      pointer-events: none
      transition: opacity 200ms ease

    .local-changes-indicator
      width: 0.5rem
      height: @width
      border-radius: 50%
      background-color: $warning-saturated
      display: inline-block
      margin-right: 0.5rem
</style>
