<template lang="html">
  <SchemaFieldsEditor v-model="customFields" :activated="enableAdvancedLibrary" :active-tab="0" class="media-settings" :dark="dark" no-subfields :project-id="currentProject.id" :tabs="[]">
    <template #beforeFields>
      <section class="wrapper">
        <h1 class="h2">Media Library</h1>
        <p>These settings control how media files are handled in Mattrbld. By default, the <code>src</code> of every media file will match its location in the specified media directory. If you provide an <code>outputPath</code>, it will be used instead.</p>
        <div class="input-row">
          <span class="label">Upload directory:</span>
          <MbFilePicker v-model="dir" :dark="dark" relative-to-root :root="`/projects/${currentProject.id}`" />
        </div>
        <div class="input-row">
          <span class="label">Output path:</span>
          <MbInput v-model="outputPath" :dark="dark" placeholder="e.g. /uploads" />
        </div>
        <h3>Permissions</h3>
        <MbPermissionsList v-model="permissions" :permissions="availablePermissions" :roles="roles" />
      </section>
      <section class="wrapper">
        <h2>Advanced Media Library</h2>
        <p>If this setting is enabled, metadata for media files will be saved alongside them. This will create an extra JSON-file for every image with metadata. Fields for <code>alt</code> and <code>title</code> attributes will be added automatically and you can specify additional fields every image should have in the Schema below.</p>
        <MbToggle v-model="enableAdvancedLibrary" :dark="dark" :icons="['cross', 'check']">Enable advanced media library</MbToggle>
      </section>
    </template>
  </SchemaFieldsEditor>
</template>

<script>
import availableRoles from '../../data/availableRoles';

import SchemaFieldsEditor from '../../components/utility/SchemaFieldsEditor.vue';

export default {
  components: {
    SchemaFieldsEditor,
  },
  computed: {
    currentProject() {
      return this.$store.state.currentProject;
    },
    customFields: {
      get() {
        return this.$store.state.currentProject.media.customFields;
      },
      set(v) {
        this.$store.commit('setCurrentProjectProperty', { key: 'media.customFields', value: v });
        this.$store.dispatch('saveCurrentProject');
      },
    },
    dir: {
      get() {
        return this.$store.state.currentProject.media.dir;
      },
      set(v) {
        this.$store.commit('setCurrentProjectProperty', { key: 'media.dir', value: v });
        this.$store.dispatch('saveCurrentProject');
      },
    },
    enableAdvancedLibrary: {
      get() {
        return this.$store.state.currentProject.media.advanced;
      },
      set(v) {
        this.$store.commit('setCurrentProjectProperty', { key: 'media.advanced', value: v });
        this.$store.dispatch('saveCurrentProject');
      },
    },
    outputPath: {
      get() {
        return this.$store.state.currentProject.media.outputPath;
      },
      set(v) {
        this.$store.commit('setCurrentProjectProperty', { key: 'media.outputPath', value: v });
        this.$store.dispatch('saveCurrentProject');
      },
    },
    permissions: {
      get() {
        return this.$store.state.currentProject.media.permissions;
      },
      set(v) {
        this.$store.commit('setCurrentProjectProperty', { key: 'media.permissions', value: v });
        this.$store.dispatch('saveCurrentProject');
      },
    },
    roles() {
      return [{ label: 'Everybody', value: 'everybody' }, ...availableRoles, ...this.currentProject.customRoles];
    },
  },
  async created() {
    // foo
  },
  data() {
    return {
      availablePermissions: [
        { label: 'upload media', value: 'upload' },
        { label: 'create folders', value: 'createFolder' },
        { label: 'delete media', value: 'deleteMedia' },
        { label: 'delete folders', value: 'deleteFolder' },
        { label: 'edit media', value: 'editMedia' },
        { label: 'edit folders', value: 'editFolder' },
        { label: 'do everything', value: 'everything' },
      ],
    };
  },
  methods: {
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

.media-settings
  user-select: none

  .wrapper
    max-width: 40rem
    margin-left: auto
    margin-right: auto

    &:not(:last-of-type)
      margin-bottom: 8rem

      @media $mobile
        margin-bottom: 4rem

    .input-row
      display: flex
      align-items: center
      margin-bottom: 1rem

      @media $mobile
        flex-wrap: wrap
        margin-bottom: 2rem

      > span:first-child
        margin-right: auto
        white-space: nowrap

      > :last-child:not(:only-child)
        margin-left: 1rem
        margin-top: 0
        width: 100%
        max-width: (400 / 16)rem

        @media $mobile
          margin-left: 0
          margin-top: 0.5rem
          width: 100%

    .toggle
      margin-bottom: 1rem

  &::v-deep(.content-wrapper)
    > .empty-state,
    > .added-fields-list
      margin-top: 2rem
</style>
