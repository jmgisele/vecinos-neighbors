<template lang="html">
  <div class="edit-content">
    <header>
      <div class="left">
        <h1>{{contentName}}</h1>
        <MbChip :color="status.color" :label="status.message" :loading="status.loading" />
      </div>
      <div class="right">
        <MbButton :dark="dark" icon="settings" @click="showSettings = true">{{isTablet ? '' : 'Settings'}}</MbButton>
        <MbButton :dark="dark" :icon="showPreview ? 'hide' : 'eye'" @click="showPreview = !showPreview">{{isTablet ? '' : showPreview ? 'Hide Preview' : 'Preview'}}</MbButton>
        <MbButton :dark="dark" :disabled="!wasChanged" icon="save" :icon-first="true" :loading="saveLoading" type="primary" @click="saveChanges">{{isTablet && !isMobile ? '' : 'Save'}}</MbButton>
      </div>
    </header>
    <MbTabs v-if="schema.tabs && schema.tabs.length > 1" v-model="activeTab" :dark="dark" :tabs="cleanTabs" />
    <TabContent :dark="dark" :show-split="showSplit" @split-close="showSplit = false" @split-closed="handleSplitClosed">
      <pre data-lang="content">{{content}}</pre>
      <pre data-lang="collection">{{collection}}</pre>
      <pre data-lang="schema">{{schema}}</pre>
    </TabContent>
  </div>
</template>

<script>
import { cloneDeep as _cloneDeep } from 'lodash-es';
import { status } from 'isomorphic-git';
import slugify from '@sindresorhus/slugify';
import * as matter from 'gray-matter';

import fs, { exists, PlainFS, joinPath, pathBasename, pathDirname } from '../fs'; // eslint-disable-line object-curly-newline

import loadProject from '../assets/js/loadProject';
import prettifyEntityName from '../assets/js/prettifyEntityName';
import Store from '../store';

import TabContent from '../components/utility/TabContent.vue';

function hasAccess(role, permissions) {
  if (!role || !permissions) return false;
  if (permissions.everybody && (permissions.everybody.includes('editContent') || permissions.everybody.includes('everything'))) return true;
  if (permissions[role] && (permissions[role].includes('editContent') || permissions[role].includes('everything'))) return true;
  return false;
}

