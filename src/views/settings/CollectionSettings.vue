<template lang="html">
  <TabContent class="collection-settings" :dark="dark" :show-split="showSplit" @split-close="showSplit = false" @split-closed="handleSplitClosed">
    <section class="wrapper wide">
      <h1 class="h2">Collections</h1>
      <MbFileList v-if="initialised" :action="createCollectionAction" :dark="dark" empty-state="There are no collections yet" :file-actions="collectionActions" file-list-label="Collections" pretty-filenames ref="fileList" :root="collectionDir" @fileclick="openCollectionSettings" @list-change="listedFiles = $event.files" />
      <MbButton v-show="listedFiles === 0" :dark="dark" icon="plus" type="positive" @click="showEntityCreation = true">Create one</MbButton>
    </section>
    <template #right>
      <transition>
        <div v-if="!splitLoading" class="edit-collection" :class="{ dark }">
          <header>
            <h2 :class="{ h3: isMobile }">{{collectionBeingModifiedName}}</h2>
            <span>Edit Collection</span>
          </header>
          <section>
            <h3>Content</h3>
            <div class="input-row">
              <span>Content directory:</span>
              <MbFilePicker v-model="collectionDetails.dir" :dark="dark" placeholder="Select the folder with your content…" :root="`/projects/${currentProject.id}`" />
            </div>
            <div class="input-row schemas">
              <span>Allowed Schemas:</span>
              <MbItemList v-model="collectionDetails.schemas" :dark="dark" :options="availableSchemas" placeholder="Select a Schema…" />
            </div>
            <MbToggle v-model="collectionDetails.linkable" :dark="dark">Allow content in this collection to be linked</MbToggle>
          </section>
          <section>
            <h3>Permissions</h3>
            <MbPermissionsList v-model="collectionDetails.permissions" :dark="dark" :permissions="permissions" :roles="roles" />
          </section>
        </div>
        <MbLoader :class="{ dark }" v-else />
      </transition>
    </template>
    <EntityCreationModal :dark="dark" :file-content="JSON.stringify(defaultCollectionContent, null, 2)" file-extension="json" only="file" :path="collectionDir" title="Add new Collection" :visible="showEntityCreation" @close="showEntityCreation = false" @entity-created="handleCollectionCreated" />
    <EntityRenameModal :dark="dark" :old-path="collectionBeingModified" title="Rename Collection" :visible="showEntityRename" @close="showEntityRename = false; collectionBeingModified = null" @entity-renamed="handleEntityRenamed" />
  </TabContent>
</template>

<script>
import fs, { exists, readdirDeep } from '../../fs';

import prettifyEntityName from '../../assets/js/prettifyEntityName';

import EntityCreationModal from '../../components/utility/EntityCreationModal.vue';
import EntityRenameModal from '../../components/utility/EntityRenameModal.vue';
import TabContent from '../../components/utility/TabContent.vue';

import availableRoles from '../../data/availableRoles';

