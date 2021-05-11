<template lang="html">
  <div class="project">
    <router-view :dark="dark" @push="openChangesModal" />
    <ProjectSidebar :dark="dark" :git-status="gitStatus" @git-status-click="handleGitStatusClick" />
    <GitLoginModal :dark="dark" :message="gitLoginMessage" :visible="showGitLoginModal" @cancel="credentialPromise('cancel')" @submit="credentialPromise" />
    <MbModal class="error-modal" :dark="dark" title="Oops…" :visible="showGitErrorModal" @close="showGitErrorModal = false">
      <p>Something went wrong while syncing the latest changes. See the error message below for more details:</p>
      <pre><code>{{JSON.stringify({ timestamp: new Date(), ...gitError }, null, 2)}}</code></pre>
      <template #actions>
        <MbButton :dark="dark" @click="showGitErrorModal = false">Close</MbButton>
        <MbButton v-if="gitErrorRetryAction" :dark="dark" type="primary" @click="handleGitErrorRetry">Try again</MbButton>
      </template>
    </MbModal>
    <MbModal class="changes-modal" :dark="dark" :permanent="isPushing" title="Sync local changes" :visible="showChangesModal" @close="showChangesModal = false" @after-close="resetChangesModal">
      <transition mode="out-in">
        <MbLoader v-if="changesLoading" />
        <div v-else-if="isPushing" class="progress">
          <MbProgress :dark="dark" :indetermined="!currentOperation.progress" :label="currentOperation.step" :progress="currentOperation.progress" />
        </div>
        <div v-else class="wrapper">
          <MbEditor v-model="commitMessage" :allow-new-lines="false" :dark="dark" label="Message describing the changes (optional)" :max-len="72" />
          <header :class="{dark}">
            <span>Select the changes to include:</span>
            <MbButton :dark="dark" @click="toggleSelectAll">{{lessThanHalfSelected ? 'Select all' : 'Deselect all'}}</MbButton>
          </header>
          <ul class="changes">
            <li v-for="(change, index) in changes" :key="index">
              <MbCheckbox v-model="change.selected" :dark="dark" />
              <div class="group" :class="{dark}" @click="change.selected = !change.selected">
                <MbChip :color="change.color" :label="change.type" />
                <span>{{change.file}}</span>
              </div>
            </li>
            <li v-if="changes.length === 0" class="empty-state">
              <span>There currently are no unpublished changes</span>
            </li>
          </ul>
        </div>
      </transition>
      <template #actions>
        <MbButton :dark="dark" :disabled="isPushing" @click="showChangesModal = false">Cancel</MbButton>
        <MbButton :dark="dark" :disabled="isPushing || changesLoading || selectedChanges.length === 0" type="primary" @click="pushChanges">Sync {{selectedChanges.length}} change{{ selectedChanges.length !== 1 ? 's' : ''}}</MbButton>
      </template>
    </MbModal>
  </div>
</template>

<script>
import slugify from '@sindresorhus/slugify';
import {
  currentBranch as getCurrentBranch, log as gitLog, resetIndex, statusMatrix,
} from 'isomorphic-git';

import fs, { PlainFS, exists } from '../fs';
import { addAllAndCommit, pull, push } from '../git';
import Store from '../store';
import isMattrbldProject from '../assets/js/isMattrbldProject';
import loadProject from '../assets/js/loadProject';

import ProjectSidebar from '../components/utility/ProjectSidebar.vue';

import gitAuth from '../mixins/gitAuth';

const GIT_STATUS_MESSAGES = {
  ERROR: 'Something went wrong syncing the latest changes. Click to learn more.',
  PULLING: 'Fetching remote changes',
  PUSHING: 'Pushing changes to remote',
  CHANGES: 'You have some unpublished local changes',
  SYNCED: 'Everything is in sync',
};

