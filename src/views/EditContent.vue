<template lang="html">
  <div class="edit-content">
    <header>
      <div class="left">
        <h1>{{contentName}}</h1>
        <MbChip :color="status.color" :label="status.message" :loading="status.loading" />
        <transition>
          <MbChip v-if="!isTablet && isDraft" label="draft" />
        </transition>
      </div>
      <div class="right">
        <MbToggle v-if="draftsDir && canToggleDraft" v-model="isDraft" :dark="dark" :disabled="isDraft && (!content.___mb_schema || errors.fields.size > 0)" :icons="['cross', 'check']">Draft</MbToggle>
        <MbButton :class="{ 'push-right': draftsDir }" :dark="dark" icon="settings" @click="showSettings = true">{{isTablet ? '' : 'Settings'}}</MbButton>
        <MbButton v-if="previewUrl" :dark="dark" :disabled="noSchema" :icon="showPreview ? 'hide' : 'eye'" @click="togglePreview">{{isTablet ? '' : showPreview ? 'Hide Preview' : 'Preview'}}</MbButton>
        <MbButton :dark="dark" :disabled="!wasChanged || (errors.fields.size > 0 && !isDraft)" icon="save" :icon-first="true" :loading="saveLoading" type="primary" @click="saveChanges">{{isTablet ? '' : 'Save'}}</MbButton>
      </div>
    </header>
    <MbTabs v-if="schema.tabs && schema.tabs.length > 1" v-model="activeTab" :dark="dark" :errors="tabErrors" :tabs="cleanTabs" />
    <TabContent :dark="dark" :padded="!showPreview" :show-split="showSplit" @split-close="showSplit = false" @split-closed="handleSplitClosed">
      <transition mode="out-in">
        <div v-if="initialised && noSchema" class="no-schema" :class="{ dark }">
          <h2>No Schema</h2>
          <p>This {{contentType}} doesn’t have a valid Schema assigned to it yet. Please select one from the list below.</p>
          <ul>
            <li v-for="schema in allowedSchemas" :key="schema.value">
              <MbButton :dark="dark" icon="document" @click="loadAndAssignSchema(schema.value)">{{schema.label}}</MbButton>
            </li>
          </ul>
        </div>
        <MbFieldsEditor v-else v-model="contentForTab" v-model:error="errors.fields" v-model:split-visible="showSplit" :class="{ 'preview-open': showPreview && !isMobile }" :compact="!showPreview" :dark="dark" :fields="fieldsForTab" :key="activeTab" :languages="contentLanguages" :split-target="!showPreview ? '#splitTarget' : null" @image-load="addPreviewImage" />
      </transition>

      <template #right="{ isModal }">
        <div v-if="showPreview" class="preview">
          <div v-if="errors.preview === 'offline'" class="error-state" :class="{ dark }">
            <MbIcon icon="offline-alt" />
            <h2>Could not open preview…</h2>
            <p>It looks like you are offline at the moment. Please establish an internet connection, so the preview can be displayed.</p>
            <MbButton :dark="dark">Try again</MbButton>
          </div>
          <div v-else-if="previewInNewTab" class="error-state" :class="{ dark }">
            <MbIcon icon="open-new-window" />
            <h2>Preview open in a different tab</h2>
            <p>It looks like the preview is open in a different tab or window.</p>
            <MbButton :dark="dark" @click="closeOpenPreview">Close</MbButton>
            <MbButton :dark="dark" @click="focusOpenPreview" type="primary">Focus</MbButton>
          </div>
          <teleport v-else :disabled="!fullscreenPreview" to="body">
            <div class="preview-frame" :class="{ fullscreen: fullscreenPreview, 'mobile-preview': mobilePreview }">
              <header :class="{ dark }">
                <MbButton :dark="dark" icon="open-new-window" tooltip="Open preview in new tab / window" @click="openPreviewInNewTab" />
                <MbButton :dark="dark" :icon="fullscreenPreview ? 'fullscreen-reverse' : 'fullscreen'" tooltip="Toggle fullscreen" @click="toggleFullscreenPreview" />
                <MbButton v-if="!isMobile" :dark="dark" :icon="mobilePreview ? 'monitor' : 'phone'" tooltip="Toggle mobile preview" @click="mobilePreview = !mobilePreview" />
              </header>
              <transition>
                <MbLoader v-if="!previewConnected" :class="{ dark }" />
              </transition>
              <iframe :class="{ mobile: mobilePreview }" name="preview" ref="preview" referrer="no-referrer" sandbox="allow-same-origin allow-scripts" :src="actualPreviewUrl" @load="handlePreviewLoaded" />
            </div>
          </teleport>
        </div>
        <div v-else :class="{ 'in-modal': isModal }" id="splitTarget" />
      </template>
    </TabContent>
    <MbModal class="edit-content-modal" :dark="dark" slim title="Content Settings" :visible="showSettings" @close="showSettings = false" @after-close="resetContentName">
      <MbInput v-model="newContentName" :dark="dark" :error="errors.name" icon="document" label="Name" @blur="validateNewContentName" />
      <div class="select-wrapper">
        <span>Content Schema:</span>
        <MbSelect :dark="dark" :disabled="allowedSchemas.length < 2" :model-value="newContentSchema || content.___mb_schema" :options="allowedSchemas" placeholder="Select a Schema…" @update:model-value="newContentSchema = $event" />
      </div>
      <MbHighlightBox v-if="canDelete" color="negative" :dark="dark" label="Danger Zone">
        <MbButton class="delete-button" :dark="dark" icon="trash" type="negative" @click="deleteContent">Delete “{{contentName}}”</MbButton>
      </MbHighlightBox>
      <template #actions>
        <MbButton :dark="dark" @click="showSettings = false">Cancel</MbButton>
        <MbButton :dark="dark" :disabled="Boolean(errors.name)" type="primary" @click="saveSettings">Save</MbButton>
      </template>
    </MbModal>
  </div>
