<template lang="html">
  <TabContent class="schema-settings" :class="{ dark }" :dark="dark">
    <section class="wrapper wide">
      <h1 class="h2">Schemas</h1>
      <MbFileList v-if="initialised" :action="createSchemaAction" :dark="dark" empty-state="There are no schemas in this folder. Create one!" :file-actions="schemaActions" file-list-label="Schemas" pretty-filenames ref="fileList" :root="schemaDir" @fileclick="openSchema" @path-change="currentPath = $event" />
    </section>
    <EntityCreationModal :dark="dark" :file-content="JSON.stringify(defaultSchemaContent, null, 2)" file-extension="json" :path="currentPath" title="Add new…" :visible="showEntityCreation" @close="showEntityCreation = false" @entity-created="handleEntityCreated" />
    <EntityMoveModal v-if="initialised" :dark="dark" :old-path="entityBeingModified" pretty-filenames :root="schemaDir" :visible="showEntityMove" @close="showEntityMove = false" @entity-moved="handleEntityMoved" />
  </TabContent>
</template>

<script>
import fs, { exists } from '../../fs';
import EntityCreationModal from '../../components/utility/EntityCreationModal.vue';
import EntityMoveModal from '../../components/utility/EntityMoveModal.vue';
import TabContent from '../../components/utility/TabContent.vue';

export default {
  components: {
    EntityCreationModal,
    EntityMoveModal,
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
        label: 'Add schema',
        icon: 'plus',
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
    };
  },
  methods: {
    deleteEntity(path) {
      console.log('delete', path);
    },
    handleEntityCreated(name) {
      if (!name.endsWith('.json')) this.$refs.fileList.refresh();
      else {
        this.$store.commit('addLocallyChangedFile', `${this.currentPath}/${name}`);
        this.$store.dispatch('saveAppData');
        this.openSchema(`${this.currentPath}/${name}`);
      }
    },
    handleEntityMoved({ oldPath, newPath }) {
      this.$refs.fileList.refresh();
      this.entityBeingModified = null;
      this.$store.commit('removeLocallyChangedFile', oldPath);
      this.$store.commit('addLocallyChangedFile', newPath);
      this.$store.dispatch('saveAppData');
    },
    moveEntity(path) {
      this.entityBeingModified = path;
      this.showEntityMove = true;
    },
    openSchema(path) {
      console.log('open', path);
    },
    renameFolder(path) {
      console.log('rename', path);
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
</style>
