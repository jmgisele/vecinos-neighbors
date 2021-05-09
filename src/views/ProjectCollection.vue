<template lang="html">
  <div class="collection">
    <h1>{{collection.name}}</h1>
    <MbFileList v-if="typeof collection.dir !== 'undefined'" :action="action" :dark="dark" :drafts-dir="draftsDir" :empty-state="emptyState" :file-actions="fileActions" :file-list-label="fileListLabel" :filetypes="[collection.type]" pretty-filenames ref="fileList" :root="collection.dir" @fileclick="handleFileClick" @list-change="listedFiles = $event.files" @path-change="currentPath = $event" />
    <MbButton v-if="(userPermissions.has('everything') || userPermissions.has('createContent')) && listedFiles === 0" :dark="dark" icon="plus" type="positive" @click="createEntity">Create one</MbButton>
    <EntityCreationModal :dark="dark" :file-content="typeof defaultCollectionContent !== 'string' ? JSON.stringify(defaultCollectionContent, null, 2) : defaultCollectionContent" :file-extension="collection.type" :only="createOnly" :path="{ file: draftsDir && collection.draftByDefault ? currentDraftsPath : currentPath, directory: currentPath }" :title="entityCreationTitle" :visible="showEntityCreation" @close="handleEntityCreationClose" @entity-created="handleEntityCreated" />
    <EntityMoveModal :dark="dark" :old-path="entityBeingModified" pretty-filenames :root="moveRootDir" :visible="showEntityMove" @close="showEntityMove = false; entityBeingModified = null" @entity-moved="handleEntityMoved" />
    <EntityRenameModal :dark="dark" :old-path="entityBeingModified" :visible="showEntityRename" @close="showEntityRename = false; entityBeingModified = null" @entity-renamed="handleEntityRenamed" />
  </div>
</template>

<script>
import pluralize from 'pluralize';
import { dump as toYAML } from 'js-yaml';

import fs, {
  exists, joinPath, mkdirp, pathBasename,
} from '../fs';
import { rmrf } from '../fs/workerFS';

import generateDefaultContentFromSchema from '../assets/js/generateDefaultContentFromSchema';
import prettifyEntityName from '../assets/js/prettifyEntityName';

import updateLocallyChangedFiles from '../mixins/updateLocallyChangedFiles';

