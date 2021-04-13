<template lang="html">
  <div class="edit-schema">
    <header>
      <div class="left">
        <h1>{{schema.name}}</h1>
        <MbChip :color="status.color" :label="status.message" :loading="status.loading" />
      </div>
      <div class="right">
        <MbButton :dark="dark" icon="settings">Settings</MbButton>
        <MbButton :dark="dark" icon="save" :icon-first="true" type="primary">Save</MbButton>
      </div>
    </header>
    <MbTabs v-model="activeTab" :dark="dark" show-add-option :tabs="cleanTabs" @add-tab="handleAddTab" />
    <TabContent :dark="dark" :show-split="fieldBeingEdited" @split-close="fieldBeingEdited = null">
      <div class="empty-state">
        <h2>There’s nothing here yet</h2>
        <p>This schema currently has no fields. You can start adding some with the button below, or have Mattrbld automatically generate a set of fields for you based on a piece of content.</p>
        <footer>
          <MbButton :dark="dark" icon="document">Generate from content</MbButton>
          <MbButton :dark="dark" icon="plus" type="positive">Add field</MbButton>
        </footer>
      </div>
    </TabContent>
  </div>
</template>

<script>
import { status } from 'isomorphic-git';
import fs, { PlainFS } from '../fs';

import TabContent from '../components/utility/TabContent.vue';

export default {
  async beforeRouteEnter(to, from, next) {
    try {
      const { id, path } = to.params;
      const schema = JSON.parse(await fs.readFile(path, 'utf8'));
      const fileStatus = await status({ fs: PlainFS, dir: `/projects/${id}`, filepath: path.replace(`/projects/${id}/`, '') }); // filepath needs to be relative

      return next((vm) => {
        vm.schema = schema; // eslint-disable-line no-param-reassign
        vm.fileStatus = fileStatus; // eslint-disable-line no-param-reassign
      });
    } catch (err) {
      if (err.code === 'ENOENT') return next({ name: 'NotFound' });
      return next({ name: 'Error', params: { code: err.code, message: err.message, name: err.name } });
    }
  },
  components: {
    TabContent,
  },
  computed: {
    cleanTabs() {
      if (!this.schema.tabs) return [];
      return this.schema.tabs.map((tab) => tab.label);
    },
    isMobile() {
      return this.$store.state.application.mobile;
    },
    status() {
      if (!this.fileStatus) return { color: 'warning', loading: true };
      if (this.fileStatus !== 'unmodified') return { color: 'warning', message: 'local changes' };
      return { color: 'positive', message: 'synchronised' };
    },
  },
  data() {
    return {
      activeTab: 0,
      fieldBeingEdited: null,
      fileStatus: null,
      schema: {},
    };
  },
  methods: {
    handleAddTab() {
      console.log('new tab at index');
    },
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'

.edit-schema // 100% minus the height of the app-header
  height: "calc(100vh - %s)" % (116 / 16)rem
  user-select: none

  @media $tablet
    height: "calc(100vh - %s)" % (84 / 16)rem

  @media $mobile
    height: "calc(100vh - %s)" % (82 / 16)rem

  header
    display: flex
    padding: 0 2rem 2rem 2rem

    @media $mobile
      padding: 1rem
      padding-top: 0
      display: block

    .left
      display: flex
      align-items: center
      margin-right: auto

      @media $mobile
        margin-bottom: 1rem
        display: block

      h1
        margin: 0
        margin-right: 1.5rem
        margin-left: 1rem

        @media $tablet
          margin-left: 0

        @media $mobile
          font-size: 1.5rem
          margin-right: 1rem
          margin-bottom: 0.5rem

    .right
      display: flex
      align-items: center
      align-self: flex-start
      overflow: hidden
      margin-left: 1rem

      @media $mobile
        margin-left: 0

      .button
        @media $tablet
          width: 100%

        &:not(:last-child)
          margin-right: 1rem

  .tabs
    position: sticky
    top: 0
    z-index: 1

  .tab-content
    height: "calc(100% - %s)" % ((84 + 56) / 16)rem // header + tabs

    @media $mobile
      height: auto

    .empty-state
      max-width: 40rem
      margin-top: 8rem
      margin-left: auto
      margin-right: auto

      footer
        .button:not(:last-child)
          margin-right: 1rem
</style>
