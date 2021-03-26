<template lang="html">
  <div class="project-settings">
    <MbTabs v-model="activeTab" :dark="dark" :tabs="tabs" />
  </div>
</template>

<script>
export default {
  beforeRouteEnter(to, from, next) {
    if (to.query.tab) {
      next((vm) => {
        const activeTab = vm.tabs.findIndex((tab) => tab.value === to.query.tab);
        vm.activeTab = Math.max(activeTab, 0); // eslint-disable-line no-param-reassign
      });
    } else next();
  },
  data() {
    return {
      activeTab: 0,
      tabs: [
        { label: 'General Settings', value: 'general' },
        { label: 'Sidebar', value: 'sidebar' },
        { label: 'Collections', value: 'collections' },
        { label: 'Schemas', value: 'schemas' },
        { label: 'Custom Fields', value: 'fields' },
        { label: 'Media Library', value: 'media' },
        { label: 'Users', value: 'users' },
      ],
    };
  },
  props: {
    dark: Boolean,
  },
  watch: {
    $route(nv) {
      if (nv.query.tab) this.activeTab = Math.max(this.tabs.findIndex((tab) => tab.value === nv.query.tab), 0);
      else this.activeTab = 0;
    },
    activeTab(nv) {
      this.$router.push({ query: { tab: this.tabs[nv].value } });
    },
  },
};
</script>

<style lang="stylus" scoped>
.project-settings
  .tabs
    margin-top: (6 / 16)rem // so it’s aligned with the image in the sidebar
</style>