import EntityCreationModal from '../components/utility/EntityCreationModal.vue';
import EntityMoveModal from '../components/utility/EntityMoveModal.vue';
import EntityRenameModal from '../components/utility/EntityRenameModal.vue';

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
  components: {
    EntityCreationModal,
    EntityMoveModal,
    EntityRenameModal,
  },
  computed: {
    action() {
      if (this.userPermissions.has('everything') || this.userPermissions.has('createFolder') || this.userPermissions.has('createContent')) {
        let label;
        if (this.userPermissions.has('everything') || (this.userPermissions.has('createFolder') && this.userPermissions.has('createContent'))) label = 'Add';
        else if (this.userPermissions.has('createFolder')) label = 'Add folder';
        else if (this.userPermissions.has('createContent')) label = `Add ${pluralize.singular(this.collection.name)}`;

        return {
          callback: this.createEntity,
          label,
          icon: 'plus',
          iconFirst: true,
          type: 'primary',
        };
      }
      return null;
    },
    createOnly() {
      if (!this.userPermissions.has('everything') && this.userPermissions.has('createContent')) return 'file';
      if (!this.userPermissions.has('everything') && this.userPermissions.has('createFolder')) return 'directory';
      return null;
    },
    currentDraftsPath() {
      if (!this.draftsDir || !this.currentPath) return null;
      return joinPath(this.draftsDir, this.currentPath.replace(this.collection.dir, ''));
    },
    draftsDir() {
      if (!this.collection.dir || !this.$store.state.currentProject.draftsDir) return null;
      return joinPath(this.$store.state.currentProject.draftsDir, 'collection', pathBasename(this.collection.dir));
    },
    entityCreationTitle() {
      if (this.userPermissions.has('everything') || (this.userPermissions.has('createContent') && this.userPermissions.has('createFolder'))) return 'Add new…';
      if (this.userPermissions.has('createContent')) return `Add new ${pluralize.singular(this.collection.name)}…`;
      return 'Add new folder…';
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
      if (!this.collection.permissions || !this.$store.getters.userInCurrentProject) return new Set();

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
      defaultCollectionContent: {},
      emptyState: {
        empty: 'There’s no content in this Collection',
        noFiles: 'There are no content items in this folder',
        noFolders: 'There are no folders in this Collection',
      },
      entityBeingModified: null,
      listedFiles: 0,
      moveRootDir: null,
      showEntityCreation: false,
      showEntityMove: false,
      showEntityRename: false,
    };
  },
  methods: {
    async createEntity() {
      if (this.collection.schemas.length === 1) {
        try {
          const schema = JSON.parse(await fs.readFile(this.collection.schemas[0], 'utf8'));
          const content = generateDefaultContentFromSchema(schema);
          const relativeSchemaPath = this.collection.schemas[0].replace(`/projects/${this.$store.state.currentProject.id}, ''`);

          if (this.collection.type === 'json') this.defaultCollectionContent = { ...content, ___mb_schema: relativeSchemaPath };
          else if (this.collection.type === 'md') {
            const markdownContent = content.content;
            delete content.content; // content is the markdown body, so we don’t need that in the frontmatter
            const frontmatter = toYAML({ ...content, ___mb_schema: relativeSchemaPath });
            this.defaultCollectionContent = `---\n${frontmatter}${frontmatter.endsWith('\n') ? '' : '\n'}---\n${markdownContent || ''}`;
          }
        } catch (err) {
          if (err.code !== 'ENOENT') this.$store.commit('addToast', { message: `Something went wrong while loading the default Schema: ${err.message}`, type: 'error' });
        }
      } else if (this.collection.type === 'md') this.defaultCollectionContent = '---\n---\n';
      else this.defaultCollectionContent = {};

      this.showEntityCreation = true;
    },
    async deleteEntity(path) {
      const timeout = 5000;
      const isFile = (await fs.stat(path)).isFile();
      const timeoutId = window.setTimeout(async () => {
        try {
          const deletionPromises = [];
          let correspondingDraftsDir;
          let dirExists;
          if (!isFile && this.draftsDir) {
            correspondingDraftsDir = joinPath(this.draftsDir, path.replace(this.collection.dir, ''));
            dirExists = await exists(correspondingDraftsDir);
            if (dirExists) deletionPromises.push(rmrf(correspondingDraftsDir));
          }
          deletionPromises.push(await rmrf(path));
          await Promise.all(deletionPromises);
          await this.$refs.fileList.refresh();
          if (isFile) this.$store.commit('removeLocallyChangedFile', path);
          else if (this.draftsDir && correspondingDraftsDir && dirExists) {
            this.$store.commit('removeLocallyChangedFolder', path);
            this.$store.commit('removeLocallyChangedFolder', correspondingDraftsDir);
          } else this.$store.commit('removeLocallyChangedFolder', path);
          this.$store.dispatch('saveAppData');
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while deleting the ${isFile ? 'schema' : 'folder'}: ${err.message}`, type: 'error' });
        } finally {
          window.clearTimeout(timeoutId);
          this.$store.commit('removeFromSoftDeleted', path);
        }
      }, timeout);

      this.$store.commit('addToSoftDeleted', path);
      this.$store.commit('addToast', {
        action: () => {
          window.clearTimeout(timeoutId);
          this.$store.commit('removeFromSoftDeleted', path);
        },
        actionLabel: 'Undo',
        message: isFile ? `The ${pluralize.singular(this.collection.name)} “${prettifyEntityName(pathBasename(path))}” was deleted` : `The folder and all ${pluralize.plural(this.collection.name)} within have been deleted`,
        timeout: timeout - 200,
        type: 'warning',
      });
    },
    handleEntityCreationClose() {
      this.showEntityCreation = false;
    },
    async handleEntityCreated(name, type) {
      const wasDraft = type === 'file' && this.draftsDir && this.collection.draftByDefault;

      if (type !== 'file') this.$refs.fileList.refresh();
      else {
        this.$store.commit('addLocallyChangedFile', joinPath(wasDraft ? this.currentDraftsPath : this.currentPath, name));
        this.$store.dispatch('saveAppData');
        if (this.userPermissions.has('everything') || this.userPermissions.has('editContent')) this.openContentItem(`${wasDraft ? this.currentDraftsPath : this.currentPath}/${name}`);
        else this.$refs.fileList.refresh();
      }
      this.defaultCollectionContent = {};
    },
    async handleEntityMoved({ oldPath, newPath }) {
      this.$refs.fileList.refresh();
      this.entityBeingModified = null;

      const isFile = (await fs.stat(newPath)).isFile();

      if (isFile) {
        this.$store.commit('removeLocallyChangedFile', oldPath);
        this.$store.commit('addLocallyChangedFile', newPath);
      } else { // we moved a directory
        this.$store.commit('removeLocallyChangedFolder', oldPath);
        try {
          await this.updateLocallyChangedFiles(newPath);
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while updating locally changed files: ${err.message}`, type: 'error' });
        }
      }
      this.$store.dispatch('saveAppData');
    },
    async handleEntityRenamed({ oldPath, newPath }) {
      this.$refs.fileList.refresh();
      this.entityBeingModified = null;

      const isFile = (await fs.stat(newPath)).isFile();

      if (isFile) {
        this.$store.commit('removeLocallyChangedFile', oldPath);
        this.$store.commit('addLocallyChangedFile', newPath);
      } else {
        const oldDraftPath = joinPath(this.draftsDir, oldPath.replace(this.collection.dir, ''));
        const newDraftPath = joinPath(this.draftsDir, newPath.replace(this.collection.dir, ''));

        if (this.draftsDir) {
          const oldPathExistsAsDraft = await exists(oldDraftPath);

          if (oldPathExistsAsDraft) {
            try {
              await fs.rename(oldDraftPath, newDraftPath);
            } catch (err) {
              this.$store.commit('addToast', { message: `Something went wrong while renaming the draft directory: ${err.message}`, type: 'error' });
            }
          }
        }
        this.$store.state.application.locallyChangedFiles.forEach((path) => {
          if (path.startsWith(oldPath)) {
            this.$store.commit('removeLocallyChangedFile', path);
            this.$store.commit('addLocallyChangedFile', path.replace(oldPath, newPath));
          } else if (path.startsWith(oldDraftPath)) {
            this.$store.commit('removeLocallyChangedFile', path);
            this.$store.commit('addLocallyChangedFile', path.replace(oldDraftPath, newDraftPath));
          }
        });
      }

      this.$store.dispatch('saveAppData');
    },
    handleFileClick(path) {
      if (this.userPermissions.has('everything') || this.userPermissions.has('editContent')) this.openContentItem(path);
    },
    moveEntity(path) {
      const isDraft = this.draftsDir && path.startsWith(this.draftsDir);
      if (isDraft) this.moveRootDir = this.draftsDir;
      else this.moveRootDir = this.collection.dir;

      this.entityBeingModified = path;
      this.showEntityMove = true;
    },
    openContentItem(path) {
      this.$router.push({ name: 'Edit Content', params: { id: this.$store.state.currentProject.id, path } });
    },
    renameEntity(path) {
      this.entityBeingModified = path;
      this.showEntityRename = true;
    },
    async toggleDraft(path) {
      const isDraft = path.startsWith(this.draftsDir);
      let newPath;
      if (isDraft) newPath = path.replace(this.draftsDir, this.collection.dir); // we do not need to ensure that newPath exists here, because a draft in a folder that only exists in draftsDir wouldn’t show up here
      else {
        newPath = joinPath(this.draftsDir, path.replace(this.collection.dir, ''));
        await mkdirp(newPath); // ensure new path exists in the draftsDir
      }
      const existsAlready = await exists(newPath);

      if (existsAlready) {
        this.$store.commit('addToast', { message: `A ${!isDraft ? 'draft' : pluralize.singular(this.collection.name)} with this name exists already, please rename it and try again`, type: 'warning' });
      } else {
        await fs.rename(path, newPath);
        this.handleEntityMoved({ oldPath: path, newPath });
      }
    },
  },
  mixins: [updateLocallyChangedFiles],
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'

.collection
  height: 100%
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
