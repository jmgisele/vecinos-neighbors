<template lang="html">
  <div class="project">
    <router-view :dark="dark" />
    <ProjectSidebar :dark="dark" :git-status="gitStatus" @git-status-click="handleGitStatusClick" />
    <GitLoginModal :dark="dark" :message="gitLoginMessage" :visible="showGitLoginModal" @cancel="credentialPromise('cancel')" @submit="credentialPromise" />
    <MbModal class="error-modal" :dark="dark" title="Oops…" :visible="showGitErrorModal" @close="showGitErrorModal = false">
      <p>Something went wrong while syncing the latest changes. See the error message below for more details:</p>
      <pre><code>{{JSON.stringify({ timestamp: new Date(), ...gitError }, null, 2)}}</code></pre>
      <template #actions>
        <MbButton :dark="dark" @click="showGitErrorModal = false">Close</MbButton>
      </template>
    </MbModal>
  </div>
</template>

<script>
import slugify from '@sindresorhus/slugify';

import fs, { exists } from '../fs';
import { pull } from '../git';
import Store from '../store';
import isMattrbldProject from '../assets/js/isMattrbldProject';

import ProjectSidebar from '../components/utility/ProjectSidebar.vue';

import gitAuth from '../mixins/gitAuth';

const GIT_STATUS_MESSAGES = {
  ERROR: 'Something went wrong syncing the latest changes. Click to learn more.',
  PULLING: 'Fetching remote changes',
  PUSHING: 'Pushing changes to remote',
  CHANGES: 'You have some unpublished local changes',
  READY: 'Everything is in sync',
};