export default {
  async beforeRouteEnter(to, from, next) {
    // if the project is already loaded, we just need to reload the avatar (because it got revoked) and are good to go
    if (Store.state.currentProject.id === to.params.id) {
      try {
        const avatarData = await fs.readFile(`/projects/${to.params.id}/.mattrbld/avatar.jpg`);
        const avatarUrl = URL.createObjectURL(new Blob([avatarData], { type: 'image/jpeg' })); // revoking is handled by the ProjectAvatar component
        Store.commit('setCurrentProjectProperty', { key: 'avatar', value: avatarUrl });
        return next();
      } catch (err) {
        if (err.code !== 'ENOENT') return next(err);
      }
    }

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
      const { project, users, avatarUrl } = await loadProject(to.params.id, fs);

      if (!users.find((user) => user.email === Store.state.user.email)) { // this user isn’t a member of this project yet
        const { email, name } = Store.state.user;
        let id = slugify(email.trim()); // could lead to collisions with similar addresses, so we check if it exists in the next step, but we don’t use the id of the current user since that’s only unique to the current device
        // eslint-disable-next-line no-await-in-loop
        while (await exists(`${usersPath}/${id}.json`)) id += `-${Math.random().toString(36).slice(2, 9)}`; // add a random sequence after to make it unique

        const user = {
          email,
          id,
          name,
          role: 'editor',
        };

        const path = `${usersPath}/${id}.json`;
        await fs.writeFile(path, JSON.stringify(user, null, 2), 'utf8');
        Store.commit('addLocallyChangedFile', path);
        Store.dispatch('saveAppData');
        users.push(user);
      }

      Store.commit('setCurrentProject', {
        ...Store.state.currentProject,
        ...project,
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
  beforeRouteLeave(to, from) {
    // We only want to clear if we’re leaving the project for good or switching to another project so we don’t have to load the details again in the editor routes
    if ((to.name !== 'Edit Schema' && to.name !== 'Edit Content') || to.params.id !== from.params.id) this.$store.commit('clearCurrentProject');
  },
  components: {
    ProjectSidebar,
  },
  computed: {
    gitStatus() {
      const status = {
        color: 'positive',
        label: 'synced',
        loading: this.gitLoading,
        message: GIT_STATUS_MESSAGES.SYNCED,
      };

      const { progress, step, type } = this.currentOperation;

      if (this.$store.getters.hasLocalChanges(this.projectDir)) {
        status.color = 'warning';
        status.label = 'changes';
        status.message = GIT_STATUS_MESSAGES.CHANGES;
      }

      if (type === 'pull' && this.gitLoading) {
        if (step && !progress) status.message = `${GIT_STATUS_MESSAGES.PULLING}: ${step}`;
        else if (progress) status.message = `${GIT_STATUS_MESSAGES.PULLING}: ${step} ${(progress * 100).toFixed(2)}%`;
        else status.message = GIT_STATUS_MESSAGES.PULLING;
      }
      if (type === 'push' && this.gitLoading) {
        if (step && !progress) status.message = `${GIT_STATUS_MESSAGES.PUSHING}: ${step}`;
        else if (progress) status.message = `${GIT_STATUS_MESSAGES.PUSHING}: ${step} ${(progress * 100).toFixed(2)}%`;
        else status.message = GIT_STATUS_MESSAGES.PUSHING;
      }

      if (this.gitError) {
        status.color = 'negative';
        status.label = 'error';
        status.message = GIT_STATUS_MESSAGES.ERROR;
      }
      return status;
    },
    isPushing() {
      return this.currentOperation.type === 'push' && this.gitLoading;
    },
    lessThanHalfSelected() {
      return this.selectedChanges.length < this.changes.length / 2;
    },
    projectDir() {
      return `/projects/${this.$route.params.id}`;
    },
    selectedChanges() {
      return this.changes.filter((change) => change.selected);
    },
  },
  created() {
    this.$store.commit('setProjectAccessDate', { project: this.$route.params.id, value: Date.now() });
    this.$store.dispatch('saveUser');
  },
  data() {
    return {
      changes: [],
      changesLoading: true,
      commitMessage: '',
      currentOperation: {
        type: null,
        step: null,
        progress: null,
      },
      gitError: null,
      gitErrorRetryAction: null,
      gitLoading: false,
      showGitErrorModal: false,
      showChangesModal: false,
    };
  },
  methods: {
    gitAddAllAndCommit(changes, dryRun = false) {
      const { name, email } = this.$store.getters.userInCurrentProject;

      return addAllAndCommit(changes, {
        dir: this.projectDir,
        message: this.commitMessage || 'Update content through Mattrbld',
        author: {
          name,
          email,
        },
        dryRun,
        noUpdateBranch: dryRun || false,
      });
    },
    gitPush() {
      this.currentOperation.step = 'Starting sync…';
      return push(
        {
          corsProxy: this.$store.state.currentProject.corsProxy,
          dir: this.projectDir,
        },
        this.onGitAuth,
        this.onGitAuthFailure,
        this.onGitAuthSuccess,
        this.onGitProgress,
      );
    },
    handleGitErrorRetry() {
      if (!this.gitErrorRetryAction) return;
      this.gitErrorRetryAction();
      this.showGitErrorModal = false;
      this.gitErrorRetryAction = null;
      this.gitError = null;
    },
    async handleGitStatusClick() {
      if (this.gitError && this.gitStatus.label === 'error') this.showGitErrorModal = true;
      else if (this.gitStatus.label === 'changes') this.openChangesModal();
    },
    async handlePushError(err, changes) {
      await this.resetAfterFail(changes);
      this.currentOperation.type = null;
      this.currentOperation.step = null;
      this.currentOperation.progress = null;
      this.gitLoading = false;

      if (err.code === 'UserCanceledError') {
        this.showChangesModal = false;
      } else {
        this.gitError = err;
        this.gitErrorRetryAction = this.pushChanges;
        this.showGitErrorModal = true;
      }
    },
    async onGitProgress(progress) {
      this.currentOperation.step = progress.phase;
      if (progress.total) this.currentOperation.progress = progress.loaded / progress.total;
      else this.currentOperation.progress = null;
    },
    async openChangesModal() {
      this.changesLoading = true;
      this.showChangesModal = true;
      this.changes = (await statusMatrix({ fs: PlainFS, dir: this.projectDir }))
        .reduce((acc, change) => {
          if (change[2] !== change[3]) {
            let type;
            let color;

            // NOTE: see this to understand how these codes work: https://isomorphic-git.org/docs/en/statusMatrix
            if (change[1] === 1 && change[2] === 0 && change[3] === 1) {
              type = 'remove';
              color = 'negative';
            } else if (
              (change[1] === 1 && change[2] === 2 && change[3] === 1)
              || (change[1] === 0 && change[2] === 2 && change[3] === 3)
              || (change[1] === 1 && change[2] === 2 && change[3] === 3)
            ) {
              type = 'modify';
              color = 'warning';
            } else if (change[1] === 0 && change[2] === 2 && change[3] === 0) {
              type = 'add';
              color = 'positive';
            } else return acc;

            acc.push({
              file: change[0],
              selected: true,
              color,
              type,
            });
          }
          return acc;
        }, []);
      const actuallyChangedFiles = this.$store.state.application.locallyChangedFiles.reduce((acc, path) => {
        if (!path.startsWith(this.projectDir) || this.changes.find((change) => `${this.projectDir}/${change.file}` === path)) acc.push(path);
        return acc;
      }, []);
      this.$store.commit('setLocallyChangedFiles', actuallyChangedFiles);
      await this.$store.dispatch('saveAppData');
      this.changesLoading = false;
    },
    async performInitialPull() {
      this.currentOperation.type = 'pull';
      this.gitLoading = true;
      try {
        const { name, email } = this.$store.getters.userInCurrentProject;
        await pull(
          {
            author: { name, email },
            corsProxy: this.$store.state.currentProject.corsProxy,
            dir: this.projectDir,
            singleBranch: true,
          },
          this.onGitAuth,
          this.onGitAuthFailure,
          this.onGitAuthSuccess,
          this.onGitProgress,
        );
      } catch (err) {
        let hint;
        // NOTE: This isn’t exactly a robust way to detect errors, but it’s all the data I have…
        if (err.message === 'Failed to fetch') hint = 'Check your internet connection and make sure your CORS-proxy is set up correctly. Exiting and re-opening the project or reloading the page might help.';
        this.gitError = {
          code: err.code,
          data: err.data,
          message: err.message,
          name: err.name,
          hint,
        };
        this.gitErrorRetryAction = this.performInitialPull;
      }
      this.currentOperation.type = null;
      this.currentOperation.step = null;
      this.currentOperation.progress = null;
      this.gitLoading = false;
    },
    async pushChanges() {
      if (this.selectedChanges.length === 0) return;
      const { draftsDir } = this.$store.state.currentProject;

      this.gitLoading = true;
      this.currentOperation.type = 'push';
      this.currentOperation.step = 'Fetching latest changes…';

      // TODO: try doing a fetch && merge so we are sure we are on the latest version

      if (draftsDir) {
        const changesWithoutDrafts = [];
        const drafts = [];

        this.currentOperation.step = 'Separating drafts from published content…';
        this.selectedChanges.forEach((change) => { // changes need to be turned into plain objects to be processable in the worker thread
          if (change.file.startsWith(`${this.projectDir}/${draftsDir}`)) drafts.push({ file: change.file, type: change.type });
          else changesWithoutDrafts.push({ file: change.file, type: change.type });
        });
        // commit and push them separately
        if (changesWithoutDrafts.length > 0) {
          this.currentOperation.step = 'Synching changes…';
          await this.gitAddAllAndCommit(changesWithoutDrafts);
          try {
            await this.gitPush();
          } catch (err) {
            this.handlePushError(err, changesWithoutDrafts);
            return;
          }
        }

        if (drafts.length > 0) {
          this.currentOperation.step = 'Synching drafts…';
          this.commitMessage = this.commitMessage ? `${this.commitMessage} (drafts)` : 'Update drafts through Mattrbld';
          await this.gitAddAllAndCommit(drafts);
          try {
            await this.gitPush();
          } catch (err) {
            this.handlePushError(err, drafts);
            return;
          }
        }
      } else {
        this.currentOperation.step = 'Gathering changes…';
        const cleanChanges = this.selectedChanges.map((change) => ({ file: change.file, type: change.type })); // changes need to be turned into plain objects to be processable in the worker thread
        await this.gitAddAllAndCommit(cleanChanges);

        try {
          await this.gitPush();
        } catch (err) {
          this.handlePushError(err, cleanChanges);
          return;
        }
      }

      this.selectedChanges.forEach((change) => { // separate loop since we want them to only be removed if the push was successful
        this.$store.commit('removeLocallyChangedFile', `${this.projectDir}/${change.file}`);
      });
      this.$store.dispatch('saveAppData');

      this.showChangesModal = false;
      this.currentOperation.type = null;
      this.currentOperation.step = null;
      this.currentOperation.progress = null;
      this.gitLoading = false;
    },
    async resetAfterFail(changes) {
      // reset to last commit (https://github.com/isomorphic-git/isomorphic-git/issues/129, <commit> is log({depth: 1}).oid), unstage everything with resetIndex
      const currentBranch = await getCurrentBranch({
        fs: PlainFS,
        dir: this.projectDir,
        fullname: true,
      });
      const lastCommit = (await gitLog({
        fs: PlainFS,
        dir: this.projectDir,
        depth: 2,
      })).pop().oid;

      // reset HEAD to last successfully pushed commit, taken from here: https://github.com/isomorphic-git/isomorphic-git/issues/129 since no proper git reset --soft exists
      await fs.writeFile(`${this.projectDir}/.git/${currentBranch}`, lastCommit, 'utf8');

      // unstage everything
      await Promise.all(changes.map((change) => resetIndex({
        fs: PlainFS,
        dir: this.projectDir,
        filepath: change.file,
      })));
    },
    resetChangesModal() {
      this.changes = [];
      this.commitMessage = '';
    },
    toggleSelectAll() {
      if (this.lessThanHalfSelected) this.changes.forEach((change) => { change.selected = true; }); // eslint-disable-line no-param-reassign
      else this.changes.forEach((change) => { change.selected = false; }); // eslint-disable-line no-param-reassign
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
@require  '../assets/styles/colors'
@require  '../assets/styles/corners'

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

.changes-modal
  .loader,
  .progress,
  .wrapper
    &.v-enter-active,
    &.v-leave-active
      transition: opacity 200ms ease

      &.v-enter-from,
      &.v-leave-to
        opacity: 0

  .loader
    height: 16rem
    margin-top: 1.5rem // to match editor and prevent jumping

  .progress
    padding: 2rem

    .progress
      width: 100%

      &::v-deep(.label)
        text-align: center

  .wrapper
    .editor
      margin-bottom: 1rem

    > header
      display: flex
      align-items: center
      justify-content: space-between
      position: sticky
      top: 0
      z-index: 1
      background-color: $bg
      padding: 1rem 0

      &.dark
        background-color: $bg-dark

      > span
        margin-right: 0.5rem

    .changes
      list-style: none
      margin: 0

      li
        display: flex
        align-items: center
        overflow: hidden
        white-space: nowrap

        &:not(:last-child)
          margin-bottom: 1rem

        &.empty-state
          padding: 1rem 0
          justify-content: center
          color: $text-secondary

        .checkbox
          margin-right: 1rem

        .group
          display: flex
          overflow: hidden
          padding: 1rem
          background-color: $bg-tertiary
          border-radius: $radius-m
          width: 100%
          cursor: pointer
          transition: background-color 200ms ease

          &:hover
            background-color: $bg-secondary

          &.dark
            background-color: $bg-secondary-dark

            &:hover
              background-color: $bg-tertiary-dark

          .chip
            margin-right: 1rem
            flex-shrink: 0

          > span
            overflow: hidden
            text-overflow: ellipsis
</style>
