<template lang="html">
  <div class="media-library">
    <header>
      <h1>Media Library</h1>
      <MbChip v-if="currentProject.media.advanced" label="Advanced" @mouseenter="$store.commit('setTooltip', { position: 'right', message: 'The advanced Media Library is active, metadata will be stored', target: $event.target })" />
    </header>
    <TabContent :dark="dark" :show-split="showSplit" @split-close="entityBeingModified = null" @split-closed="handleSplitClosed">
      <MbFileList v-if="currentProject.media.dir" :action="action" :active-file="entityBeingModified" :dark="dark" :file-actions="fileActions" file-list-label="Media Files" folders-first pretty-filenames ref="fileList" :root="mediaDir" thumbnails @fileclick="handleFileClick" @list-change="listedFiles = $event.files" @path-change="currentPath = $event" />
      <div v-else class="unconfigured-state" :class="{ dark }">
        <h2>The Media Library hasn’t been configured yet</h2>
        <p v-if="isPrivilegedUser">You can do so in the project settings.</p>
        <p v-else>A developer can do so in the project settings.</p>
        <MbButton v-if="isPrivilegedUser" :dark="dark" icon="wrench-and-driver" type="primary" @click="$router.push({ name: 'Project.Settings', params: { id: currentProject.id }, query: { tab: 'media' }})">Configure now</MbButton>
      </div>
      <input type="file" ref="replaceFileInput" @change="handleReplaceFileInput">

      <template #right="{ isModal }">
        <transition mode="out-in">
          <div v-show="showSplit" class="edit-file" :class="{ dark }" :key="entityBeingModified">
            <div v-if="fileDetails.image" class="thumbnail">
              <img :src="fileDetails.image" :alt="fileDetails.alt || 'Error loading file'" @load="setImageResolution">
            </div>
            <dl v-show="fileDetails.name" class="meta">
              <dl>
                <dt>Name:</dt>
                <dd>{{fileDetails.name}}</dd>
              </dl>
              <dl v-show="fileDetails.width !== null && fileDetails.height !== null">
                <dt>Resolution:</dt>
                <dd>{{fileDetails.width}}x{{fileDetails.height}}</dd>
              </dl>
              <dl>
                <dt>Size:</dt>
                <dd>{{fileDetails.size}}</dd>
              </dl>
              <dl>
                <dt>Type:</dt>
                <dd>{{fileDetails.type}}</dd>
              </dl>
            </dl>
            <div class="data">
              <MbFieldsEditor v-if="currentProject.media.advanced && imageRegExp.test(entityBeingModified) && (userPermissions.has('everything') || userPermissions.has('editMedia'))" :dark="dark" compact :fields="currentProject.media.customFields" in-split :model-value="fileDetails.meta" @update:model-value="updateMediaMetaFile" />
              <MbHighlightBox v-if="userPermissions.has('everything') || userPermissions.has('editMedia')" class="replacement" :class="{ 'in-modal': isModal }" :dark="dark" label="Replace File">
                <p>Replacing a file allows you to change its contents without having to update all content items that refer to it, since the path will remain unchanged.</p>
                <MbButton :dark="dark" icon="replace-alt" @click="replaceFile">Replace</MbButton>
              </MbHighlightBox>
              <MbHighlightBox v-if="userPermissions.has('everything') || userPermissions.has('deleteMedia')" :class="{ 'in-modal': isModal }" color="negative" :dark="dark" label="Delete File">
                <p>Please note that deleting a file will <strong>not</strong> remove it from content items that reference it! <strong>Make sure to update those as well</strong> to avoid broken links.</p>
                <MbButton :dark="dark" icon="trash" type="negative" @click="deleteEntity(entityBeingModified)">Delete</MbButton>
              </MbHighlightBox>
            </div>
          </div>
        </transition>
      </template>
    </TabContent>

    <EntityMoveModal :dark="dark" :old-path="entityBeingModified" pretty-filenames :root="mediaDir" :visible="showEntityMove" @close="showEntityMove = false; if (!showSplit) entityBeingModified = null" @entity-moved="handleEntityMoved" />
    <EntityRenameModal :dark="dark" :old-path="entityBeingModified" :visible="showEntityRename" @close="showEntityRename = false; if (!showSplit) entityBeingModified = null" @entity-renamed="handleEntityRenamed" />
    <MbModal class="creation-modal" :dark="dark" :permanent="type === 'uploading'" :title="action && action.label !== 'Add' ? action.label : 'Add new…'" :visible="showEntityCreation" @after-close="resetEntityCreation" @close="showEntityCreation = false">
      <MbSegmentedSelector v-if="userPermissions.has('everything') || (userPermissions.has('upload') && userPermissions.has('createFolder'))" v-model="type" :dark="dark" :options="[{ label: 'Upload', value: 'upload' }, { label: 'Folder', value: 'directory' }]" />
      <transition mode="out-in">
        <div v-if="type === 'directory'" class="input-group">
          <MbInput v-model="newFolderName" :dark="dark" :error="newFolderError" icon="folder-add" label="Name" :max-len="255" ref="nameInput" @keyup.ctrl.enter="createFolder" @update:model-value="validateNewFolderName" />
          <p class="name-hint" :class="{ dark, hidden: !newFolderName || newFolderError }">Will be created as: <strong>{{slugifiedNewFolderName}}</strong></p>
        </div>
        <div v-else-if="type === 'uploading'" class="uploading">
          <MbLoader />
        </div>
        <div v-else class="dropzone" :class="{ dark, 'drag-active': dragActive }" @dragenter.prevent="dragActive = true" @dragover.prevent @dragleave="dragActive = false" @drop="handleDrop">
          <p>Drop image files here to upload them, or select some by clicking the button below</p>
          <MbButton :dark="dark" icon="upload" @click="selectFiles('modalFileInput')">Select files</MbButton>
          <input multiple type="file" ref="modalFileInput" @change="handleFileInput">
        </div>
      </transition>
      <template #actions>
        <MbButton :dark="dark" :disabled="type === 'uploading'" @click="showEntityCreation = false">Cancel</MbButton>
        <transition>
          <MbButton v-if="type === 'directory'" :dark="dark" :disabled="!newFolderName || Boolean(newFolderError)" type="primary" @click="createFolder">Create</MbButton>
        </transition>
      </template>
    </MbModal>
  </div>
