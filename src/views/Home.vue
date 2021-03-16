<template>
  <div class="home" :class="{dark}">
    <header>
      <h1>Your Projects</h1>
      <MbProgress v-if="usedQuota !== false && !isMobile" :colors="['positive', 'warning', 'negative']" :dark="dark" :label="`Storage used: ≈ ${(usedQuota * 100).toFixed(2)}%`" :progress="usedQuota" />
    </header>
    <main>
      <transition-group class="grid" tag="div" @before-leave="setGridPosition">
        <MbProjectCard v-for="project in projectsWithoutSoftDeleted" :avatar="project.avatar" :dark="dark" :id="project.id" :key="project.id" :local-changes="project.localChanges" :name="project.name" :updated-at="project.updatedAt" @click="openProject(project.id)" @deleted="removeProject(project.id)" />
        <button class="add-project-button" :class="{dark}" key="addProjectButton" @click="showImportProject = true">
          <div class="icon-wrapper">
            <MbIcon icon="download" />
          </div>
          <span>Import Project</span>
        </button>
      </transition-group>
      <transition>
        <div v-show="!loaded" class="loader-wrapper">
          <MbLoader />
          <p>Loading Projects…</p>
        </div>
      </transition>
    </main>
    <MbModal class="import-project-modal" :dark="dark" :permanent="importing" title="Import Project" :visible="showImportProject" @close="cancelProjectImport">
      <transition mode="out-in">
        <div v-if="!importing" class="form">
          <MbInput v-model="repoURL" :autofocus="!isMobile" :dark="dark" :error="errors.repoURL" icon="repo" label="Project Repository URL" @blur="handleRepoInput" @keyup.enter="$event.target.blur()" />
          <div class="label">
            <span>Repository branch:</span>
            <MbSelect v-model="repoBranch" :dark="dark" :disabled="Boolean(!repoURL || errors.repoURL || repoBranches.length === 0)" :loading="loadingBranches" :options="repoBranches" placeholder="Select a branch…" />
          </div>
          <GitLoginModal :dark="dark" :message="gitLoginMessage" :visible="showGitLoginModal" @cancel="credentialPromise('cancel')" @submit="credentialPromise" />
          <MbToggle v-model="showAdvancedSettings" :dark="dark">Advanced Options</MbToggle>
          <transition>
            <div v-show="showAdvancedSettings" class="advanced-settings">
              <MbInput v-model="corsProxy" :dark="dark" :error="errors.corsProxy" label="CORS Proxy URL" placeholder="https://cors.isomorphic-git.org" @blur="validate('corsProxy')" />
              <MbCheckbox v-model="overwriteCorsProxy" :dark="dark">Set this as the default CORS Proxy server</MbCheckbox>
            </div>
          </transition>
        </div>
        <div v-else class="loader">
          <MbProgress :dark="dark" :indetermined="!cloneProgress" :label="cloneLabel" :progress="cloneProgress" />
        </div>
      </transition>
      <template #actions>
        <MbButton :dark="dark" :disabled="importing" @click="cancelProjectImport(true)">Cancel</MbButton>
        <MbButton :dark="dark" :disabled="importDisabled || importing" icon="download" type="positive" @click="importProject">Import Project</MbButton>
      </template>
    </MbModal>
  </div>
</template>

<script>
import { clone, listRemotes, listServerRefs } from 'isomorphic-git';
import http from 'isomorphic-git/http/web/index.cjs';

import TimeoutError from '../assets/js/TimeoutError';
import isMattrbldProject from '../assets/js/isMattrbldProject';
import fs, { PlainFS } from '../fs';

import GitLoginModal from '../components/utility/GitLoginModal.vue';