export default {
  async beforeRouteEnter(to, from, next) {
    const configPath = `/projects/${to.params.id}/.mattrbld/config.json`;
    const usersPath = `/projects/${to.params.id}/.mattrbld/users`;
    const currentUserId = Store.state.user.id;

    const hasConfigDir = await isMattrbldProject(to.params.id);
    const hasConfigFile = await exists(configPath);

    if (!hasConfigDir || !hasConfigFile) {
      try {
        await fs.mkdir(`/projects/${to.params.id}/.mattrbld`);
        await fs.mkdir(usersPath);
      } catch (err) {
        if (err.code !== 'EEXIST') { // it might exist, but there’s no config.json
          return next({
            name: 'Error',
            params: {
              code: err.code,
              message: err.message,
              name: err.name,
            },
          });
        }
      }

      // Add first user as project owner
      const { email, name } = Store.state.user;
      const id = slugify(email.trim()); // it’s the first, so there’s no need to worry about collisions, we cannot use the local users id though
      const user = {
        email,
        id,
        name,
        role: 'owner',
      };

      try {
        const path = `${usersPath}/${currentUserId}.json`;
        await fs.writeFile(path, JSON.stringify(user, null, 2), 'utf8');
        Store.commit('addLocallyChangedFile', path);
        Store.dispatch('saveAppData');
      } catch (err) {
        return next({
          name: 'Error',
          params: {
            code: err.code,
            message: err.message,
            name: err.name,
          },
        });
      }

      // Create config.json with defaults
      Store.commit('setCurrentProject', {
        ...Store.state.currentProject,
        corsProxy: Store.state.application.corsProxy,
        id: to.params.id,
        name: to.params.id,
        users: [user],
      });

      // Save the config and move on
      const configSaved = await Store.dispatch('saveCurrentProject');
      if (configSaved) return next();

      return next({
        name: 'Error',
        params: {
          code: '500',
          message: 'Could not save config, see toast for details',
          name: 'Internal Error',
        },
      });
    }

    // if we’re here the project was initialised before
    try {
      let userFiles;
      try {
        userFiles = await fs.readdir(usersPath);
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }

      const [projectJsonString, ...userJsonStrings] = await Promise.all([
        fs.readFile(`/projects/${to.params.id}/.mattrbld/config.json`, 'utf8'),
        ...userFiles.filter((userFile) => userFile.endsWith('.json')).map((userFile) => fs.readFile(`${usersPath}/${userFile}`, 'utf8')),
      ]);

      const users = userJsonStrings.map((string) => JSON.parse(string));

      if (!users.find((user) => user.email === Store.state.user.email)) { // this user isn’t a member of this project yet
        const {
          email, name, role,
        } = Store.state.user;
        let id = slugify(email.trim()); // could lead to collisions with similar addresses, so we check if it exists in the next step, but we don’t use the id of the current user since that’s only unique to the current device
        while (userFiles.includes(`${id}.json`)) id += `-${Math.random().toString(36).slice(2, 9)}`; // add a random sequence after to make it unique

        const user = {
          email,
          id,
          name,
          role: role === 'owner' ? 'dev' : role, // take the users default role for the moment, but shouldn’t it be better to have all new users be at first Editors?
        };

        const path = `${usersPath}/${id}.json`;
        await fs.writeFile(path, JSON.stringify(user, null, 2), 'utf8');
        Store.commit('addLocallyChangedFile', path);
        Store.dispatch('saveAppData');
        users.push(user);
      }

      let avatarData;
      let avatarUrl;
      try {
        avatarData = await fs.readFile(`/projects/${to.params.id}/.mattrbld/avatar.jpg`);
        avatarUrl = URL.createObjectURL(new Blob([avatarData], { type: 'image/jpeg' })); // revoking is handled by the ProjectAvatar component
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }

      Store.commit('setCurrentProject', {
        ...Store.state.currentProject,
        ...JSON.parse(projectJsonString),
        avatar: avatarUrl,
        users,
      });
      return next((vm) => {
        vm.performInitialPull();
      });
    } catch (err) {
      return next({
        name: 'Error',
        params: {
          code: err.code,
          message: err.message,
          name: err.name,
        },
      });
    }
  },
  beforeRouteLeave() {
    this.$store.commit('clearCurrentProject');
  },
  components: {
    ProjectSidebar,
  },
  created() {
    this.$store.commit('setProjectAccessDate', { project: this.$route.params.id, value: Date.now() });
    this.$store.dispatch('saveUser');
  },
  data() {
    return {
      currentOperation: null,
      gitError: null,
      gitStatus: {
        color: 'positive',
        label: 'ready',
        loading: false,
        message: GIT_STATUS_MESSAGES.READY,
      },
      showGitErrorModal: false,
    };
  },
  methods: {
    async handleGitStatusClick() {
      if (this.gitError && this.gitStatus.label === 'error') this.showGitErrorModal = true;
    },
    async onGitProgress(progress) {
      const step = progress.phase;
      let percent = '';
      if (progress.total) percent = ` ${(progress.loaded / progress.total) * 100}%`; // NOTE: leading space is intentional
      if (this.currentOperation === 'pull') this.gitStatus.message = `${GIT_STATUS_MESSAGES.PULLING}: ${step}${percent}`;
    },
    async performInitialPull() {
      this.currentOperation = 'pull';
      this.gitStatus.loading = true;
      this.gitStatus.message = GIT_STATUS_MESSAGES.PULLING;
      try {
        const { name, email } = this.$store.getters.userInCurrentProject;
        const projectDir = `/projects/${this.$route.params.id}`;
        await pull(
          {
            author: { name, email },
            corsProxy: this.$store.state.currentProject.corsProxy,
            dir: projectDir,
            singleBranch: true,
          },
          this.onGitAuth,
          this.onGitAuthFailure,
          this.onGitAuthSuccess,
          this.onGitProgress,
        );
        if (this.$store.getters.hasLocalChanges(projectDir)) {
          this.gitStatus.color = 'warning';
          this.gitStatus.label = 'changes';
          this.gitStatus.message = GIT_STATUS_MESSAGES.CHANGES;
        } else {
          this.gitStatus.color = 'positive';
          this.gitStatus.label = 'ready';
          this.gitStatus.message = GIT_STATUS_MESSAGES.READY;
        }
      } catch (err) {
        this.gitStatus.color = 'negative';
        this.gitStatus.label = 'error';
        this.gitStatus.message = GIT_STATUS_MESSAGES.ERROR;
        this.gitError = { code: err.code, message: err.message, name: err.name };
      }
      this.gitStatus.loading = false;
      this.currentOperation = null;
    },
  },
  mixins: [gitAuth],
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

.error-modal
  p
    margin-top: 0

  pre
    margin-bottom: 0
</style>
