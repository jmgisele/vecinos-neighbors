<template lang="html">
  <div class="project-settings">
    <MbTabs v-model="activeTab" :dark="dark" :tabs="tabs" />
    <transition mode="out-in" :name="tabTransition">
      <GeneralSettings v-if="activeTabValue === 'general'" :dark="dark" />
      <SchemaSettings v-else-if="activeTabValue === 'schemas'" :dark="dark" />
      <UserSettings v-else-if="activeTabValue === 'users'" :dark="dark" />
    </transition>
  </div>
</template>

<script>
import GeneralSettings from './settings/GeneralSettings.vue';
import SchemaSettings from './settings/SchemaSettings.vue';
import UserSettings from './settings/UserSettings.vue';

import Store from '../store';
import isPrivilegedUser from '../mixins/isPrivilegedUser';

export default {
  beforeRouteEnter(to, from, next) {
    const { userInCurrentProject } = Store.getters;
    const { customRoles } = Store.state.currentProject;

    let accessLevel = 'editor';
    if (userInCurrentProject.role === 'dev' || userInCurrentProject.role === 'owner') accessLevel = userInCurrentProject.role;
    else if (customRoles.length > 0) {
      const customRole = customRoles.find((existingCustomRole) => existingCustomRole.value === userInCurrentProject.role);
      if (customRole) accessLevel = customRole.accessLevel;
    }

    if (!['dev', 'owner'].includes(accessLevel)) return next({ name: 'Forbidden', replace: true });
    if (to.query.tab) {
      return next((vm) => {
        const activeTab = vm.tabs.findIndex((tab) => tab.value === to.query.tab);
        vm.activeTab = Math.max(activeTab, 0); // eslint-disable-line no-param-reassign
      });
    }
    return next();
  },
  beforeRouteLeave() {
    this.leaving = true; // this is needed so we don’t get redirected to dashboard as soon as we try leaving the project from here
  },
  components: {
    GeneralSettings,
    SchemaSettings,
    UserSettings,
  },
  computed: {
    activeTabValue() {
      return this.tabs[this.activeTab].value;
    },
  },
  data() {
    return {
      activeTab: 0,
      leaving: false,
      tabs: [
        { label: 'General Settings', value: 'general' },
        { label: 'Collections', value: 'collections' },
        { label: 'Schemas', value: 'schemas' },
        { label: 'Custom Fields', value: 'fields' },
        { label: 'Sidebar', value: 'sidebar' },
        { label: 'Dashboard', value: 'dashboard' },
        { label: 'Media Library', value: 'media' },
        { label: 'Users', value: 'users' },
      ],
      tabTransition: 'to-left',
    };
  },
  mixins: [isPrivilegedUser],
  props: {
    dark: Boolean,
  },
  watch: {
    $route(nv) {
      if (nv.query.tab) this.activeTab = Math.max(this.tabs.findIndex((tab) => tab.value === nv.query.tab), 0);
      else this.activeTab = 0;
    },
    activeTab(nv, ov) {
      if (nv > ov) this.tabTransition = 'to-left';
      else this.tabTransition = 'to-right';

      this.$router.push({ query: { tab: this.tabs[nv].value } });
    },
    isPrivilegedUser(nv) {
      if (!this.leaving && !nv) this.$router.replace({ name: 'Project' });
    },
  },
};
</script>

<style lang="stylus" scoped>
.project-settings
  height: 100%
  display: flex
  flex-direction: column
  overflow-x: hidden

  .tabs
    flex-shrink: 0
    margin-top: (6 / 16)rem // so it’s aligned with the image in the sidebar

  .tab-content
    flex-grow: 1

    &.to-left-enter-active,
    &.to-right-leave-active
      transition: transform 200ms cubic-bezier(0.215, 0.610, 0.355, 1.000), opacity 200ms ease

      &::v-deep(.content-wrapper)
        overflow: hidden

      &.to-left-enter-from,
      &.to-right-leave-to
        opacity: 0
        transform: translateX(4rem)

    &.to-left-leave-active,
    &.to-right-enter-active
      transition: transform 200ms cubic-bezier(0.645, 0.045, 0.355, 1.000), opacity 200ms ease

      &::v-deep(.content-wrapper)
        overflow: hidden

      &.to-left-leave-to,
      &.to-right-enter-from
        opacity: 0
        transform: translateX(-4rem)

    &.to-right-leave-active
      transition-timing-function: cubic-bezier(0.645, 0.045, 0.355, 1.000)

    &.to-right-enter-active
      transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000)
</style>