export default {
  name: 'Home',
  components: {
    GitLoginModal,
  },
  computed: {
    activeUser() {
      return this.$store.state.application.activeUser;
    },
    cloneLabel() {
      if (!this.cloneStep) return 'Initialising';
      if (this.cloneStep === 'done') return 'Done';
      if (this.cloneStep === 'checking configuration') return 'Checking Configuration';
      return `${this.cloneStep[0].toUpperCase()}${this.cloneStep.slice(1)}: ${(this.cloneProgress * 100).toFixed(2)}%`;
    },
    gitProvider() {
      try {
        return new URL(this.repoURL).hostname;
      } catch (err) {
        return 'Git';
      }
    },
    importDisabled() {
      return !this.repoURL || !this.repoBranch || !this.corsProxy || Object.values(this.errors).some((err) => err);
    },
    isMobile() {
      return this.$store.state.application.mobile;
    },
    projectsWithoutSoftDeleted() {
      return this.projects.filter((project) => !this.$store.getters.isSoftDeleted(`/projects/${project.id}`));
    },
  },
  async created() {
    await this.refreshStorageQuota();

    if (this.usedQuota > 0.9) this.$store.commit('addToast', { message: 'You might be running out of storage soon. Please free up some space by removing old projects to ensure that everything can run smoothly', timeout: false, type: 'warning' });

    this.fetchProjects();
  },
  data() {
    return {
      cloneProgress: 0,
      cloneStep: '',
      corsProxy: this.$store.state.application.corsProxy,
      credentialPromise: null,
      credentials: null,
      errors: {
        corsProxy: '',
        repoURL: '',
      },
      gitLoginMessage: `This repository seems to be private. Please log into your <strong>${this.gitProvider}</strong> account to confirm that you may perform this action.`,
      importing: false,
      lastRepoURL: '',
      loaded: false,
      loadingBranches: false,
      overwriteCorsProxy: false,
      projects: [],
      repoURL: '',
      repoBranch: null,
      repoBranches: [],
      showAdvancedSettings: false,
      showGitLoginModal: false,
      showImportProject: false,
      usedQuota: 0,
    };
  },
  methods: {
    cancelProjectImport(clear) {
      if (clear) {
        this.corsProxy = this.$store.state.application.corsProxy;
        this.credentials = null;
        this.errors = {
          corsProxy: '',
          repoURL: '',
        };
        this.lastRepoURL = '';
        this.loadingBranches = false;
        this.overwriteCorsProxy = false;
        this.repoURL = '';
        this.repoBranch = null;
        this.repoBranches = [];
        this.showAdvancedSettings = false;
      }
      this.showImportProject = false;
    },
    async fetchProjects() {
      this.loaded = false;
      try {
        const { projects } = this.$store.state.user;
        const avatarPromises = [];
        const jsonPromises = [];
        const statPromises = [];
        projects.forEach((project) => {
          avatarPromises.push(fs.readFile(`/projects/${project}/.mattrbld/avatar.jpg`, 'utf8'));
          jsonPromises.push(fs.readFile(`/projects/${project}/.mattrbld/config.json`, 'utf8'));
          statPromises.push(fs.stat(`/projects/${project}`));
        });
        const avatars = await Promise.allSettled(avatarPromises);
        const jsonData = await Promise.allSettled(jsonPromises);
        const stats = await Promise.allSettled(statPromises);
        const loadedProjects = [];

        jsonData.forEach((dataset, index) => {
          const id = projects[index];
          let project;
          if (dataset.status === 'rejected') project = { id, name: id };
          else project = { ...JSON.parse(dataset.value), id };

          if (stats[index].status === 'rejected') project.updatedAt = -1;
          else project.updatedAt = stats[index].value.mtimeMs;

          if (avatars[index].status !== 'rejected') {
            project.avatar = URL.createObjectURL(new Blob([avatars[index].value], { type: 'image/jpeg' })); // revoking is handled by the ProjectAvatar component
          }

          project.localChanges = this.$store.getters.hasLocalChanges(`/projects/${id}`);

          loadedProjects.push(project);
        });

        loadedProjects.sort((a, b) => b.updatedAt - a.updatedAt); // last modified first
        // this.projects = loadedProjects;
        this.projects = [...this.projects, ...loadedProjects]; // only needed while the demo projects exist
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while fetching the projects: ${err.message}`, type: 'error' });
      }
      this.loaded = true;
    },
    async handleRepoInput() {
      this.validate('repoURL');

      if (!this.errors.repoURL && this.repoURL !== this.lastRepoURL) {
        this.loadingBranches = true;
        this.repoBranches = [];
        this.repoBranch = null;
        let timeout = null;
        try {
          const refs = await Promise.race([ // we’re racing against a timeout because the proxy sometimes silently fails to relay and we’d be waiting forever otherwise
            listServerRefs({
              corsProxy: this.corsProxy,
              // forPush: true, // we can use this to determine whether we’ll be able to push to the repo or certain branches early (also means that we have to show the login modal as soon as we blur)
              http,
              onAuth: async () => {
                window.clearTimeout(timeout); // we have connected successfully, we don’t need the timeout anymore
                if (this.$store.state.user.gitAuth) {
                  const { user, password } = this.$store.state.user.gitAuth;
                  return { username: user, password };
                }
                this.gitLoginMessage = `This repository seems to be private. Please log into your <strong>${this.gitProvider}</strong> account to confirm that you may perform this action.`;
                this.credentials = await this.openGitLoginModal();
                this.showGitLoginModal = false;
                if (this.credentials === 'cancel') return { cancel: true };
                return { username: this.credentials.user, password: this.credentials.password };
              },
              onAuthFailure: async () => {
                if (this.$store.state.user.gitAuth) this.$store.commit('setUserProperty', { key: 'gitAuth', value: null });
                this.gitLoginMessage = 'Sorry, that didn’t work. This might mean that you don’t have access to this repository, or that you typed the wrong username / password combination. Please try again.';
                this.credentials = await this.openGitLoginModal();
                this.showGitLoginModal = false;

                if (this.credentials === 'cancel') return { cancel: true };
                return { username: this.credentials.user, password: this.credentials.password };
              },
              onAuthSuccess: () => {
                if (this.credentials.savePassword) {
                  // WARNING: This might be insecure considering XSS attacks (then again, if there’s a XSS, we probably are screwed anyway)
                  this.$store.commit('setUserProperty', { key: 'gitAuth', value: { password: this.credentials.password, user: this.credentials.user } });
                }
              },
              prefix: 'refs/heads/',
              url: this.repoURL,
            }),
            new Promise((resolve, reject) => {
              timeout = window.setTimeout(() => reject(new TimeoutError('Connection timed out')), this.isMobile ? 10000 : 5000); // a 10s timeout might be too much here generally speaking, but on mobile it could be necessary
            }),
          ]);
          this.repoBranches = refs.map((ref) => ref.ref.replace('refs/heads/', ''));

          // TODO: find a way to extract the default branch? → Could be done by fetching the repo first, but might be expensive bandwidth wise
          if (this.repoBranches.includes('main')) this.repoBranch = 'main';
          else if (this.repoBranches.includes('master')) this.repoBranch = 'master';
          else [this.repoBranch] = this.repoBranches;

          this.lastRepoURL = this.repoURL;
        } catch (err) {
          if (err.code === 'UserCanceledError') {
            this.credentials = null;
            this.errors.repoURL = 'You might not have access to this repository';
          } else if (err.code === 'HttpError' && err.data && err.data.statusCode === 404) { // there might also be a 403 error if we have read- but not write-access, but that only matters if we have forPush active
            this.errors.repoURL = 'This repository doesn’t seem to exist';
          } else if (err instanceof TimeoutError || (err.name === 'TypeError' && err.message === 'Failed to fetch')) { // This is probably not the best way to catch these errors, but there’s hardly any information in that object
            this.errors.repoURL = 'This repository doesn’t exist or is refusing connections';
            this.$store.commit('addToast', { message: 'Could not fetch the repository, please check your network connection and the proxy server settings under ‘Advanced Settings’', type: 'error' });
          } else {
            this.$store.commit('addToast', { message: `Something went wrong while fetching branches: ${err.message}`, type: 'error' });
          }
        }
        window.clearTimeout(timeout); // clear the timeout for consistency
        this.loadingBranches = false;
      }
    },
    async importProject() {
      this.validate(this.repoURL);

      if (this.repoURL && !this.errors.repoURL && this.repoBranch) {
        this.importing = true;
        if (this.overwriteCorsProxy) {
          this.$store.commit('setAppProperty', { key: 'corsProxy', value: this.corsProxy });
          const saved = await this.$store.dispatch('saveAppData');
          if (!saved) return; // abort
        }
        // Generate Project Name (naive implementation, but should work considering we’re forcing the URL to be a HTTP one)
        let projectId = this.repoURL.split('/').slice(-1)[0].replace(/\.git$/, '');
        const exists = await this.projectExists(projectId);
        // If a project with that filename exists, but it’s not the same
        if (exists && !exists.remote) projectId = `${projectId}-${Math.random().toString(36).substr(2, 9)}`; // add a pseudo-random suffix to make the id unique, could technically still cause collisions, but that’s so unlikely it’s negligible
        else if (exists && exists.remote && !exists.user) { // the project was already imported by a different user
          this.$store.commit('addProjectToActiveUser', projectId);
          await this.$store.dispatch('saveUser');
          this.cloneStep = 'done';
          this.importing = false;
          this.showImportProject = false;
          this.$store.commit('addToast', { message: 'Your project was imported successfully', type: 'positive' });
          this.$router.push({ name: 'Project', params: { id: projectId } });
          return; // abort
        } else if (exists && exists.remote) {
          this.$store.commit('addToast', {
            action: () => this.$router.push({ name: 'Project', params: { id: projectId } }),
            actionLabel: 'Open',
            message: 'This project was already imported on this device, would you like to open it?',
            type: 'warning',
          });
          this.importing = false;
          this.showImportProject = false; // so we can navigate if we choose to
          return; // abort
        }

        try {
          await fs.mkdir(`/projects/${projectId}`);
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while creating the folder structure: ${err.message}`, type: 'error' });
          this.importing = false;
          return; // abort
        }
        try {
          await clone({
            fs: PlainFS,
            http,
            onAuth: () => ({ username: this.credentials.user, password: this.credentials.password }), // we still have credentials from listing the branches
            onProgress: (progress) => {
              this.cloneStep = progress.phase;
              if (progress.total) this.cloneProgress = progress.loaded / progress.total;
              else this.cloneProgress = 0;
            },
            dir: `/projects/${projectId}`,
            corsProxy: this.corsProxy,
            url: this.repoURL,
            ref: this.repoBranch,
            singleBranch: true,
            depth: 5,
          });
          this.cloneStep = 'checking configuration';
          this.cloneProgress = 0;
          const wasConfigured = await isMattrbldProject(`/projects/${projectId}/.mattrbld`);

          let project;
          if (wasConfigured) {
            const projectDetails = [fs.readFile(`/projects/${projectId}/.mattrbld/avatar.jpg`, 'utf8'), fs.readFile(`/projects/${projectId}/.mattrbld/config.json`, 'utf8')];
            const [avatar, config] = await Promise.allSettled(projectDetails);

            if (config.status !== 'rejected') project = { ...JSON.parse(config.value) };
            else project = { id: projectId, name: projectId };

            if (avatar.status !== 'rejected') project.avatar = URL.createObjectURL(new Blob([avatar.value], { type: 'image/jpeg' })); // revoking is handled by the ProjectAvatar component
            project.updatedAt = Date.now();
          } else project = { id: projectId, name: projectId, updatedAt: Date.now() };

          this.projects.unshift(project); // Insert at the beginning of the list

          this.$store.commit('addProjectToActiveUser', projectId);
          await this.$store.dispatch('saveUser');

          this.cloneStep = 'done';
          this.importing = false;
          this.showImportProject = false;

          this.$store.commit('addToast', { message: wasConfigured ? `${project.name} was imported successfully and is ready to be edited` : 'Your project was imported successfully and is ready to be configured', type: 'positive' });
          if (wasConfigured) this.$router.push({ name: 'Project', params: { id: projectId } });
          else this.$router.push({ name: 'Project.Settings', params: { id: projectId }, query: { tab: 'users' } });
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while importing the project: ${err.message}`, type: 'error' });
          this.$store.commit('removeProjectFromActiveUser', projectId);
          // TODO: delete the zombie project folder if it exists
          this.$store.dispatch('saveUser');
        }
      }
    },
    openGitLoginModal() {
      this.showGitLoginModal = true;
      return new Promise((resolve) => { this.credentialPromise = resolve; });
    },
    openProject(id) {
      this.$router.push({ name: 'Project', params: { id } });
    },
    async projectExists(id) {
      try {
        await fs.stat(`/projects/${id}`);
        const remotes = await listRemotes({ fs: PlainFS, dir: `/projects/${id}` });
        const origin = remotes.find((remote) => remote.remote === 'origin');
        if (origin && origin.url === this.repoURL) return { remote: true, user: this.$store.state.user.projects.includes(id) };
        return true;
      } catch (err) {
        if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return false;
        throw err;
      }
    },
    async refreshStorageQuota() {
      try {
        const estimate = await navigator.storage.estimate();
        this.usedQuota = estimate.usage / estimate.quota;
      } catch (err) {
        this.$store.commit('addToast', { message: 'We could not estimate how much storage Mattrbld is using on your device. Please be aware that you might have to periodically remove old projects to free some space', timeout: false, type: 'warning' });
      }
    },
    removeProject(id) {
      const index = this.projects.findIndex((project) => project.id === id);
      if (index > -1) {
        this.projects.splice(index, 1);
        this.refreshStorageQuota();
      }
    },
    setGridPosition(el) {
      el.style.setProperty('top', `${el.offsetTop}px`);
      el.style.setProperty('left', `${el.offsetLeft}px`);
      el.style.setProperty('width', `${el.offsetWidth}px`);
      el.style.setProperty('height', `${el.offsetHeight}px`);
      el.style.setProperty('position', 'absolute');
    },
    validate(field) {
      let error = '';
      switch (field) {
        case 'corsProxy':
          if (!this.corsProxy) error = 'A proxy server url is required';
          else if (!this.corsProxy.startsWith('https://')) error = 'The proxy server has to be reachable over HTTPS for security reasons';
          break;
        case 'repoURL':
          if (!this.repoURL) error = 'A repository URL is required';
          else if (!this.repoURL.startsWith('http')) error = 'URL has to be a http(s) URL';
          else if (!this.repoURL.endsWith('.git')) error = 'URL has to end with .git';
          // just checks if we’re using http(s) and it ends with .git
          else if (!/https?:\/\/.*\.git$/.test(this.repoURL)) error = 'Invalid URL, only https URLs ending in .git are supported';
          break;
        default:
          // no op
      }
      this.errors[field] = error;
    },
  },
  props: {
    dark: Boolean,
  },
  watch: {
    activeUser(nv, ov) {
      if (nv && nv !== ov) {
        this.projects = [];
        this.credentials = null;
        this.fetchProjects();
      }
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.home
  &.dark
    main,
    main .loader-wrapper
      background-color: $bg-secondary-dark

  header
    display: flex
    align-items: center
    padding: 0 2rem
    padding-bottom: 2rem

    @media $mobile
      padding: 0 1rem
      padding-bottom: 1rem

    h1
      margin: 0

    .progress
      margin-left: auto

  main
    position: relative
    background-color: $bg-secondary
    height: "calc(100vh - %s)" % (196 / 16)rem
    overflow-x: hidden
    overflow-y: auto
    padding: 2rem

    @media $mobile
      height: "calc(100vh - %s)" % (144 / 16)rem
      padding: 1rem

    .grid
      display: grid
      grid-template-columns: repeat(auto-fill, (320 / 16)rem)
      grid-auto-rows: (246 / 16)rem
      grid-gap: 2rem
      justify-content: center

      @media $mobile
        display: block

        .project-card,
        .add-project-button
          width: 100%
          max-width: (320 / 16)rem
          margin-left: auto
          margin-right: auto
          margin-bottom: 1rem

      .add-project-button
        position: relative
        background-color: $bg
        border: none
        color: inherit
        padding: 2rem
        display: flex
        align-items: center
        justify-content: center
        flex-direction: column
        border-radius: $radius-m
        box-shadow: inset 0 0 0 0.0625rem $accent
        cursor: pointer
        transition: background-color 200ms ease

        &.dark
          background-color: $bg-tertiary-dark

          &:focus,
          &:hover
            background-color: $bg-secondary-dark

          &:active
            background-color: $bg-dark

        &:focus,
        &:hover
          background-color: $bg-secondary

        &:focus::before
            opacity: 1

        &:active
          background-color: $bg-tertiary
          transform: translateY(2px)

        &::before
          content: ''
          position: absolute
          top: 0px
          left: @top
          right: @top
          bottom: @top
          border: 2px solid $accent
          opacity: 0
          border-radius: @border-radius
          pointer-events: none
          transition: opacity 200ms ease

        .icon-wrapper
          padding: 1rem
          border-radius: 50%
          background-color: $accent-secondary
          margin-bottom: 1rem
          color: $text-dark

          .icon
            width: 2rem
            height: @width

      .v-enter-active,
      .v-leave-active,
      .v-move
        transition: transform 350ms ease, opacity 350ms ease

        &.v-enter-from,
        &.v-leave-to
          transform: scale(0.8)
          opacity: 0

    .loader-wrapper
      background-color: $bg-secondary
      position: absolute
      top: 0
      left: 0
      width: 100%
      height: 100%
      display: flex
      justify-content: center
      align-items: center
      flex-direction: column

      &.v-enter-active,
      &.v-leave-active
        transition: opacity 500ms ease

        &.v-enter-from,
        &.v-leave-to
          opacity: 0

.import-project-modal
  .form,
  .loader
    &.v-enter-active,
    &.v-leave-active
      transition: opacity 200ms ease

      &.v-enter-from,
      &.v-leave-to
        opacity: 0

  .form
    .toggle
      font-weight: 700
      margin-bottom: 1rem

    .advanced-settings
      &.v-enter-active,
      &.v-leave-active
        transition: opacity 200ms ease

        &.v-enter-from,
        &.v-leave-to
          opacity: 0

    .input
      width: 100%
      margin-bottom: 1rem

    .label
      display: flex
      align-items: center
      margin-bottom: 2rem

      @media $mobile
        display: block

        ::v-deep(.select) // needed because it’s a fragment element I guess?
          width: 100%

      span
        margin-right: auto

        @media $mobile
          display: block
          margin-bottom: 1rem

  .loader
    padding: 2rem

    .progress
      width: 100%

      &::v-deep(.label)
        text-align: center
</style>
