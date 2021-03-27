<template lang="html">
  <div class="project">
    <router-view :dark="dark" />
    <ProjectSidebar :dark="dark" :git-status="gitStatus" @git-status-click="handleGitStatusClick" />
  </div>
</template>

<script>
import fs, { exists } from '../fs';
import Store from '../store';
import isMattrbldProject from '../assets/js/isMattrbldProject';

import ProjectSidebar from '../components/utility/ProjectSidebar.vue';

export default {
  async beforeRouteEnter(to, from, next) {
    const configPath = `/projects/${to.params.id}/.mattrbld/config.json`;
    const hasConfigDir = await isMattrbldProject(to.params.id);
    const hasConfigFile = await exists(configPath);
    if (!hasConfigDir || !hasConfigFile) {
      try {
        await fs.mkdir(`/projects/${to.params.id}/.mattrbld`);
      } catch (err) {
        if (err.code !== 'EEXIST') { // it might exist, but there’s no config.json
          return {
            name: 'Error',
            params: {
              code: err.code,
              message: err.message,
              name: err.name,
            },
          };
        }
      }
      // Create config.json with defaults
      Store.commit('setCurrentProject', {
        ...Store.state.currentProject,
        corsProxy: Store.state.application.corsProxy,
        id: to.params.id,
        name: to.params.id,
      });

      const configSaved = await Store.dispatch('saveCurrentProject');
      if (configSaved) {
        Store.commit('addLocallyChangedFile', configPath);
        Store.dispatch('saveAppData');
        return next();
      }
      return {
        name: 'Error',
        params: {
          code: '500',
          message: 'Could not save config, see toast for details',
          name: 'Internal Error',
        },
      };
    }

    try {
      const projectJsonString = await fs.readFile(`/projects/${to.params.id}/.mattrbld/config.json`, 'utf8');
      let avatarData;
      let avatarUrl;
      try {
        avatarData = await fs.readFile(`/projects/${to.params.id}/.mattrbld/avatar.jpg`, 'utf8');
        avatarUrl = URL.createObjectURL(new Blob([avatarData], { type: 'image/jpeg' })); // revoking is handled by the ProjectAvatar component
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
      Store.commit('setCurrentProject', { ...Store.state.currentProject, ...JSON.parse(projectJsonString), avatar: avatarUrl });
      return next((vm) => {
        vm.performInitialPull();
      });
    } catch (err) {
      return {
        name: 'Error',
        params: {
          code: err.code,
          message: err.message,
          name: err.name,
        },
      };
    }
  },
  beforeRouteLeave() {
    this.$store.commit('clearCurrentProject');
  },
  components: {
    ProjectSidebar,
  },
  data() {
    return {
      gitStatus: {
        color: 'warning',
        label: 'Changes',
        loading: false,
        message: 'You have some unpublished local changes',
      },
    };
  },
  methods: {
    handleGitStatusClick() {
      this.$store.commit('addToast', { message: 'Todo: add some status messages in a modal if there are some, i.e. on errors' });
    },
    async performInitialPull() {
      this.gitStatus.loading = true;
      // TODO: Fire off initial pull on the gitWorker
      window.setTimeout(() => { this.gitStatus.loading = false; }, 2000);
    },
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require  '../assets/styles/breakpoints'

.project // 100% minus the height of the app-header
  height: "calc(100vh - %s)" % (116 / 16)rem

  @media $tablet
    height: "calc(100vh - %s)" % (84 / 16)rem

  @media $mobile
    height: "calc(100vh - %s)" % (82 / 16)rem
</style>