export default {
  async beforeRouteEnter(to, from, next) {
    const { collection: collectionFile, id, path } = to.params;

    try {
      // Check if the user is allowed to edit schemas in the current project. To do that we currently need to load all users and the project itself if they aren’t currently loaded
      if (!Store.state.currentProject.id) { // currentProject is not loaded
        const { project, users, avatarUrl } = await loadProject(id, fs);
        Store.commit('setCurrentProject', {
          ...Store.state.currentProject,
          ...project,
          users,
          avatarUrl,
        });
      }

      const collection = JSON.parse(await fs.readFile(joinPath('/projects', Store.state.currentProject.id, '.mattrbld', 'collections', collectionFile), 'utf8'));
      let canAccess;

      if (!Store.getters.userInCurrentProject || !path.startsWith(joinPath('/projects', id, collection.dir))) canAccess = false; // somebody might try to pass a collection where they have edit rights, so we make sure the collection dir matches the content path
      else canAccess = hasAccess(Store.getters.userInCurrentProject.role, collection.permissions);

      if (!canAccess) return next({ name: 'Forbidden', replace: true });

      // load the content of the file
      let content;
      let fromBackup = false;

      if (Store.state.application.temporaryContentStorage) { // if we have a backup
        content = Store.state.application.temporaryContentStorage;
        fromBackup = true;
        Store.commit('setAppProperty', { key: 'temporaryContentStorage', value: null });
      } else {
        const rawFile = await fs.readFile(path, 'utf8');
        if (collection.type === 'json') content = JSON.parse(rawFile);
        else if (collection.type === 'md') {
          const { content: fileContent, data } = matter(rawFile);
          content = { ...data, content: fileContent.trim() }; // fileContent might have leading / trailing newline characters which we’ll strip out here
        }
      }
      const fileStatus = await status({ fs: PlainFS, dir: `/projects/${id}`, filepath: path.replace(`/projects/${id}/`, '') }); // filepath needs to be relative

      // check if the content already has a Schema assigned and load that as well
      let schema;
      if (content.___mb_schema) {
        try {
          schema = JSON.parse(await fs.readFile(joinPath('/projects', id, content.___mb_schema), 'utf8'));
        } catch (err) {
          if (err.code !== 'ENOENT') throw err;
          else Store.commit('addToast', { message: `The Schema “${prettifyEntityName(pathBasename(content.___mb_schema))}” could not be found in this project`, type: 'warning' });
        }
      }

      return next((vm) => {
        vm.collection = collection; // eslint-disable-line no-param-reassign
        vm.content = content; // eslint-disable-line no-param-reassign
        vm.fileStatus = fileStatus; // eslint-disable-line no-param-reassign
        vm.newContentName = prettifyEntityName(pathBasename(path)); // eslint-disable-line no-param-reassign
        if (schema) vm.schema = schema; // eslint-disable-line no-param-reassign
        if (fromBackup) vm.wasChanged = true; // eslint-disable-line no-param-reassign
      });
    } catch (err) {
      if (err.code === 'ENOENT') return next({ name: 'NotFound' });
      return next({ name: 'Error', params: { code: err.code, message: err.message, name: err.name } });
    }
  },
  async beforeRouteLeave() {
    if (this.forceNavigation) return true;
    if (this.wasChanged) {
      // Massive HACK, but the old way of just running next() as a Toast-Callback is beyond broken in router-next (I’ve created an issue, but apparently it’s the desired behavior)
      const timeout = 5000;
      let resolvePromise;

      const timeoutId = window.setTimeout(() => resolvePromise(false), timeout);

      this.$store.commit('addToast', {
        action: () => {
          window.clearTimeout(timeoutId);
          resolvePromise(true);
        },
        actionLabel: 'Discard changes',
        message: 'You have unsaved changes, do you want to discard them?',
        timeout: timeout - 200,
        type: 'warning',
      });

      const result = await new Promise((resolve) => {
        resolvePromise = resolve;
      });
      return result;
    } else return true; // eslint-disable-line no-else-return
  },
  beforeUnmount() {
    window.removeEventListener('beforeunload', this.preventUnintentionalClose);
  },
  components: {
    TabContent,
  },
  computed: {
    cleanTabs() {
      if (!this.schema.tabs) return [];
      return this.schema.tabs.map((tab) => tab.label);
    },
    contentName() {
      return prettifyEntityName(pathBasename(this.$route.params.path));
    },
    currentUser() {
      return this.$store.getters.userInCurrentProject;
    },
    isMobile() {
      return this.$store.state.application.mobile;
    },
    isTablet() {
      return this.$store.state.application.tablet;
    },
    status() {
      if (!this.fileStatus) return { color: 'warning', loading: true };
      if (this.fileStatus !== 'unmodified') return { color: 'warning', message: 'local changes' };
      return { color: 'positive', message: 'synchronised' };
    },
  },
  data() {
    return {
      activeTab: -1,
      content: {},
      collection: {},
      fileStatus: null,
      forceNavigation: false,
      newContentName: '',
      saveLoading: false,
      schema: {},
      showPreview: false,
      showSettings: false,
      showSplit: false,
      wasChanged: false,
    };
  },
  methods: {
    handleSplitClosed() {

    },
    preventUnintentionalClose(e) {
      if (this.forceNavigation) return;
      if (this.wasChanged) {
        this.$store.commit('addToast', {
          message: 'You have unsaved changes, save them before exiting if you don’t want to lose them.',
          type: 'warning',
          timeout: 10000,
        });
        e.preventDefault();
        e.returnValue = ''; // for chrome
      }
    },
    async renameContent() {
      if (this.newContentName === this.contentName) {
        this.showSettings = false;
        return;
      }
      this.validate('schemaName');
      if (this.errors.schemaName) return;

      const newName = slugify(this.newSchemaName, this.$store.state.currentProject.slugifyOptions || { lowercase: false, decamelize: false, preserveLeadingUnderscore: true });
      const newPath = joinPath(pathDirname(this.$route.params.path), `${newName}.json`);
      const alreadyExists = await exists(newPath);

      if (alreadyExists) {
        this.errors.schemaName = 'A schema with this name already exists';
        return;
      }

      await fs.rename(this.$route.params.path, newPath);
      this.$store.commit('removeLocallyChangedFile', this.$route.params.path);
      this.$store.commit('addLocallyChangedFile', newPath);
      this.showSchemaSettings = false;
      this.forceNavigation = true;
      this.$router.replace({ params: { id: this.$route.params.id, path: newPath } });
    },
    async saveChanges() {
      this.saveLoading = true;
      const valid = this.validateContent();

      if (valid) {
        try {
          let transformedContent;
          if (this.collection.type === 'json') transformedContent = JSON.stringify(this.content, null, 2);
          else if (this.collection.type === 'md') {
            const shallowClone = { ...this.content };
            delete shallowClone.content; // not needed in the frontmatter
            transformedContent = matter.stringify(this.content.content, shallowClone);
          }
          await fs.writeFile(this.$route.params.path, transformedContent, 'utf8');
          this.$store.commit('addToast', { message: `“${this.contentName}” was saved successfully`, type: 'positive' });
          this.wasChanged = false;
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while saving the file: ${err.message}`, type: 'error' });
        }
      } else {
        this.$store.commit('addToast', { message: 'At least one of the fields has errors, please fix them before saving.', type: 'negative' });
      }
      this.saveLoading = false;
    },
    validateContent() {
      // TODO: find a way to validate the entire content
      return '';
    },
  },
  mounted() {
    this.$nextTick(() => { // needed so the active indicator looks right
      this.activeTab = 0;
    });
  },
  props: {
    dark: Boolean,
  },
  watch: {
    currentUser(nv) {
      if (!nv || !hasAccess(nv.role, this.collection.permissions)) {
        if (this.wasChanged) {
          if (this.wasChanged) this.$store.commit('setAppProperty', { key: 'temporaryContentStorage', value: _cloneDeep(this.content) });
          this.forceNavigation = true;
        }
        this.$router.replace({ name: 'Forbidden' });
      }
    },
    wasChanged(nv) {
      if (nv) {
        window.addEventListener('beforeunload', this.preventUnintentionalClose);
        if (this.fileStatus === 'unmodified') this.fileStatus = '*modified';
      } else {
        window.removeEventListener('beforeunload', this.preventUnintentionalClose);
      }
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'

.edit-content // 100% minus the height of the app-header
  height: "calc(100vh - %s)" % (116 / 16)rem
  display: flex
  flex-direction: column
  user-select: none

  @media $tablet
    height: "calc(100vh - %s)" % (84 / 16)rem

  @media $mobile
    height: auto

  > header
    display: flex
    padding: 0 2rem 2rem 2rem

    @media $tablet
      padding: 1rem
      padding-top: 0

    @media $mobile
      display: block

    .left
      display: flex
      align-items: center
      margin-right: auto

      @media $tablet
        margin-left: 1rem

      @media $mobile
        margin-bottom: 1rem
        margin-left: 0

      h1
        margin: 0
        margin-right: 1.5rem
        margin-left: 1rem
        white-space: nowrap
        overflow: hidden
        text-overflow: ellipsis

        @media $tablet
          margin-left: 0

        @media $mobile
          font-size: 1.5rem
          margin-right: 0.5rem

      .chip
        @media $mobile
          order: -1
          width: 1rem
          height: @width
          padding: 0
          margin-right: 0.5rem

          &::v-deep(span)
            display: none

    .right
      display: flex
      align-items: center
      overflow: hidden
      margin-left: 1rem
      padding-bottom: 0.125rem

      @media $mobile
        margin-left: 0

      .button
        &:not(:last-child)
          margin-right: 1rem

  .tabs
    position: sticky
    top: 0
    z-index: 1

  .tab-content
    flex-grow: 1
</style>
