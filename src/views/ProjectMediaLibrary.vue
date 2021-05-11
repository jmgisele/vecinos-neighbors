<template lang="html">
  <div class="media-library">
    <header>
      <h1>Media Library</h1>
      <MbChip v-if="currentProject.media.advanced" label="Advanced" />
    </header>
    <TabContent :dark="dark" :show-split="showSplit" @split-close="showSplit = false">
      <MbFileList v-if="typeof currentProject.media.dir !== 'undefined'" :action="action" :dark="dark" :file-actions="fileActions" folders-first pretty-filenames ref="fileList" :root="mediaDir" thumbnails @list-change="listedFiles = $event.files" @path-change="currentPath = $event" />
    </TabContent>
  </div>
</template>

<script>
import { joinPath } from '../fs';

import TabContent from '../components/utility/TabContent.vue';

export default {
  components: {
    TabContent,
  },
  computed: {
    action() {
      return {};
    },
    currentProject() {
      return this.$store.state.currentProject;
    },
    fileActions() {
      return [
      ];
    },
    mediaDir() {
      return joinPath('/projects', this.currentProject.id, this.currentProject.media.dir);
    },
  },
  data() {
    return {
      currentPath: '/',
      listedFiles: 0,
      showSplit: false,
    };
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'

.media-library
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
