<template lang="html">
  <div class="collection">
    <h1>{{collection.name}}</h1>
    <template v-if="collection.dir">
      <MbFileList v-if="typeof collection.dir !== 'undefined'" :action="action" :dark="dark" :drafts-dir="draftsDir" :empty-state="emptyState" :file-actions="fileActions" :file-list-label="fileListLabel" :filetypes="[collection.type]" :initial-path="lastDir" pretty-filenames ref="fileList" :root="contentDir" @fileclick="handleFileClick" @list-change="listedFiles = $event.files" @path-change="currentPath = $event" />
      <MbButton v-if="(userPermissions.has('everything') || userPermissions.has('createContent')) && listedFiles === 0" :dark="dark" icon="plus" type="positive" @click="createEntity">Create one</MbButton>
    </template>
    <div v-else class="unconfigured-state" :class="{ dark }">
      <h2>This Collection has no content directory</h2>
      <p v-if="isPrivilegedUser">You can add one in the settings.</p>
      <p v-else>A developer needs to add one in the settings.</p>
      <MbButton v-if="isPrivilegedUser" :dark="dark" icon="wrench-and-driver" type="primary" @click="$router.push({ name: 'Project.Settings', params: { id: $route.params.id }, query: { tab: 'collections' }})">Configure now</MbButton>
    </div>
    <EntityCreationModal :dark="dark" :file-content="typeof defaultCollectionContent !== 'string' ? JSON.stringify(defaultCollectionContent, null, 2) : defaultCollectionContent" :file-extension="collection.type" :only="createOnly" :path="{ file: draftsDir && collection.draftByDefault ? currentDraftsPath : currentPath, directory: currentPath }" :title="entityCreationTitle" :visible="showEntityCreation" @close="handleEntityCreationClose" @entity-created="handleEntityCreated" />
    <EntityMoveModal :dark="dark" :old-path="entityBeingModified" pretty-filenames :root="moveRootDir" :visible="showEntityMove" @close="showEntityMove = false; entityBeingModified = null" @entity-moved="handleEntityRenamed" />
    <EntityRenameModal :dark="dark" :old-path="entityBeingModified" :visible="showEntityRename" @close="showEntityRename = false; entityBeingModified = null" @entity-renamed="handleEntityRenamed" />
  </div>
</template>

<script>
import pluralize from 'pluralize';
import * as matter from 'gray-matter';
import { set as _set } from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';

import fs, {
  exists, joinPath, mkdirp, pathBasename, pathDirname,
} from '../fs';
import { rmrf } from '../fs/workerFS';

import Store from '../store';

import generateDefaultContentFromSchema from '../assets/js/generateDefaultContentFromSchema';
import getFieldsByPredicate from '../assets/js/getFieldsByPredicate';
import getContentLanguages from '../assets/js/getContentLanguages';
import prettifyEntityName from '../assets/js/prettifyEntityName';
import validateContent from '../assets/js/validateContent';

import isPrivilegedUser from '../mixins/isPrivilegedUser';
import updateLocallyChangedFiles from '../mixins/updateLocallyChangedFiles';

import EntityCreationModal from '../components/utility/EntityCreationModal.vue';
import EntityMoveModal from '../components/utility/EntityMoveModal.vue';
import EntityRenameModal from '../components/utility/EntityRenameModal.vue';

