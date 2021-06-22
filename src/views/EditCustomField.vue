<template lang="html">
  <div class="edit-custom-field">
    <header>
      <div class="left">
        <h1>{{customFieldName}}</h1>
        <MbChip :color="status.color" :label="status.message" :loading="status.loading" />
      </div>
      <div class="right">
        <MbButton :dark="dark" icon="settings" @click="showCustomFieldSettings = true">{{isTablet ? '' : 'Settings'}}</MbButton>
        <MbButton :dark="dark" :disabled="customField.length !== 1 || !wasChanged" icon="save" :icon-first="true" :loading="saveLoading" type="primary" @click="saveChanges">{{isTablet && !isMobile ? '' : 'Save'}}</MbButton>
      </div>
    </header>
    <SchemaFieldsEditor v-model="customField" :active-tab="0" :dark="dark" :project-id="$route.params.id" :tabs="[]" @update:modelValue="checkForChanges" />
  </div>
</template>

<script>
import { cloneDeep, isEqual } from 'lodash-es';
import { status } from 'isomorphic-git';
// import slugify from '@sindresorhus/slugify';

import fs, { exists, PlainFS, joinPath, pathBasename, pathDirname } from '../fs'; // eslint-disable-line object-curly-newline, no-unused-vars
import flattenFields from '../assets/js/flattenFields';
import hasAccess from '../assets/js/hasAccess';
import loadProject from '../assets/js/loadProject';
import prettifyEntityName from '../assets/js/prettifyEntityName';
import Store from '../store';

import isPrivilegedUser from '../mixins/isPrivilegedUser';

import SchemaFieldsEditor from '../components/utility/SchemaFieldsEditor.vue';

export default {
  async beforeRouteEnter(to, from, next) {
    try {
      // Check if the user is allowed to edit custom fields in the current project. To do that we currently need to load all users and the project itself if they aren’t currently loaded
      if (!Store.state.currentProject.id) { // currentProject is not loaded
        const { project, users, avatarUrl } = await loadProject(to.params.id, fs);
        Store.commit('setCurrentProject', {
          ...Store.state.currentProject,
          ...project,
          users,
          avatarUrl,
        });
      }
      if (!hasAccess(Store.state.user.email, Store.state.currentProject.users, Store.state.currentProject.customRoles)) return next({ name: 'Forbidden', replace: true });

      const { id, path } = to.params;
      let customField;
      let fromBackup = false;

      if (Store.state.application.temporaryCustomFieldStorage) { // if we have a backup
        customField = Store.state.application.temporaryCustomFieldStorage;
        fromBackup = true;
        Store.commit('setAppProperty', { key: 'temporaryCustomFieldStorage', value: null });
      } else {
        customField = JSON.parse(await fs.readFile(path, 'utf8'));
      }
      const fileStatus = await status({ fs: PlainFS, dir: `/projects/${id}`, filepath: path.replace(`/projects/${id}/`, '') }); // filepath needs to be relative

      return next((vm) => {
        // needs to be an array so we can pass it to the fields editor
        vm.customField = [customField]; // eslint-disable-line no-param-reassign
        vm.fileStatus = fileStatus; // eslint-disable-line no-param-reassign
        vm.newCustomFieldName = prettifyEntityName(pathBasename(path)); // eslint-disable-line no-param-reassign
        if (fromBackup) vm.checkForChanges([customField]); // eslint-disable-line no-param-reassign
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
  components: {
    SchemaFieldsEditor,
  },
  computed: {
    customFieldName() {
      return prettifyEntityName(pathBasename(this.$route.params.path));
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
  beforeUnmount() {
    window.removeEventListener('beforeunload', this.preventUnintentionalClose);
  },
  data() {
    return {
      customField: [],
      fileStatus: null,
      forceNavigation: false,
      newCustomFieldName: '',
      originalField: null,
      saveLoading: false,
      showCustomFieldSettings: false,
      wasChanged: false,
    };
  },
  methods: {
    async checkForChanges(nv) {
      if (!this.originalField) this.originalField = JSON.parse(await fs.readFile(this.$route.params.path, 'utf8'));
      this.wasChanged = !isEqual(this.originalField, nv[0]); // we’re only interested in the first field
    },
    async saveChanges() {
      if (this.customField.length > 1) {
        this.$store.commit('addToast', { message: 'Custom fields with more than one root field are not supported. Make sure they are properly grouped in a Field Group, Columns or Rows field.', type: 'negative' });
        return;
      }

      this.saveLoading = true;
      await this.checkForChanges(this.customField);
      if (!this.wasChanged) return;

      const valid = this.validateCustomField();

      if (valid) {
        try {
          const newField = cloneDeep(this.customField[0]);
          if (!newField.version || typeof newField.version !== 'number') newField.version = 1;
          else newField.version += 1;
          await fs.writeFile(this.$route.params.path, JSON.stringify(newField, null, 2), 'utf8');
          this.$store.commit('addToast', { message: `“${this.customFieldName}” was saved successfully`, type: 'positive' });
          this.$store.commit('addLocallyChangedFile', this.$route.params.path);
          this.$store.dispatch('saveAppData');
          this.wasChanged = false;
          this.originalField = newField;
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while saving the file: ${err.message}`, type: 'error' });
        }
      } else {
        this.$store.commit('addToast', { message: 'At least one of the fields has errors, please fix them before saving.', type: 'negative' });
      }
      this.saveLoading = false;
    },
    validateCustomField() {
      const flattenedFields = flattenFields(this.customField);

      for (let index = 0; index < flattenedFields.length; index += 1) {
        const field = flattenedFields[index];
        if (field.errors && field.errors.size > 0) return false;
        if (!field.key) {
          field.errors = new Map(['key', 'A key is required']);
          return false;
        }
        if (field.errors) delete field.errors; // clear empty errors properties
      }
      return true;
    },
  },
  mixins: [isPrivilegedUser],
  props: {
    dark: Boolean,
  },
  watch: {
    isPrivilegedUser(nv) {
      if (!nv) this.$router.replace({ name: 'Project' });
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
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.edit-custom-field // 100% minus the height of the app-header
  height: "calc(100vh - %s)" % (116 / 16)rem
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

.edit-custom-field-modal
  .input
    width: 100%
    margin-bottom: 1rem

    &.v-enter-active,
    &.v-leave-active
      transition: opacity 200ms ease

      &.v-enter-from,
      &.v-leave-to
        opacity: 0

  .toggle
    margin-top: 1.5rem

  .highlight-box
    margin-top: 2rem

    .button
      display: flex
      margin-left: auto

      @media $mobile
        width: 100%

</style>