</template>

<script>
import { debounce } from 'lodash-es';
import slugify from '@sindresorhus/slugify';
import fs, { exists, joinPath, mkdirp, pathBasename, pathDirname } from '../fs'; // eslint-disable-line object-curly-newline
import { rmrf } from '../fs/workerFS';

import generateDefaultContentFromSchema from '../assets/js/generateDefaultContentFromSchema';
import humanReadableSize from '../assets/js/humanReadableSize';
import prettifyEntityName from '../assets/js/prettifyEntityName';

import isPrivilegedUser from '../mixins/isPrivilegedUser';
import updateLocallyChangedFiles from '../mixins/updateLocallyChangedFiles';

import EntityMoveModal from '../components/utility/EntityMoveModal.vue';
import EntityRenameModal from '../components/utility/EntityRenameModal.vue';
import TabContent from '../components/utility/TabContent.vue';

export default {
  beforeUnmount() {
    window.removeEventListener('dragenter', this.handleWindowDragEnter);
    window.removeEventListener('dragover', this.preventWindowDragEvent);
    window.removeEventListener('dragleave', this.handleWindowDragLeave);
    window.removeEventListener('drop', this.preventWindowDragEvent);
  },
  components: {
    EntityMoveModal,
    EntityRenameModal,
    TabContent,
  },
  computed: {
    action() {
      if (this.userPermissions.has('everything') || this.userPermissions.has('createFolder') || this.userPermissions.has('upload')) {
        let label;
        if (this.userPermissions.has('everything') || (this.userPermissions.has('createFolder') && this.userPermissions.has('upload'))) label = 'Add';
        else if (this.userPermissions.has('createFolder')) label = 'Add folder';
        else if (this.userPermissions.has('upload')) label = 'Upload files';

        return {
          callback: () => { this.showEntityCreation = true; },
          label,
          icon: label.includes('Add') ? 'plus' : 'upload',
          iconFirst: true,
          type: 'primary',
        };
      }
      return null;
    },
    currentProject() {
      return this.$store.state.currentProject;
    },
    fileActions() {
      const actions = [];

      if (this.userPermissions.has('everything')) {
        actions.push(
          {
            action: this.replaceFile,
            label: 'Replace',
            icon: 'replace-alt',
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

      if (this.userPermissions.has('editMedia')) {
        actions.push(
          {
            action: this.replaceFile,
            label: 'Replace',
            icon: 'replace-alt',
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

      if (this.userPermissions.has('deleteMedia')) {
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
    mediaDir() {
      return joinPath('/projects', this.currentProject.id, this.currentProject.media.dir);
    },
    slugifiedNewFolderName() {
      return slugify(this.newFolderName, this.$store.state.currentProject.slugifyOptions || { lowercase: false, decamelize: false, preserveLeadingUnderscore: true });
    },
    userPermissions() {
      if (!this.currentProject.media.permissions || !this.$store.getters.userInCurrentProject) return new Set();

      const { role } = this.$store.getters.userInCurrentProject;

      return new Set([
        ...(this.currentProject.media.permissions.everybody || []),
        ...(this.currentProject.media.permissions[role] || []),
      ]);
    },
  },
  created() {
    window.addEventListener('dragenter', this.handleWindowDragEnter);
    window.addEventListener('dragover', this.preventWindowDragEvent);
    window.addEventListener('dragleave', this.handleWindowDragLeave);
    window.addEventListener('drop', this.preventWindowDragEvent);
  },
  data() {
    return {
      currentPath: '/',
      dragActive: false,
      entityBeingModified: null,
      fileDetails: {
        height: null,
        image: null,
        meta: null,
        name: null,
        size: null,
        type: null,
        width: null,
      },
      imageRegExp: /\.(gif|jpg|jpeg|tiff|png|webp|svg)$/i,
      listedFiles: 0,
      newFolderError: '',
      newFolderName: '',
      showEntityCreation: false,
      showEntityMove: false,
      showEntityRename: false,
      showSplit: false,
      type: 'upload',
    };
  },
  methods: {
    async createFolder() {
      await this.validateNewFolderName();

      if (this.newFolderError) return;

      const { newFolderName: name, currentPath: path } = this;

      try {
        await fs.mkdir(joinPath(path, name));
        this.$refs.fileList.refresh();
        this.showEntityCreation = false;
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while creating the directory: ${err.message}`, type: 'error' });
      }
    },
    async deleteEntity(path) {
      const timeout = 5000;
      const isFile = (await fs.stat(path)).isFile();
      const timeoutId = window.setTimeout(async () => {
        try {
          await rmrf(path);
          if (this.$refs.fileList) await this.$refs.fileList.refresh();
          if (isFile) this.$store.commit('removeLocallyChangedFile', path);
          else this.$store.commit('removeLocallyChangedFolder', path);
          this.$store.dispatch('saveAppData');
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while deleting the ${isFile ? 'schema' : 'folder'}: ${err.message}`, type: 'error' });
        } finally {
          window.clearTimeout(timeoutId);
          this.$store.commit('removeFromSoftDeleted', path);
        }
      }, timeout);

      if (path === this.entityBeingModified) this.entityBeingModified = null;
      this.$store.commit('addToSoftDeleted', path);
      this.$store.commit('addToast', {
        action: () => {
          window.clearTimeout(timeoutId);
          this.$store.commit('removeFromSoftDeleted', path);
        },
        actionLabel: 'Undo',
        message: isFile ? `The file “${prettifyEntityName(pathBasename(path))}” was deleted` : 'The folder and all files within have been deleted',
        timeout: timeout - 200,
        type: 'warning',
      });
    },
    handleDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      const files = [...e.dataTransfer.files];

      this.saveFiles(files);
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
        this.$store.state.application.locallyChangedFiles.forEach((path) => {
          this.$store.commit('removeLocallyChangedFile', path);
          this.$store.commit('addLocallyChangedFile', path.replace(oldPath, newPath));
        });
      }

      this.$store.dispatch('saveAppData');
    },
    async handleFileClick(path, size, imageUrl) {
      if (this.entityBeingModified === path) {
        this.entityBeingModified = null;
        return;
      }

      if (this.currentProject.media.advanced && this.imageRegExp.test(path) && (this.userPermissions.has('everything') || this.userPermissions.has('editMedia'))) {
        const mediaMetaDir = joinPath('/projects', this.currentProject.id, '.mattrbld', 'media');
        const pathInMediaDir = path.replace(this.mediaDir, '');
        try {
          const metadata = JSON.parse(await fs.readFile(joinPath(mediaMetaDir, `${pathInMediaDir}.json`), 'utf8'));
          this.fileDetails.meta = metadata;
        } catch (err) {
          if (err.code !== 'ENOENT') this.$store.commit('addToast', { message: `Something went wrong while reading the metadata for this file: ${err.message}`, type: 'error' });
          else {
            try {
              const mediaMetaDirExists = await exists(joinPath(mediaMetaDir, pathDirname(pathInMediaDir)));
              if (!mediaMetaDirExists) await mkdirp(joinPath(mediaMetaDir, pathDirname(pathInMediaDir)));
              const defaultMeta = generateDefaultContentFromSchema({ fields: this.currentProject.media.customFields }, path.replace(`/projects/${this.currentProject.id}`, ''));
              await fs.writeFile(joinPath(mediaMetaDir, `${pathInMediaDir}.json`), JSON.stringify(defaultMeta, null, 2), 'utf8');
              this.fileDetails.meta = defaultMeta;
            } catch (innerErr) {
              this.$store.commit('addToast', { message: `Something went wrong while creating the metadata file: ${innerErr.message}`, type: 'error' });
            }
          }
        }
      }

      this.entityBeingModified = path;
      this.showSplit = true;
      this.fileDetails.width = null; // need to reset these here before the image / file has a chance to load
      this.fileDetails.height = null; // need to reset these here before the image / file has a chance to load
      this.fileDetails.image = imageUrl;
      this.fileDetails.name = pathBasename(path);
      this.fileDetails.type = this.fileDetails.name.slice(this.fileDetails.name.lastIndexOf('.') + 1).toUpperCase();
      this.fileDetails.size = size;
    },
    handleFileInput(e) {
      this.saveFiles([...e.currentTarget.files]);
      e.currentTarget.value = '';
    },
    async handleReplaceFileInput(e) {
      const replacement = e.currentTarget.files[0];
      e.currentTarget.value = '';

      function getExtension(path) {
        const filename = pathBasename(path);
        return filename.slice((Math.max(0, filename.lastIndexOf('.')) || Infinity) + 1);
      }

      if (!replacement) {
        this.$store.commit('addToast', { message: 'No file was selected, the replacement was aborted', type: 'warning' });
      } else if (getExtension(this.entityBeingModified) !== getExtension(replacement.name)) {
        this.$store.commit('addToast', { message: 'The file could not be replaced because the selected file isn’t of the same type', type: 'negative' });
      } else {
        try {
          const arrayBuffer = await replacement.arrayBuffer();
          const isImage = this.imageRegExp.test(this.entityBeingModified);
          let newUrl;
          fs.writeFile(this.entityBeingModified, arrayBuffer);
          this.$store.commit('addLocallyChangedFile', this.entityBeingModified);

          if (isImage) {
            newUrl = URL.createObjectURL(replacement);
            this.$refs.fileList.replaceThumbnail(this.entityBeingModified, newUrl);
          }

          if (this.showSplit) {
            if (isImage) {
              this.fileDetails.width = null; // need to reset these here before the image / file has a chance to load
              this.fileDetails.height = null; // need to reset these here before the image / file has a chance to load
              this.fileDetails.image = newUrl;
            }
            this.fileDetails.size = humanReadableSize(replacement.size);
          } else this.entityBeingModified = null;
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while replacing the file: ${err.message}`, type: 'error' });
        }
      }
    },
    handleSplitClosed() {
      this.fileDetails = {
        height: null,
        image: null,
        meta: null,
        name: null,
        size: null,
        type: null,
        width: null,
      };
    },
    handleWindowDragEnter(e) {
      e.preventDefault();
      if ((this.userPermissions.has('everything') || this.userPermissions.has('upload')) && (!this.showEntityCreation || this.type === 'directory')) {
        this.type = 'upload';
        this.showEntityCreation = true;
      }
    },
    handleWindowDragLeave(e) {
      e.preventDefault();

      if (
        this.showEntityCreation && this.type === 'upload'
        && e.clientX === 0 && e.clientY === 0 // clientX and clientY are 0 if outside of the window
      ) this.showEntityCreation = false;
    },
    preventWindowDragEvent(e) {
      e.preventDefault();
    },
    moveEntity(path) {
      this.entityBeingModified = path;
      this.showEntityMove = true;
    },
    renameEntity(path) {
      this.entityBeingModified = path;
      this.showEntityRename = true;
    },
    replaceFile(path) {
      if (typeof path === 'string') this.entityBeingModified = path;
      this.selectFiles('replaceFileInput');
      // TODO: entityBeingModified doesn’t get reset when cancel is clicked in the dialog, but detecting that reliably is impossible. Maybe something will show up in the future
    },
    resetEntityCreation() {
      this.dragActive = false;
      this.newFolderError = '';
      this.newFolderName = '';
      this.type = 'upload';
    },
    async saveFiles(files) {
      try {
        const arrayBuffers = await Promise.allSettled(files.map((file) => file.arrayBuffer()));
        const existingFiles = await fs.readdir(this.currentPath);
        const writePromises = [];

        files.forEach((file, index) => {
          if (!arrayBuffers[index].value) this.$store.commit('addToast', { message: `“${file.name}” was not uploaded because it is a folder`, type: 'warning' });
          else if (existingFiles.includes(file.name)) this.$store.commit('addToast', { message: `The file “${file.name}” was not uploaded because it already exists in this folder`, type: 'warning' });
          else writePromises.push(fs.writeFile(joinPath(this.currentPath, file.name), arrayBuffers[index].value));
        });

        await Promise.all(writePromises);

        files.forEach((file) => this.$store.commit('addLocallyChangedFile', joinPath(this.currentPath, file.name)));
        await this.$store.dispatch('saveAppData');
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while saving files: ${err.message}`, type: 'error' });
      }

      this.dragActive = false;
      this.showEntityCreation = false;
      this.$refs.fileList.refresh();
    },
    selectFiles(inputRef) {
      this.$refs[inputRef].click();
    },
    setImageResolution(e) {
      const img = e.target;
      this.fileDetails.width = img.naturalWidth;
      this.fileDetails.height = img.naturalHeight;
    },
    updateMediaMetaFile: debounce(async function (newMeta) { // eslint-disable-line func-names
      const mediaMetaDir = joinPath('/projects', this.currentProject.id, '.mattrbld', 'media');
      const pathInMediaDir = this.entityBeingModified.replace(this.mediaDir, '');
      this.fileDetails.meta = newMeta;
      await fs.writeFile(joinPath(mediaMetaDir, `${pathInMediaDir}.json`), JSON.stringify(newMeta, null, 2), 'utf8');
    }, 500),
    validateNewFolderName: debounce(async function () { // eslint-disable-line func-names
      let existingEntities = [];
      try {
        existingEntities = await fs.readdir(this.currentPath);
      } catch (err) {
        // don’t do anything, it’ll fail and be handled when trying to create
      }

      if (!this.slugifiedNewFolderName) this.newFolderError = 'A name is required';
      else if (this.slugifiedNewFolderName.length > 255) this.newFolderError = 'Name is too long';
      else if (existingEntities.length > 0 && existingEntities.includes(this.slugifiedNewFolderName)) this.newFolderError = 'A folder with this name already exists';
      else this.newFolderError = '';
    }, 250, { leading: true }),
  },
  mixins: [isPrivilegedUser, updateLocallyChangedFiles],
  props: {
    dark: Boolean,
  },
  watch: {
    entityBeingModified(nv) {
      if (nv === null && this.showSplit) this.showSplit = false;
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.media-library
  user-select: none
  height: 100%
  display: flex
  flex-direction: column
  padding-top: (27 / 16)rem // HACK: to align the baseline of the heading with the bottom line of the avatar

  @media $tablet
    padding-top: 0

  header
    display: flex
    align-items: center
    margin-bottom: 2rem
    padding: 0 2rem

    @media $mobile
      flex-wrap: wrap

    h1
      margin: 0

      @media $mobile
        margin-top: 0.5rem
        margin-right: 1rem

    .chip
      margin-left: 1rem

      @media $mobile
        margin-left: 0
        margin-top: 0.5rem

  .tab-content
    flex-grow: 1

    &::v-deep(.content-wrapper.right)
      &.padded
        padding: 0

      .close-wrapper
        .close-button
          right: 1rem

          &:not(:hover):not(:focus):not(:active)
            background-color: alpha($bg, 0.75)

            &.dark
              background-color: alpha($bg-dark, 0.75)

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

    input[type=file]
      display: none

.edit-file
  &.v-enter-active,
  &.v-leave-active
    transition: opacity 200ms ease

    &.v-enter-from,
    &.v-leave-to
      opacity: 0

  &.dark
    .thumbnail
      background-image: linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,0.9)), linear-gradient(to right, black 50%, white 50%), linear-gradient(to bottom, black 50%, white 50%)

    .meta
      background-color: darken($bg-secondary-dark, 2)

      dl dt
        color: $text-secondary-dark

  .thumbnail
    color: $text-dark
    height: 30rem
    display: flex
    align-items: center
    justify-content: center
    background-image: linear-gradient(to right, rgba(0,0,0,0.75), rgba(0,0,0,0.75)), linear-gradient(to right, black 50%, white 50%), linear-gradient(to bottom, black 50%, white 50%)
    background-size: 1.5rem 1.5rem
    background-blend-mode: normal, difference
    position: relative

    @media $mobile
      height: 12rem
      margin-top: -1rem
      border-top-left-radius: $radius-m
      border-top-right-radius: $radius-m

    .icon,
    img
      &.v-enter-active,
      &.v-leave-active
        position: absolute
        transition: opacity 200ms ease

        &.v-enter-from,
        &.v-leave-to
          opacity: 0

    .icon
      margin: 0
      width: 3rem
      height: @width

    img
      max-width: 100%
      max-height: 100%

      &.hidden
        opacity: 0

  .meta
    background-color: $bg-secondary
    margin: 0
    padding: 1rem 4rem
    display: flex
    justify-content: center

    dl
      margin: 0
      overflow: hidden
      flex-shrink: 0

      &:first-child
          flex-shrink: 1

      &:not(:last-child)
        margin-right: 4rem

      dt,
      dd
        margin: 0
        white-space: nowrap
        overflow: hidden
        text-overflow: ellipsis

      dt
        color: $text-secondary
        font-size: 0.875rem

    @media $mobile
      display: block
      padding: 1rem
      border-bottom-left-radius: $radius-m
      border-bottom-right-radius: $radius-m

      dl:not(:last-child)
        margin-right: 0
        margin-bottom: 0.5rem

  .data
    max-width: 44rem
    margin-left: auto
    margin-right: auto
    padding: 2rem

    @media $mobile
      padding-left: 0
      padding-right: 0

    .fields-editor
      margin-bottom:  4rem

    .highlight-box
      &.dark:not(.in-modal)
        background-color: $bg-secondary-dark

      .button
        display: flex
        margin-left: auto

    .replacement
      margin-bottom: 4rem

.creation-modal
  .segmented-selector
    margin-bottom: 2rem

  .input-group,
  .dropzone,
  .button
    &.v-enter-active,
    &.v-leave-active
      transition: opacity 200ms ease

      &.v-enter-from,
      &.v-leave-to
        opacity: 0

  .input-group
    .input
      width: 100%
      margin-bottom: 0.5rem

    .name-hint
      color: $text-secondary
      margin: 0
      font-size: 0.875rem
      transition: opacity 200ms ease

      &.dark
        color: $text-secondary-dark

      &.hidden
        opacity: 0

  .dropzone
    border: 0.125rem dashed $accent-secondary
    padding: 2rem
    text-align: center
    border-radius: $radius-l

    &.drag-active
      background-color: $bg-secondary

      &.dark
        background-color: $bg-secondary-dark

      .button
        visibility: hidden

    p
      color: $text-secondary
      margin-top: 0
      margin-bottom: 2rem
      pointer-events: none

      &.dark
        color: $text-secondary-dark

    input[type=file]
      display: none

  .uploading
    padding: 2rem

</style>
