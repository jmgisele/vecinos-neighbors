<template lang="html">
  <div class="media-library">
    <header>
      <h1>Media Library</h1>
      <MbChip v-if="currentProject.media.advanced" label="Advanced" @mouseenter="$store.commit('setTooltip', { position: 'right', message: 'The advanced Media Library is active, metadata will be stored', target: $event.target })" />
    </header>
    <TabContent :dark="dark" :show-split="showSplit" @split-close="showSplit = false" @split-closed="handleSplitClosed">
      <MbFileList v-if="currentProject.media.dir" :action="action" :active-file="fileBeingModified" :dark="dark" :file-actions="fileActions" folders-first pretty-filenames ref="fileList" :root="mediaDir" thumbnails @fileclick="handleFileClick" @list-change="listedFiles = $event.files" @path-change="currentPath = $event" />
      <div v-else class="unconfigured-state" :class="{ dark }">
        <h2>The Media Library hasn’t been configured yet</h2>
        <p v-if="isPrivilegedUser">You can do so in the project settings.</p>
        <p v-else>A developer can do so in the project settings.</p>
        <MbButton v-if="isPrivilegedUser" :dark="dark" icon="wrench-and-driver" type="primary" @click="$router.push({ name: 'Project.Settings', params: { id: currentProject.id }, query: { tab: 'media' }})">Configure now</MbButton>
      </div>

      <template #right>
        <transition mode="out-in">
          <div class="edit-file" :class="{ dark }" :key="fileBeingModified">
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
            </div>
          </div>
        </transition>
      </template>
    </TabContent>
  </div>
</template>

<script>
import { joinPath, pathBasename } from '../fs';

import isPrivilegedUser from '../mixins/isPrivilegedUser';

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
      fileBeingModified: null,
      fileDetails: {
        height: null,
        image: null,
        name: null,
        size: null,
        type: null,
        width: null,
      },
      listedFiles: 0,
      showSplit: false,
    };
  },
  methods: {
    handleFileClick(path, size, imageUrl) {
      if (this.fileBeingModified === path) {
        this.fileBeingModified = null;
        this.showSplit = false;
        return;
      }

      this.fileBeingModified = path;
      this.showSplit = true;
      this.fileDetails.width = null; // need to reset these here before the image / file has a chance to load
      this.fileDetails.height = null; // need to reset these here before the image / file has a chance to load
      this.fileDetails.image = imageUrl;
      this.fileDetails.name = pathBasename(path);
      this.fileDetails.type = this.fileDetails.name.slice(this.fileDetails.name.lastIndexOf('.') + 1).toUpperCase();
      this.fileDetails.size = size;
    },
    handleSplitClosed() {
      this.fileDetails = {
        height: null,
        image: null,
        name: null,
        size: null,
        type: null,
        width: null,
      };
    },
    setImageResolution(e) {
      const img = e.target;
      this.fileDetails.width = img.naturalWidth;
      this.fileDetails.height = img.naturalHeight;
    },
  },
  mixins: [isPrivilegedUser],
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'
@require '../assets/styles/corners'

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
    max-width: 40rem
    margin-left: auto
    margin-right: auto

</style>
