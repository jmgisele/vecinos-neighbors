<template lang="html">
  <TabContent class="schema-settings" :class="{ dark }" :dark="dark">
    <section class="wrapper wide">
      <h1 class="h2">Schemas</h1>
      <MbFileList v-if="initialised" :action="createSchemaAction" :dark="dark" empty-state="There are no schemas in this folder" :file-actions="schemaActions" file-list-label="Schemas" pretty-filenames ref="fileList" :root="schemaDir" @fileclick="openSchema" @list-change="listedFiles = $event.files" @path-change="currentPath = $event" />
      <MbButton v-show="listedFiles === 0" :dark="dark" icon="plus" type="positive" @click="showEntityCreation = true">Create one</MbButton>
    </section>
    <EntityCreationModal :dark="dark" :file-content="JSON.stringify(defaultSchemaContent, null, 2)" file-extension="json" :path="currentPath" title="Add new…" :visible="showEntityCreation" @close="showEntityCreation = false" @entity-created="handleEntityCreated" />
    <EntityMoveModal v-if="initialised" :dark="dark" :old-path="entityBeingModified" pretty-filenames :root="schemaDir" :visible="showEntityMove" @close="showEntityMove = false; entityBeingModified = null" @entity-moved="handleEntityMoved" />
    <EntityRenameModal :dark="dark" :old-path="entityBeingModified" :visible="showEntityRename" @close="showEntityRename = false; entityBeingModified = null" @entity-renamed="handleEntityRenamed" />
  </TabContent>
</template>

<script>
import fs, { exists, joinPath } from '../../fs';
import { rmrf } from '../../fs/workerFS';
import EntityCreationModal from '../../components/utility/EntityCreationModal.vue';
import EntityMoveModal from '../../components/utility/EntityMoveModal.vue';
import EntityRenameModal from '../../components/utility/EntityRenameModal.vue';
import TabContent from '../../components/utility/TabContent.vue';

export default {
  components: {
    EntityCreationModal,
    EntityMoveModal,
    EntityRenameModal,
    TabContent,
  },
  computed: {
    currentProject() {
      return this.$store.state.currentProject;
    },
    schemaDir() {
      return `/projects/${this.currentProject.id}/.mattrbld/schemas`;
    },
  },
  async created() {
    const dirExists = await exists(this.schemaDir);
    if (!dirExists) await fs.mkdir(this.schemaDir);
    this.initialised = true;
  },
  data() {
    return {
      createSchemaAction: {
        callback: () => { this.showEntityCreation = true; },
        label: 'Add',
        icon: 'plus',
        iconFirst: true,
        type: 'primary',
      },
      currentPath: this.schemaDir,
      defaultSchemaContent: {
        fields: [],
        name: 'Untitled Schema',
        tabs: [{ label: 'Untitled Tab', fieldGroupName: null }],
      },
      entityBeingModified: null,
      initialised: false,
      listedFiles: 0,
      schemaActions: [
        {
          action: this.openSchema,
          label: 'Edit',
          icon: 'pencil',
          filesOnly: true,
        },
        {
          action: this.moveEntity,
          label: 'Move',
          icon: 'arrow-right',
        },
        {
          action: this.renameFolder,
          label: 'Rename',
          icon: 'text-input',
          foldersOnly: true,
        },
        {
          action: this.deleteEntity,
          label: 'Delete',
          icon: 'trash',
          type: 'negative',
        },
      ],
      showEntityCreation: false,
      showEntityMove: false,
      showEntityRename: false,
    };
  },
  methods: {
    deleteEntity(path) {
      const timeout = 5000;
      const isFile = path.endsWith('.json'); // fine since Schemas are always json and there can’t be a folder with .json as a name
      const timeoutId = window.setTimeout(async () => {
        try {
          await rmrf(path);
          await this.$refs.fileList.refresh();
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

      this.$store.commit('addToSoftDeleted', path);
      this.$store.commit('addToast', {
        action: () => {
          window.clearTimeout(timeoutId);
          this.$store.commit('removeFromSoftDeleted', path);
        },
        actionLabel: 'Undo',
        message: `The ${isFile ? 'schema was' : 'folder and all schemas within have been'} deleted`,
        timeout: timeout - 200,
        type: 'warning',
      });
    },
    handleEntityCreated(name) {
      if (!name.endsWith('.json')) this.$refs.fileList.refresh();
      else {
        this.$store.commit('addLocallyChangedFile', `${this.currentPath}/${name}`);
        this.$store.dispatch('saveAppData');
        this.openSchema(`${this.currentPath}/${name}`);
      }
    },
    async handleEntityMoved({ oldPath, newPath }) {
      this.$refs.fileList.refresh();
      this.entityBeingModified = null;

      if (oldPath.endsWith('.json')) {
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
    handleEntityRenamed({ oldPath, newPath }) {
      this.$refs.fileList.refresh();
      this.entityBeingModified = null;

      this.$store.state.application.locallyChangedFiles.forEach((path) => {
        if (path.startsWith(oldPath)) {
          this.$store.commit('removeLocallyChangedFile', path);
          this.$store.commit('addLocallyChangedFile', path.replace(oldPath, newPath));
        }
      });
      this.$store.dispatch('saveAppData');
    },
    moveEntity(path) {
      this.entityBeingModified = path;
      this.showEntityMove = true;
    },
    openSchema(path) {
      this.$router.push({ name: 'Edit Schema', params: { id: this.currentProject.id, path } });
    },
    renameFolder(path) {
      this.entityBeingModified = path;
      this.showEntityRename = true;
    },
    async updateLocallyChangedFiles(path) {
      const entities = await fs.readdir(path);
      return Promise.all(entities.map((entity) => {
        if (entity.endsWith('.json')) return this.$store.commit('addLocallyChangedFile', joinPath(path, entity));
        return this.updateLocallyChangedFiles(joinPath(path, entity));
      }));
    },
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.schema-settings
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
</style>