export default {
  async beforeRouteEnter(to, from, next) {
    const { path } = to.params;

    if (!path) return next({ name: 'NotFound', query: { type: 'collection' }, replace: true });

    try {
      const collection = JSON.parse(await fs.readFile(joinPath('/projects', to.params.id, path), 'utf8'));
      let lastDir = null;

      if (from && from.name === 'Edit Content' && from.params.path && from.params.collection === pathBasename(path)) lastDir = pathDirname(from.params.path);
      if (lastDir) { // we have to handle draft posts which come from a different path but show in the same directory as regular content
        const unprefixedDraftsDir = Store.state.currentProject.draftsDir;

        if (unprefixedDraftsDir) {
          const draftsDir = joinPath('/projects', to.params.id, unprefixedDraftsDir, pathBasename(collection.dir));
          if (lastDir.startsWith(draftsDir)) lastDir = lastDir.replace(joinPath(unprefixedDraftsDir, pathBasename(collection.dir)), collection.dir);
        }
      }

      return next((vm) => {
        vm.collection = { ...collection, name: prettifyEntityName(pathBasename(path)) }; // eslint-disable-line no-param-reassign
        vm.currentPath = lastDir || joinPath('/projects', to.params.id, collection.dir); // eslint-disable-line no-param-reassign
        vm.lastDir = lastDir; // eslint-disable-line no-param-reassign
      });
    } catch (err) {
      if (err.code === 'ENOENT') return next({ name: 'NotFound', query: { type: 'collection' }, replace: true });
      return next({ name: 'Error', state: { code: err.code, name: err.name, message: err.message }, replace: true });
    }
  },
  async beforeRouteUpdate(to) {
    const { path } = to.params;

    if (!path) return { name: 'NotFound', query: { type: 'collection' }, replace: true };

    try {
      const collection = JSON.parse(await fs.readFile(joinPath('/projects', to.params.id, path), 'utf8'));
      this.collection = { ...collection, name: prettifyEntityName(pathBasename(path)) };
      this.currentPath = joinPath('/projects', to.params.id, collection.dir);
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
    commentsDir() {
      return joinPath(this.projectDir, '.mattrbld', 'comments');
    },
    contentDir() {
      if (!this.collection.dir) return this.projectDir;
      return joinPath(this.projectDir, this.collection.dir);
    },
    createOnly() {
      if (!this.userPermissions.has('everything') && this.userPermissions.has('createContent')) return 'file';
      if (!this.userPermissions.has('everything') && this.userPermissions.has('createFolder')) return 'directory';
      return null;
    },
    currentDraftsPath() {
      if (!this.draftsDir || !this.currentPath) return null;
      return joinPath(this.draftsDir, this.currentPath.replace(this.contentDir, ''));
    },
    draftsDir() {
      if (!this.collection.dir || !this.$store.state.currentProject.draftsDir) return null;
      return joinPath(this.projectDir, this.$store.state.currentProject.draftsDir, pathBasename(this.contentDir));
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
          {
            action: this.duplicateContentItem,
            label: 'Duplicate',
            icon: 'duplicate',
            filesOnly: true,
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

      if (this.userPermissions.has('createContent')) actions.push({ action: this.duplicateContentItem, label: 'Duplicate', icon: 'duplicate', filesOnly: true }); // eslint-disable-line object-curly-newline
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
    projectDir() {
      return `/projects/${this.$route.params.id}`;
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
      lastDir: null,
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
          const schema = JSON.parse(await fs.readFile(joinPath(this.projectDir, this.collection.schemas[0]), 'utf8'));
          const content = generateDefaultContentFromSchema(schema);
          const relativeSchemaPath = this.collection.schemas[0];

          if (this.collection.type === 'json') this.defaultCollectionContent = { ...content, ___mb_schema: relativeSchemaPath, ___mb_unedited: true };
          else if (this.collection.type === 'md') {
            const markdownContent = content.content;
            delete content.content; // content is the markdown body, so we don’t need that in the frontmatter
            this.defaultCollectionContent = matter.stringify(markdownContent || '', { ...content, ___mb_schema: relativeSchemaPath, ___mb_unedited: true });
          }
        } catch (err) {
          if (err.code !== 'ENOENT') this.$store.commit('addToast', { message: `Something went wrong while loading the default Schema: ${err.message}`, type: 'error' });
        }
      } else if (this.collection.type === 'md') this.defaultCollectionContent = matter.stringify('', { ___mb_unedited: true });
      else this.defaultCollectionContent = { ___mb_unedited: true };

      this.showEntityCreation = true;
    },
    async deleteEntity(path) {
      const isFile = (await fs.stat(path)).isFile();

      this.$store.commit('addToSoftDeleted', path);
      this.$store.commit('addToast', {
        action: () => {
          this.$store.commit('removeFromSoftDeleted', path);
        },
        actionLabel: 'Undo',
        message: isFile ? `The ${pluralize.singular(this.collection.name)} “${prettifyEntityName(pathBasename(path))}” was deleted` : `The folder and all ${pluralize.plural(this.collection.name)} within have been deleted`,
        onClose: async (undone) => {
          if (undone) return;
          try {
            const deletionPromises = [];

            // handle drafts
            let correspondingDraftsDir;
            let draftsDirExists;
            if (!isFile && this.draftsDir) {
              correspondingDraftsDir = joinPath(this.draftsDir, path.replace(this.contentDir, ''));
              draftsDirExists = await exists(correspondingDraftsDir);
              if (draftsDirExists) deletionPromises.push(rmrf(correspondingDraftsDir));
            }

            // handle comments
            let correspondingCommentsDir;
            if (isFile) {
              if (this.draftsDir && path.startsWith(this.draftsDir)) correspondingCommentsDir = joinPath(this.commentsDir, path.substring(0, path.lastIndexOf('.')).replace(pathDirname(this.draftsDir), ''));
              else correspondingCommentsDir = joinPath(this.commentsDir, path.substring(0, path.lastIndexOf('.')).replace(pathDirname(this.contentDir), ''));
            } else {
              correspondingCommentsDir = joinPath(this.commentsDir, path.replace(pathDirname(this.contentDir), ''));
            }
            const correspondingCommentsDirExists = await exists(correspondingCommentsDir);
            if (correspondingCommentsDirExists) deletionPromises.push(rmrf(correspondingCommentsDir));

            deletionPromises.push(rmrf(path));
            await Promise.all(deletionPromises);
            if (this.$refs && this.$refs.fileList) await this.$refs.fileList.refresh();
            if (isFile) this.$store.commit('removeLocallyChangedFile', path);
            else if (this.draftsDir && correspondingDraftsDir && draftsDirExists) {
              this.$store.commit('removeLocallyChangedFolder', path);
              this.$store.commit('removeLocallyChangedFolder', correspondingDraftsDir);
            } else this.$store.commit('removeLocallyChangedFolder', path);
            this.$store.dispatch('saveAppData');
          } catch (err) {
            this.$store.commit('addToast', { message: `Something went wrong while deleting the ${isFile ? pluralize.singular(this.collection.name) : 'folder'}: ${err.message}`, type: 'error' });
          } finally {
            this.$store.commit('removeFromSoftDeleted', path);
          }
        },
        timeout: 5000,
        type: 'warning',
      });
    },
    async duplicateContentItem(path) {
      const filename = pathBasename(path);
      const directory = pathDirname(path);
      const extension = filename.slice((Math.max(0, filename.lastIndexOf('.')) || Infinity) + 1); // based on https://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript/12900504#12900504
      const nameWithoutExtension = filename.substring(0, Math.max(0, filename.lastIndexOf('.')) || Infinity);
      let counter = 1;
      let nameCandidate = `${nameWithoutExtension}-${counter}.${extension}`;
      let existingFiles;

      try {
        existingFiles = await fs.readdir(directory);
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while reading the existing files: ${err.message}`, type: 'error' });
        return;
      }

      while (existingFiles.indexOf(nameCandidate) > -1) {
        counter += 1;
        nameCandidate = `${nameWithoutExtension}-${counter}.${extension}`;
      }

      try {
        const rawFile = await fs.readFile(path, 'utf8');
        const newPath = joinPath(directory, nameCandidate);
        let content;
        let serializedContent;
        if (this.collection.type === 'json') content = JSON.parse(rawFile);
        else if (this.collection.type === 'md') {
          const { content: fileContent, data } = matter(rawFile);
          content = { ...data, content: fileContent.trim() }; // fileContent might have leading / trailing newline characters which we’ll strip out here
        }
        if (content.___mb_schema) {
          const schema = JSON.parse(await fs.readFile(joinPath(this.projectDir, content.___mb_schema), 'utf8'));
          const idFields = getFieldsByPredicate(schema, (field) => field.type === 'id');
          idFields.forEach((fieldData) => {
            const { field, contentpath } = fieldData;
            let value = null;
            if (field.options && field.options.type === 'filepath') {
              if (this.draftsDir && newPath.startsWith(this.draftsDir)) value = joinPath(this.contentDir.replace(this.projectDir, ''), newPath.replace(this.draftsDir, ''));
              else value = newPath.replace(this.projectDir, '');
            } else if (field.options && field.options.type === 'uuid') value = uuidv4();
            _set(content, contentpath, value);
          });
        }

        if (this.collection.type === 'json') serializedContent = JSON.stringify(content, null, 2);
        else if (this.collection.type === 'md') {
          const markdownContent = content.content;
          delete content.content; // content is the markdown body, so we don’t need that in the frontmatter
          serializedContent = matter.stringify(markdownContent || '', content);
        }
        await fs.writeFile(newPath, serializedContent, 'utf8');
        this.$store.commit('addLocallyChangedFile', newPath);
        this.$store.dispatch('saveAppData');
        this.$refs.fileList.refresh();
        this.$store.commit('addToast', {
          action: () => this.handleFileClick(newPath),
          actionLabel: 'Open',
          closeOnRouteChange: true,
          message: `The file was duplicated as “${nameCandidate}”. Would you like to open it?`,
          type: 'positive',
        });
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while duplicationg the file: ${err.message}`, type: 'error' });
        console.error(err);
      }
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
        if (this.userPermissions.has('everything') || this.userPermissions.has('editContent')) this.openContentItem(joinPath(wasDraft ? this.currentDraftsPath : this.currentPath, name));
        else this.$refs.fileList.refresh();
      }
      this.defaultCollectionContent = {};
    },
    async handleEntityRenamed({ oldPath, newPath }) {
      this.$refs.fileList.refresh();
      this.entityBeingModified = null;

      const isFile = (await fs.stat(newPath)).isFile();

      if (isFile) {
        this.$store.commit('removeLocallyChangedFile', oldPath);
        this.$store.commit('addLocallyChangedFile', newPath);

        // check if it has an associated comment folder (name of the file without extension) at oldPath
        // we need the filename without an extension, and it is safe to assume that this filepath always ends with an extension
        let oldCommentsPath;
        let newCommentsPath;

        if (this.draftsDir && oldPath.startsWith(this.draftsDir) && newPath.startsWith(this.draftsDir)) {
          oldCommentsPath = joinPath(this.commentsDir, oldPath.substring(0, oldPath.lastIndexOf('.')).replace(pathDirname(this.draftsDir), ''));
          newCommentsPath = joinPath(this.commentsDir, newPath.substring(0, newPath.lastIndexOf('.')).replace(pathDirname(this.draftsDir), ''));
        } else if (this.draftsDir && oldPath.startsWith(this.draftsDir)) {
          oldCommentsPath = joinPath(this.commentsDir, oldPath.substring(0, oldPath.lastIndexOf('.')).replace(pathDirname(this.draftsDir), ''));
          newCommentsPath = joinPath(this.commentsDir, newPath.substring(0, newPath.lastIndexOf('.')).replace(pathDirname(this.contentDir), ''));
        } else if (this.draftsDir && newPath.startsWith(this.draftsDir)) {
          oldCommentsPath = joinPath(this.commentsDir, oldPath.substring(0, oldPath.lastIndexOf('.')).replace(pathDirname(this.contentDir), ''));
          newCommentsPath = joinPath(this.commentsDir, newPath.substring(0, newPath.lastIndexOf('.')).replace(pathDirname(this.draftsDir), ''));
        } else {
          oldCommentsPath = joinPath(this.commentsDir, oldPath.substring(0, oldPath.lastIndexOf('.')).replace(pathDirname(this.contentDir), ''));
          newCommentsPath = joinPath(this.commentsDir, newPath.substring(0, newPath.lastIndexOf('.')).replace(pathDirname(this.contentDir), ''));
        }

        if (oldCommentsPath !== newCommentsPath) {
          const commentsFolderExists = await exists(oldCommentsPath);

          console.log(oldCommentsPath, newCommentsPath, commentsFolderExists);

          // if so, ensure newPath exists and move the file
          if (commentsFolderExists) {
            try {
              await mkdirp(pathDirname(newCommentsPath));
              await fs.rename(oldCommentsPath, newCommentsPath);
              this.$store.state.application.locallyChangedFiles.forEach((path) => {
                if (path.startsWith(oldCommentsPath)) {
                  this.$store.commit('removeLocallyChangedFile', path);
                  this.$store.commit('addLocallyChangedFile', path.replace(oldCommentsPath, newCommentsPath));
                }
              });
            } catch (err) {
              this.$store.commit('addToast', { message: `Something went wrong while renaming or moving the comments for this file: ${err.message}`, type: 'error' });
            }
          }
        }
      } else {
        const oldDraftPath = joinPath(this.draftsDir, oldPath.replace(this.contentDir, ''));
        const newDraftPath = joinPath(this.draftsDir, newPath.replace(this.contentDir, ''));
        const oldCommentsPath = joinPath(this.commentsDir, oldPath.replace(pathDirname(this.contentDir), ''));
        const newCommentsPath = joinPath(this.commentsDir, newPath.replace(pathDirname(this.contentDir), ''));
        const folderExistsInComments = await exists(oldCommentsPath);
        console.log(oldCommentsPath, newCommentsPath, folderExistsInComments);

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

        if (folderExistsInComments) {
          try {
            await mkdirp(pathDirname(newCommentsPath));
            await fs.rename(oldCommentsPath, newCommentsPath);
          } catch (err) {
            this.$store.commit('addToast', { message: `Something went wrong while renaming or moving the corresponding folder in the comments directory: ${err.message}`, type: 'error' });
          }
        }

        this.$store.state.application.locallyChangedFiles.forEach((path) => {
          if (path.startsWith(oldPath)) {
            this.$store.commit('removeLocallyChangedFile', path);
            this.$store.commit('addLocallyChangedFile', path.replace(oldPath, newPath));
          } else if (path.startsWith(oldDraftPath)) {
            this.$store.commit('removeLocallyChangedFile', path);
            this.$store.commit('addLocallyChangedFile', path.replace(oldDraftPath, newDraftPath));
          } else if (path.startsWith(oldCommentsPath)) {
            this.$store.commit('removeLocallyChangedFile', path);
            this.$store.commit('addLocallyChangedFile', path.replace(oldCommentsPath, newCommentsPath));
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
      else this.moveRootDir = this.contentDir;

      this.entityBeingModified = path;
      this.showEntityMove = true;
    },
    openContentItem(path) {
      this.$router.push({ name: 'Edit Content', params: { collection: pathBasename(this.$route.params.path), id: this.$store.state.currentProject.id, path } });
    },
    renameEntity(path) {
      this.entityBeingModified = path;
      this.showEntityRename = true;
    },
    async toggleDraft(path) {
      const isDraft = path.startsWith(this.draftsDir);
      let newPath;
      if (isDraft) { // we’re trying to publish a post, we need to validate it
        const valid = await this.validateContent(path);
        if (!valid) { // if it’s not valid, warn and abort
          this.$store.commit('addToast', { message: `At least one of the fields in this ${pluralize.singular(this.collection.name)} has errors, please fix them before publishing.`, type: 'negative' });
          return;
        }
        newPath = path.replace(this.draftsDir, this.contentDir); // we do not need to ensure that newPath exists here, because a draft in a folder that only exists in draftsDir wouldn’t show up here
      } else {
        newPath = joinPath(this.draftsDir, path.replace(this.contentDir, ''));
        await mkdirp(pathDirname(newPath)); // ensure new path exists in the draftsDir
      }
      const existsAlready = await exists(newPath);

      if (existsAlready) {
        this.$store.commit('addToast', { message: `A ${!isDraft ? 'draft' : pluralize.singular(this.collection.name)} with this name exists already, please rename it and try again`, type: 'warning' });
      } else {
        await fs.rename(path, newPath);
        this.handleEntityRenamed({ oldPath: path, newPath });
      }
    },
    async validateContent(path) {
      try {
        const rawFile = await fs.readFile(path, 'utf8');
        let content;
        if (this.collection.type === 'json') content = JSON.parse(rawFile);
        else if (this.collection.type === 'md') {
          const { content: fileContent, data } = matter(rawFile);
          content = { ...data, content: fileContent.trim() }; // fileContent might have leading / trailing newline characters which we’ll strip out here
        }

        if (!content || !content.___mb_schema) {
          this.$store.commit('addToast', { message: `This ${pluralize.singular(this.collection.name)} has no Schema assigned to it`, type: 'warning' });
          return false;
        }

        const schema = JSON.parse(await fs.readFile(joinPath(this.projectDir, content.___mb_schema), 'utf8'));
        const languages = getContentLanguages(content, schema, this.$store.state.currentProject.languages);

        const errors = validateContent(content, schema, languages);
        return errors.size === 0;
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while validating the content: ${err.message}`, type: 'error' });
        return false;
      }
    },
  },
  mixins: [isPrivilegedUser, updateLocallyChangedFiles],
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'

.collection
  height: 100%
  overflow-x: hidden
  padding: (27 / 16)rem 2rem 8rem 2rem

  @media $tablet
    padding-top: 0
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

  .unconfigured-state
    text-align: center

    &.dark
      h2,
      p
        color: $text-secondary-dark

    h2,
    p
      color: $text-secondary

    h2
      margin-top: 8rem

    p
      margin-bottom: 2rem

</style>
