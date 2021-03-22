<template lang="html">
  <div class="project">
    <h1>Project view for {{$route.params.id}}</h1>
    <router-view :dark="dark" />
  </div>
</template>

<script>
import fs, { exists } from '../fs';
import Store from '../store';
import isMattrbldProject from '../assets/js/isMattrbldProject';

export default {
  async beforeRouteEnter(to) {
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
        return true;
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
    const projectJsonString = await fs.readFile(`/projects/${to.params.id}/.mattrbld/config.json`, 'utf8');
    Store.commit('setCurrentProject', { ...Store.state.currentProject, ...JSON.parse(projectJsonString) });
    return true;
  },
  beforeRouteLeave() {
    this.$store.commit('clearCurrentProject');
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
</style>