</template>

<script>
import {
  cloneDeep as _cloneDeep, debounce, get as _get, set as _set,
} from 'lodash-es';
import { status } from 'isomorphic-git';
import pluralize from 'pluralize';
import slugify from '@sindresorhus/slugify';
import * as matter from 'gray-matter';

import fs, { exists, PlainFS, joinPath, mkdirp, pathBasename, pathDirname } from '../fs'; // eslint-disable-line object-curly-newline

import assembleUrlFromTemplate from '../assets/js/assembleUrlFromTemplate';
import generateDefaultContentFromSchema from '../assets/js/generateDefaultContentFromSchema';
import generateDefaultFilePathFields from '../assets/js/generateDefaultFilePathFields';
import getFieldsByPredicate from '../assets/js/getFieldsByPredicate';
import getContentLanguages from '../assets/js/getContentLanguages';
import loadProject from '../assets/js/loadProject';
import prettifyEntityName from '../assets/js/prettifyEntityName';
import validateContent from '../assets/js/validateContent';
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
      // Check if the user is allowed to edit content in the current project. To do that we currently need to load all users and the project itself if they aren’t currently loaded
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

      if (!Store.getters.userInCurrentProject || (!path.startsWith(joinPath('/projects', id, collection.dir)) && !path.startsWith(joinPath('/projects', id, Store.state.currentProject.draftsDir, pathBasename(collection.dir))))) canAccess = false; // somebody might try to pass a collection where they have edit rights, so we make sure the collection dir matches the content path
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
        if (collection.schemas.includes(content.___mb_schema)) {
          try {
            schema = JSON.parse(await fs.readFile(joinPath('/projects', id, content.___mb_schema), 'utf8'));
          } catch (err) {
            if (err.code !== 'ENOENT') throw err;
            else Store.commit('addToast', { message: `The Schema “${prettifyEntityName(pathBasename(content.___mb_schema))}” could not be found in this project`, type: 'warning' });
          }
        } else this.$store.commit('addToast', { message: `The Schema “${prettifyEntityName(pathBasename(content.___mb_schema))}” is not allowed in this Collection`, type: 'warning' });
      }

      return next((vm) => {
        vm.collection = collection; // eslint-disable-line no-param-reassign
        vm.content = content; // eslint-disable-line no-param-reassign
        vm.fileStatus = fileStatus; // eslint-disable-line no-param-reassign
        vm.newContentName = prettifyEntityName(pathBasename(path)); // eslint-disable-line no-param-reassign

        if (schema) {
          vm.schema = schema; // eslint-disable-line no-param-reassign

          // OPTIMIZE: it seems a bit wasteful to iterate through all schemas and content values multiple times even when nothing has changed in the Schema, but there’s no way to know when the Schema has changed and the defaults in this file need updating
          const defaults = generateDefaultContentFromSchema(schema, path);
          vm.content = { ...content, ...vm.assignSchemaDefaults(content, defaults) }; // eslint-disable-line no-param-reassign
          vm.findAndSetFilepathIds(schema);
        }

        if (fromBackup) vm.wasChanged = true; // eslint-disable-line no-param-reassign

        if (!schema && !content.___mb_schema && collection.schemas && collection.schemas.length === 1) {
          const firstSchema = collection.schemas[0];
          vm.loadAndAssignSchema(firstSchema);
          vm.$store.commit('addToast', { message: `Automatically assigned the Schema “${prettifyEntityName(pathBasename(firstSchema))}” to this ${vm.contentType}`, type: 'positive' });
        }
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
    allowedSchemas() {
      if (!this.collection.schemas) return [];
      return this.collection.schemas.map((schema) => ({ label: prettifyEntityName(pathBasename(schema)), value: schema }));
    },
    canDelete() {
      const { permissions } = this.collection;
      if (!this.currentUser) return false;
      if (!this.currentUser.role || !permissions) return false;
      if (permissions.everybody && (permissions.everybody.includes('deleteContent') || permissions.everybody.includes('everything'))) return true;
      if (permissions[this.currentUser.role] && (permissions[this.currentUser.role].includes('deleteContent') || permissions[this.currentUser.role].includes('everything'))) return true;
      return false;
    },
    canToggleDraft() {
      const { permissions } = this.collection;
      if (!this.currentUser) return false;
      if (!this.currentUser.role || !permissions) return false;
      if (permissions.everybody && (permissions.everybody.includes('publishDrafts') || permissions.everybody.includes('everything'))) return true;
      if (permissions[this.currentUser.role] && (permissions[this.currentUser.role].includes('publishDrafts') || permissions[this.currentUser.role].includes('everything'))) return true;
      return false;
    },
    cleanTabs() {
      if (!this.schema.tabs) return [];
      return this.schema.tabs.map((tab) => tab.label);
    },
    contentDir() {
      if (!this.collection.dir) return this.projectDir;
      return joinPath(this.projectDir, this.collection.dir);
    },
    contentForTab: {
      get() {
        if (this.activeTab < 0) return this.content;
        const { groupAs } = this.schema.tabs[this.activeTab];
        if (groupAs) return this.content[groupAs] || {};
        return this.content;
      },
      set(v) {
        if (!this.wasChanged) this.wasChanged = true;
        const { groupAs } = this.schema.tabs[this.activeTab];
        if (groupAs) this.content[groupAs] = v;
        else this.content = v;
        if (this.previewConnected) this.sendPreviewData();
      },
    },
    contentLanguages() {
      return getContentLanguages(this.content, this.schema, this.$store.state.currentProject.languages);
    },
    contentName() {
      return prettifyEntityName(pathBasename(this.$route.params.path));
    },
    contentType() {
      return pluralize.singular(prettifyEntityName(this.$route.params.collection));
    },
    currentUser() {
      return this.$store.getters.userInCurrentProject;
    },
    draftsDir() {
      if (!this.collection.dir || !this.$store.state.currentProject.draftsDir) return null;
      return joinPath(this.projectDir, this.$store.state.currentProject.draftsDir, pathBasename(this.contentDir));
    },
    fieldsForTab() {
      if (!this.schema.fields) return [];
      if (this.activeTab === 0) return this.schema.fields.filter((field) => field.tab === this.cleanTabs[0] || !field.tab); // first tab shows all fields without tab, too
      return this.schema.fields.filter((field) => field.tab === this.cleanTabs[this.activeTab]);
    },
    isDraft: {
      get() {
        if (!this.draftsDir) return false;
        return this.$route.params.path.startsWith(this.draftsDir);
      },
      async set(toDraft) {
        const { path } = this.$route.params;
        let newPath;
        if (!toDraft) { // we’re trying to publish, let’s make sure there are no errors
          const valid = this.validateContent();
          if (!valid) { // if it’s not valid, warn and abort
            this.$store.commit('addToast', { message: 'At least one of the fields has errors, please fix them before publishing.', type: 'negative' });
            return;
          }
          newPath = path.replace(this.draftsDir, this.contentDir); // we do not need to ensure that newPath exists here, because a draft in a folder that only exists in draftsDir wouldn’t show up here
        } else {
          newPath = joinPath(this.draftsDir, path.replace(this.contentDir, ''));
          await mkdirp(pathDirname(newPath)); // ensure new path exists in the draftsDir
        }
        const existsAlready = await exists(newPath);

        if (existsAlready) {
          this.$store.commit('addToast', { message: `A ${toDraft ? 'draft' : this.contentType} with this name exists already, please rename it and try again`, type: 'warning' });
        } else {
          await fs.rename(path, newPath);
          this.handleEntityMoved(newPath);
        }
      },
    },
    isMobile() {
      return this.$store.state.application.mobile;
    },
    isTablet() {
      return this.$store.state.application.tablet;
    },
    noSchema() {
      return !this.content.___mb_schema;
    },
    previewUrl() {
      return this.$store.state.currentProject.previewUrl;
    },
    projectDir() {
      return `/projects/${this.$route.params.id}`;
    },
    status() {
      if (!this.fileStatus) return { color: 'warning', loading: true };
      if (this.fileStatus !== 'unmodified') return { color: 'warning', message: 'local changes' };
      return { color: 'positive', message: 'synchronised' };
    },
    tabErrors() {
      const errors = new Set();
      this.errors.fields.forEach((value, key) => {
        const schemaField = this.schema.fields.find((field) => field.key === key);
        if (!schemaField) return;
        let tabIndex = this.cleanTabs.indexOf(schemaField.tab);
        if (tabIndex === -1) tabIndex = 0; // fields without a tab are shown in the firs tab
        errors.add(tabIndex);
      });
      return errors;
    },
  },
  data() {
    return {
      activeTab: -1,
      actualPreviewUrl: null,
      content: {},
      collection: {},
      errors: {
        name: '',
        fields: new Map(),
      },
      fileStatus: null,
      forceNavigation: false,
      fullscreenPreview: false,
      initialised: false,
      newContentName: '',
      newContentSchema: null,
      mobilePreview: false,
      previewConnected: false,
      previewImages: new Map(),
      previewInNewTab: null,
      previewInNewTabTimeout: null,
      saveLoading: false,
      schema: {},
      showPreview: false,
      showSettings: false,
      showSplit: false,
      wasChanged: false,
    };
  },
  methods: {
    addPreviewImage({ detail }) {
      const { path, image } = detail;
      this.previewImages.set(path, image);
      if (this.previewConnected) this.sendPreviewData(); // since images load asynchronously we need to send the data again here so it shows up
    },
    assignSchemaDefaults(content, defaults) {
      return Object.entries(defaults).reduce((acc, [key, value]) => {
        if (!content[key]) acc[key] = value;
        else if (value && !Array.isArray(content[key]) && !(content[key] instanceof Date) && typeof content[key] === 'object') acc[key] = this.assignSchemaDefaults(content[key], value); // some values might end up as dates and we don’t want to handle those
        else acc[key] = content[key];
        return acc;
      }, {});
    },
    closeOpenPreview() {
      if (this.previewInNewTabTimeout) {
        window.clearTimeout(this.previewInNewTabTimeout);
        this.previewInNewTabTimeout = null;
      }
      window.removeEventListener('message', this.handleNewTabPreviewLoaded, false);
      this.$options.winref.close();
      this.$options.winref = null;
      this.previewInNewTab = false;
      this.previewConnected = false;
    },
    deleteContent() {
      if (!this.canDelete) return;

      const { collection, id, path } = this.$route.params;
      const timeout = 5000;
      const timeoutId = window.setTimeout(async () => {
        try {
          await fs.unlink(path);
          this.$store.commit('removeLocallyChangedFile', path);
          this.$store.dispatch('saveAppData');
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while deleting the ${this.contentType}: ${err.message}`, type: 'error' });
          this.$router.replace({ name: 'Edit Content', params: { collection, id, path } });
        } finally {
          window.clearTimeout(timeoutId);
          this.$store.commit('removeFromSoftDeleted', path);
          this.$store.commit('setAppProperty', { key: 'temporaryContentStorage', value: null });
        }
      }, timeout);

      this.showSettings = false;
      if (this.wasChanged) this.$store.commit('setAppProperty', { key: 'temporaryContentStorage', value: _cloneDeep(this.content) });
      this.forceNavigation = true;
      this.$store.commit('addToSoftDeleted', path);
      this.$store.commit('addToast', {
        action: () => {
          window.clearTimeout(timeoutId);
          this.$store.commit('removeFromSoftDeleted', path);
          this.$router.replace({ name: 'Edit Content', params: { collection, id, path } });
        },
        actionLabel: 'Undo',
        message: `The ${this.contentType} “${this.contentName}” was deleted`,
        timeout: timeout - 200,
        type: 'warning',
      });
      const collectionPath = joinPath('/.mattrbld', 'collections', collection);
      this.$router.replace({ name: 'Project.Collection', params: { id, path: collectionPath } });
    },
    exchangePreviewHandshake() {
      let handshake;
      let handshakeTimeout;
      let targetOrigin;
      const vm = this;
      function handshakeListener(e) {
        if (e.origin !== targetOrigin) vm.$store.commit('addToast', { message: 'Could not exchange handshakes with the preview: the origin changed', type: 'warning' });
        else if (!e.data || !e.data.handshake) vm.$store.commit('addToast', { message: 'The preview didn’t return the connection handshake, does it implement the Preview Protocol correctly?', type: 'warning' });
        else if (e.data.handshake !== handshake) vm.$store.commit('addToast', { message: 'Could not exchange handshakes with the preview: the returned handshake didn’t match ours', type: 'warning' });
        else {
          window.clearTimeout(handshakeTimeout);
          vm.previewConnected = true;
          // this would also be the right spot to set up a message listener if we ever wanted to implement bi-directional Communication
          vm.$store.commit('addToast', { message: 'Communication with the preview has been set up successfully', type: 'positive' });
          vm.sendPreviewData();
        }
        window.removeEventListener('message', handshakeListener, false);
      }
      try {
        targetOrigin = new URL(this.previewUrl).origin;
        handshake = Math.random().toString(36).substring(2, 9); // we just need something pseudo-random here to verify that the previewUrl implements the protocol
        if (this.previewInNewTab) this.$options.winref.postMessage({ handshake }, targetOrigin);
        else this.$refs.preview.contentWindow.postMessage({ handshake }, targetOrigin);
        window.addEventListener('message', handshakeListener, false);
        handshakeTimeout = window.setTimeout(() => {
          // send again in case the first message wasn’t received
          if (this.previewInNewTab) this.$options.winref.postMessage({ handshake }, targetOrigin);
          else this.$refs.preview.contentWindow.postMessage({ handshake }, targetOrigin);

          handshakeTimeout = window.setTimeout(() => { // if the first retry didn’t work, let the user decide
            window.removeEventListener('message', handshakeListener, false);
            this.$store.commit('addToast', {
              action: this.exchangePreviewHandshake,
              actionLabel: 'Retry',
              message: 'The preview didn’t return the connection handshake, does it implement the Preview Protocol correctly?',
              onClose: (actionHandled) => { if (!actionHandled) this.showSplit = false; },
              timeout: false,
              type: 'warning',
            });
          }, 500);
        }, 500);
      } catch (err) {
        window.clearTimeout(handshakeTimeout);
        this.$store.commit('addToast', { message: `Something went wrong while exchanging the preview handshake: ${err.message}`, type: 'error' });
      }
    },
    findAndSetFilepathIds(schema) {
      const idFields = getFieldsByPredicate(schema, (field) => field.type === 'id' && field.options && field.options.type === 'filepath');
      idFields.forEach((fieldData) => {
        const { field, contentpath } = fieldData;
        const currentValue = _get(this.content, contentpath);

        if (!currentValue || (currentValue !== this.$route.params.path && !field.options.editable)) {
          _set(this.content, contentpath, this.$route.params.path);
          this.$store.commit('addToast', { message: `Updated “${field.label}” to contain the current filepath`, type: 'positive' });
          this.wasChanged = true;
        }
      });
    },
    focusOpenPreview() {
      this.$options.winref.focus();
    },
    async handleEntityMoved(newPath) {
      this.$store.commit('removeLocallyChangedFile', this.$route.params.path);
      this.$store.commit('addLocallyChangedFile', newPath);
      await this.$router.replace({ params: { collection: this.$route.params.collection, id: this.$route.params.id, path: newPath } });
      this.findAndSetFilepathIds(this.schema);
    },
    handleNewTabPreviewLoaded(e) {
      if (this.previewInNewTabTimeout) {
        window.clearTimeout(this.previewInNewTabTimeout);
        this.previewInNewTabTimeout = null;
      }
      const targetOrigin = new URL(this.previewUrl).origin;
      if (e.origin !== targetOrigin || !e.data.loaded) this.$store.commit('addToast', { message: 'Could not establish a connection with the preview in the new tab: the origins didn’t match, or the loaded message was not present', type: 'warning' });
      else this.exchangePreviewHandshake();
      window.removeEventListener('message', this.handleNewTabPreviewLoaded, false);
    },
    handlePreviewLoaded(e) {
      if (!e.target.src) return; // we need to skip the first load event when the iframe is added to the DOM empty
      this.exchangePreviewHandshake();
    },
    handleSplitClosed() {
      if (this.showPreview) {
        this.showPreview = false;
        if (!this.previewInNewTab) this.previewConnected = false;
      }
    },
    async loadAndAssignSchema(schema) {
      try {
        this.schema = JSON.parse(await fs.readFile(joinPath('/projects', this.$route.params.id, schema), 'utf8'));
        const defaults = generateDefaultContentFromSchema(this.schema, this.$route.params.path);
        this.content = { ...this.content, ...this.assignSchemaDefaults(this.content, defaults) };
        this.content.___mb_schema = schema;
        this.wasChanged = true;
      } catch (err) {
        if (err.code !== 'ENOENT') this.$store.commit('addToast', { message: `Something went wrong while loading the Schema: ${err.message}`, type: 'error' });
        else this.$store.commit('addToast', { message: `The Schema “${prettifyEntityName(pathBasename(schema))}” could not be found in this project, please select a different one`, type: 'warning' });
      }
    },
    openPreviewInNewTab() {
      this.$options.winref = window.open(this.previewUrl, `com.mattrbld.app.Project/preview/${this.$route.params.id}`); // this will focus a window of the same name (reverse domain to avoid duplicates) or open a blank new one
      // this.$options.winref.addEventListener('load', this.exchangePreviewHandshake, false); // doesn’t work because we don’t have access to that origin
      window.addEventListener('message', this.handleNewTabPreviewLoaded, false);
      this.previewInNewTab = true;
      this.previewInNewTabTimeout = window.setTimeout(() => {
        this.$store.commit('addToast', { message: 'The new tab never signalled that it stopped loading, does it implement the Preview Protocol correctly?', type: 'warning' });
        this.previewInNewTabTimeout = null;
      }, 5000);
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
      this.validateNewContentName();
      if (this.errors.name) return;

      const oldName = pathBasename(this.$route.params.path);
      const extension = oldName.slice((Math.max(0, oldName.lastIndexOf('.')) || Infinity) + 1); // based on https://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript/12900504#12900504
      const newName = slugify(this.newContentName, this.$store.state.currentProject.slugifyOptions || { lowercase: false, decamelize: false, preserveLeadingUnderscore: true });
      const newPath = joinPath(pathDirname(this.$route.params.path), `${newName}.${extension}`);
      const alreadyExists = await exists(newPath);

      if (alreadyExists) {
        this.errors.name = 'A content item with this name already exists';
        return;
      }

      await fs.rename(this.$route.params.path, newPath);
      this.showSettings = false;
      this.handleEntityMoved(newPath);
    },
    resetContentName() {
      this.newContentName = this.contentName;
      this.newContentSchema = null;
      this.errors.name = '';
    },
    async saveChanges() {
      this.saveLoading = true;
      const valid = this.validateContent();

      if (!valid && this.isDraft) this.$store.commit('addToast', { message: 'At least one of the fields has errors. You won’t be able to publish this content item until you fix the errors', type: 'warning' });

      if (valid || this.isDraft) { // allow saving with errors, if this is a draft
        if (this.content.___mb_unedited) delete this.content.___mb_unedited; // mark this content item as having been edited once
        try {
          let transformedContent;
          if (this.collection.type === 'json') transformedContent = JSON.stringify(this.content, null, 2);
          else if (this.collection.type === 'md') {
            const shallowClone = { ...this.content };
            delete shallowClone.content; // not needed in the frontmatter
            transformedContent = matter.stringify(this.content.content || '', shallowClone);
          }
          await fs.writeFile(this.$route.params.path, transformedContent, 'utf8');
          this.$store.commit('addToast', { message: `“${this.contentName}” was saved successfully`, timeout: 2000, type: 'positive' });
          this.$store.commit('addLocallyChangedFile', this.$route.params.path);
          this.wasChanged = false;
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while saving the file: ${err.message}`, type: 'error' });
        }
      } else {
        this.$store.commit('addToast', { message: 'At least one of the fields has errors, please fix them before saving.', type: 'negative' });
      }
      this.saveLoading = false;
    },
    async saveSettings() {
      this.showSettings = false;

      if (this.newContentSchema) await this.loadAndAssignSchema(this.newContentSchema);
      if (this.newContentName !== this.contentName) this.renameContent();
    },
    sendPreviewData: debounce(function debouncedSend() { // OPTIMIZE: this could probably be optimized to only send deltas instead of the full object every time if a "full" param is false (we still need to send the full object upon initial connection)
      const targetOrigin = new URL(this.previewUrl).origin;
      const defaultUrl = this.$route.params.path.substring(0, this.$route.params.path.lastIndexOf('.')).replace(this.projectDir, '').replace(pathDirname(this.collection.dir), '');
      const defaultFields = generateDefaultFilePathFields(this.$route.params.path, this.projectDir, joinPath(this.projectDir, this.collection.dir));
      const urlFields = { ...this.content, ...defaultFields };
      let url;

      if (this.collection.urlTemplate && this.contentLanguages && this.contentLanguages.length > 0) {
        url = {};
        this.contentLanguages.forEach((lang) => {
          const template = this.collection.urlTemplate[lang] || Object.values(this.collection.urlTemplate).find((existingTemplate) => existingTemplate);
          url[lang] = template ? assembleUrlFromTemplate(template, urlFields, lang, true, this.$store.state.currentProject.slugifyOptions || { lowercase: true, decamelize: true, preserveLeadingUnderscore: true }).replace(/\\\./g, '.') : defaultUrl; // we’re replacing escaped dots here since that’s the only way to separate a dot from a property-path
        });
      } else url = this.collection.urlTemplate ? assembleUrlFromTemplate(this.collection.urlTemplate, urlFields, null, true, this.$store.state.currentProject.slugifyOptions || { lowercase: true, decamelize: true, preserveLeadingUnderscore: true }).replace(/\\\./g, '.') : defaultUrl; // we’re replacing escaped dots here since that’s the only way to separate a dot from a property-path
      const data = {
        collection: this.$route.params.collection,
        url,
        data: _cloneDeep(this.content),
        imageMap: new Map(this.previewImages), // we need to clone the map here, because StructuredClone doesn’t like proxies
        // changedProp: '', // MAYBE: find a way to detect which property path has changed and pass that to the preview so it can scroll to it?
      };
      if (this.previewInNewTab && this.$options.winref) this.$options.winref.postMessage(data, targetOrigin);
      else if (this.$refs.preview.contentWindow) this.$refs.preview.contentWindow.postMessage(data, targetOrigin);
    }, 500),
    toggleFullscreenPreview() {
      this.previewConnected = false;
      this.fullscreenPreview = !this.fullscreenPreview;
    },
    togglePreview() {
      if (!this.showPreview) {
        this.showSplit = true;
        this.showPreview = true;
        if (!this.actualPreviewUrl) window.setTimeout(() => { this.actualPreviewUrl = this.previewUrl; }, 300); // give the preview a chance to open smoothly before loading the iframe
      } else {
        this.showPreview = false;
        this.showSplit = false;
        this.previewConnected = false;
      }
    },
    validateContent() {
      this.errors.fields = validateContent(this.content, this.schema, this.contentLanguages);
      return this.errors.fields.size === 0;
    },
    validateNewContentName() {
      if (!this.newContentName || !this.newContentName.trim()) this.errors.name = 'A name is required';
      else this.errors.name = '';
    },
  },
  mounted() {
    this.$nextTick(() => { // needed so the active indicator looks right
      this.activeTab = 0;
      this.initialised = true;
    });
  },
  props: {
    dark: Boolean,
  },
  watch: {
    activeTab() {
      if (this.showSplit && !this.showPreview) this.showSplit = false;
    },
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
  winref: null, // keeping this as a non-responsive $option here because of various CORS-issues when this is a data property on the component (and it doesn’t need to be reactive anyway)
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'
@require '../assets/styles/corners'

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
        &.v-enter-active,
        &.v-leave-active
          transition: opacity 200ms ease

          &.v-enter-from,
          &.v-leave-to
            opacity: 0

        &:not(:last-child)
          margin-right: 0.5rem

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

        @media $mobile
          &.push-right
            margin-left: auto

      .toggle
        margin-right: 2rem

        @media $tablet
          margin-right: 1rem

  .tabs
    position: sticky
    top: 0
    z-index: 1
    flex-shrink: 0

  .tab-content
    flex-grow: 1

    .no-schema,
    .fields-editor
      max-width: 40rem
      margin: 0 auto

      &.v-enter-active,
      &.v-leave-active
        transition: opacity 200ms ease

        &.v-enter-from,
        &.v-leave-to
          opacity: 0

    .no-schema
      text-align: center

      &.dark
        h2,
        p
          color: $text-secondary-dark

      h2,
      p
        color: $text-secondary

      ul
        margin: 0
        list-style: none

        li
          &:not(:last-child)
            margin-bottom: 1rem

          .button
            max-width: 100%
            width: (320 / 16)rem

    .fields-editor
      margin-top: 8rem

      &.preview-open
        margin-bottom: 8rem

        @media $tablet
          margin-bottom: 4rem

      @media $tablet
        margin-top: 4rem

      @media $mobile
        margin-top: 2rem

.preview
  display: flex
  flex-direction: column
  justify-content: center
  align-items: center
  height: 100%

  @media $mobile
    height: "calc(90vh - %s)" % (86 / 16)rem // height of the modal footer + card border
    position: relative

  .error-state
    text-align: center
    max-width: 40rem

    &.dark
      .icon,
      h2,
      p
        color: $text-secondary-dark

    .icon
      width: 6rem
      height: @width

    .icon,
    h2,
    p
      color: $text-secondary

    h2
      margin-top: 1rem

    p
      margin-bottom: 2rem

    .button:not(:last-child)
      margin-right: 1rem

.preview-frame // toplevel because it can teleport
  width: 100%
  height: 100%
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center

  &.fullscreen
    position: fixed
    top: 0
    left: 0
    background-color: $bg-dark
    z-index: 2

  &.mobile-preview
    background-color: $bg-tertiary-dark

    header
      opacity: 1

  header
    position: absolute
    top: 0
    left: 0
    width: 100%
    padding: 1rem
    background-color: alpha($bg, 0.5)
    opacity: 0
    transition: opacity 200ms ease

    &.dark
      background-color: alpha($bg-dark, 0.5)

    &:hover
      opacity: 1

    .button:not(:last-child)
      margin-right: 0.5rem

  iframe
    border: none
    width: 100%
    height: 100%
    background-color: #fff

    &.mobile
      width: (360 / 16)rem
      height: (640 / 16)rem
      max-width: 100%
      max-height: 100%
      margin: 1rem
      border-radius: $radius-xl

  .loader
    position: absolute
    top: 0
    left: 0
    width: 100%
    height: 100%
    background-color: $bg

    &.dark
      background-color: $bg-secondary-dark

    &.v-enter-active,
    &.v-leave-active
      transition: opacity 200ms ease

      &.v-enter-from,
      &.v-leave-to
        opacity: 0

#splitTarget
  padding-top: 8rem
  max-width: 40rem
  margin-left: auto
  margin-right: auto

  @media $tablet
    padding-top: 4rem

  @media $mobile
    padding-top: 0

  &.in-modal
    margin-top: -1rem

.edit-content-modal
  .input
    width: 100%
    margin-bottom: 1rem

  .select-wrapper
    display: flex
    align-items: center
    justify-content: space-between
    margin-bottom: 2rem

    > span
      margin-right: 1rem

  .highlight-box
    .button
      width: 100%
</style>