export default {
  components: {
    EntityCreationModal,
    EntityRenameModal,
    TabContent,
  },
  computed: {
    currentProject() {
      return this.$store.state.currentProject;
    },
    collectionDir() {
      return `/projects/${this.currentProject.id}/.mattrbld/collections`;
    },
    collectionBeingModifiedName() {
      if (!this.collectionBeingModified) return '';
      return prettifyEntityName(this.collectionBeingModified.split('/').slice(-1)[0]);
    },
    isMobile() {
      return this.$store.state.application.mobile;
    },
    roles() {
      return [{ label: 'Everybody', value: 'everybody' }, ...availableRoles, ...this.currentProject.customRoles];
    },
  },
  async created() {
    const dirExists = await exists(this.collectionDir);
    if (!dirExists) await fs.mkdir(this.collectionDir);

    try {
      const schemas = await readdirDeep(`/projects/${this.currentProject.id}/.mattrbld/schemas`);
      this.availableSchemas = schemas.map((schema) => ({ label: prettifyEntityName(schema.split('/').slice(-1)[0]), value: schema }));
    } catch (err) {
      if (err.code !== 'ENOENT') this.$store.commit('addToast', { message: `Something went wrong while trying to get all Schemas: ${err.message}`, type: 'error' }); // it’s okay if /schemas doesn’t exist yet
    }

    this.initialised = true;
  },
  data() {
    return {
      availableSchemas: [],
      collectionActions: [
        {
          action: this.openCollectionSettings,
          label: 'Edit',
          icon: 'pencil',
          filesOnly: true,
        },
        {
          action: this.renameCollection,
          label: 'Rename',
          icon: 'text-input',
        },
        {
          action: this.deleteCollection,
          label: 'Delete',
          icon: 'trash',
          type: 'negative',
        },
      ],
      createCollectionAction: {
        callback: () => { this.showEntityCreation = true; },
        label: 'Add Collection',
        icon: 'plus',
        iconFirst: true,
        type: 'primary',
      },
      defaultCollectionContent: {
        dir: null,
        schemas: [],
        linkable: false,
        permissions: {
          everybody: ['everything'],
        },
      },
      collectionBeingModified: null,
      collectionDetails: {
        dir: null,
        schemas: [],
        linkable: false,
        permissions: {},
      },
      initialised: false,
      listedFiles: 0,
      permissions: [
        { label: 'create content', value: 'createContent' },
        { label: 'create folders', value: 'createFolder' },
        { label: 'delete content', value: 'deleteContent' },
        { label: 'delete folders', value: 'deleteFolder' },
        { label: 'edit content', value: 'editContent' },
        { label: 'edit folders', value: 'editFolder' },
        { label: 'do everything', value: 'everything' },
      ],
      showEntityCreation: false,
      showEntityRename: false,
      showSplit: false,
      splitLoading: false,
    };
  },
  methods: {
    deleteCollection(path) {
      const timeout = 5000;
      const timeoutId = window.setTimeout(async () => {
        try {
          await fs.unlink(path);
          await this.$refs.fileList.refresh();
          this.$store.commit('removeLocallyChangedFile', path);
          this.$store.dispatch('saveAppData');
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while deleting the collection: ${err.message}`, type: 'error' });
        } finally {
          window.clearTimeout(timeoutId);
          this.$store.commit('removeFromSoftDeleted', path);
        }
      }, timeout);

      if (this.collectionBeingModified === path) this.showSplit = false;
      this.$store.commit('addToSoftDeleted', path);
      this.$store.commit('addToast', {
        action: () => {
          window.clearTimeout(timeoutId);
          this.$store.commit('removeFromSoftDeleted', path);
        },
        actionLabel: 'Undo',
        message: 'The collection was deleted',
        timeout: timeout - 200,
        type: 'warning',
      });
    },
    handleCollectionCreated(name) {
      this.$refs.fileList.refresh();
      this.$store.commit('addLocallyChangedFile', `${this.collectionDir}/${name}`);
      this.$store.dispatch('saveAppData');
      this.openCollectionSettings(`${this.collectionDir}/${name}`);
    },
    handleEntityRenamed({ oldPath, newPath }) {
      this.$refs.fileList.refresh();
      this.collectionBeingModified = null;

      this.$store.commit('removeLocallyChangedFile', oldPath);
      this.$store.commit('addLocallyChangedFile', newPath);
      this.$store.dispatch('saveAppData');
    },
    handleSplitClosed() {
      if (!this.showEntityRename) this.collectionBeingModified = null; // split closes when whe rename, but we dont want to reset the collectionBeingModified so we still know which one we’re renaming
      this.collectionDetails.dir = null;
      this.collectionDetails.schemas = [];
      this.collectionDetails.linkable = false;
      this.collectionDetails.permissions = {};
    },
    async openCollectionSettings(path) {
      this.splitLoading = true;
      this.showSplit = true;
      this.collectionDetails = JSON.parse(await fs.readFile(path, 'utf8'));
      this.collectionBeingModified = path;
      this.splitLoading = false;
    },
    renameCollection(path) {
      if (this.showSplit) this.showSplit = false;
      this.collectionBeingModified = path;
      this.showEntityRename = true;
    },
  },
  props: {
    dark: Boolean,
  },
  watch: {
    collectionDetails: {
      async handler() {
        if (!this.showEntityRename && this.collectionBeingModified) { // we don’t want to save empty details after the rename modal shows
          await fs.writeFile(this.collectionBeingModified, JSON.stringify(this.collectionDetails, null, 2), 'utf8');
        }
      },
      deep: true,
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.collection-settings
  user-select: none;

  .wrapper
    max-width: 40rem
    margin-left: auto
    margin-right: auto

    &.wide
      max-width: (960 / 16)rem
      margin-bottom: 8rem

      @media $mobile
        margin-bottom: 4rem

    .file-list
      &::v-deep(.empty-state)
        text-align: center
        margin: 2rem 0

      & + .button
        display: flex
        margin-left: auto
        margin-right: auto

.edit-collection
  &.dark
    header span,
    section h3
        color: $text-secondary-dark

    .file-picker
      background-color: $bg-tertiary-dark

  > header
    margin-top: 8rem
    max-width: 40rem
    margin-left: auto
    margin-right: auto

    @media $tablet
      margin-top: 4rem

    @media $mobile
      margin-top: 0
      text-align: center

    h2
      margin: 0

    span
      color: $text-secondary

  > section
    max-width: 40rem
    margin-left: auto
    margin-right: auto

    &:not(:last-child)
      margin-bottom: 4rem

      @media $mobile
        margin-bottom: 3rem

    h3
      color: $text-secondary

    .input-row
      display: flex
      align-items: center
      margin-bottom: 1rem

      &.schemas
        > span:first-child
          align-self: flex-start
          margin-top: 1rem

        .item-list
          margin-bottom: 1rem

      @media $mobile
        flex-wrap: wrap
        margin-bottom: 2rem

      > span:first-child
        margin-right: auto
        white-space: nowrap

      > :last-child:not(:only-child)
        margin-left: 1rem
        width: 100%
        max-width: (400 / 16)rem

        @media $mobile
          margin-left: 0
          margin-top: 0.5rem
          width: 100%

.loader
  position: absolute
  width: 100%
  height: 100%
  top: 0
  left: 0
  background-color: $bg
  z-index: 1

  &.dark
    background-color: $bg-secondary-dark

  &.v-enter-active,
  &.v-leave-active
    transition: opacity 200ms ease

    &.v-enter-from,
    &.v-leave-to
      opacity: 0

</style>
