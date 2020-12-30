<template lang="html">
  <div class="onboarding" :class="{ dark }">
    <section class="animation">
      <header>
        <MbIcon :icon="currentStep.icon" />
      </header>
    </section>
    <section class="steps">
      <header>
        <MbProgress :class="{ faded: !cloneStep }" :dark="dark" :indetermined="!cloneProgress" :label="cloneLabel" :progress="cloneProgress" />
      </header>
      <transition mode="out-in">
        <div v-if="currentSlide === 0" class="slide">
          <h1>Welcome to Mattrbld!</h1>
          <p class="blurb">Mattrbld is the CMS that works in your browser. Let’s get started by importing your first project.</p>
          <MbInput v-model="repoURL" :autofocus="!isMobile" :dark="dark" :error="errors.repoURL" icon="repo" label="Project Repository URL" @blur="handleRepoInput" />
          <div class="label">
            <span>Repository branch:</span>
            <MbSelect v-model="repoBranch" :dark="dark" :disabled="Boolean(!repoURL || errors.repoURL || repoBranches.length === 0)" :loading="loadingBranches" :options="repoBranches" placeholder="Select a branch…" />
          </div>
          <GitLoginModal :dark="dark" :message="gitLoginMessage" :visible="showGitLoginModal" @cancel="credentialPromise('cancel')" @submit="credentialPromise" />
          <footer>
            <MbButton :dark="dark" :disabled="Boolean(!repoURL || errors.repoURL || loadingBranches || !repoBranch)" type="primary" @click="importProject">Import Project</MbButton>
          </footer>
          <p class="advanced-settings" @click="showAdvancedSettings = true">Advanced Settings</p>
          <MbModal class="advanced-settings-modal" :dark="dark" title="Advanced Settings" :visible="showAdvancedSettings" @close="showAdvancedSettings = false">
            <h3>CORS Proxy Server</h3>
            <MbInput v-model="corsProxy" :dark="dark" :error="errors.corsProxy" label="Proxy URL" placeholder="https://cors.isomorphic-git.org" @blur="validate('corsProxy')" />
            <p>Unfortunately, for the time being, most Git-Providers don’t support requests made from browsers. To circumvent that limitation, a proxy server is used.</p>
            <p>
              For small scale, private projects, the provided proxy server may be
              used. However, if you plan on using Mattrbld commercially, or use
              it with very large sites, please host your own instance. Learn more
              about how <a href="https://github.com/isomorphic-git/cors-proxy" rel="noopener noreferrer nofollow" target="_blank">here</a>.
            </p>
          </MbModal>
        </div>
        <div v-else-if="currentSlide === 1" class="slide">
          <h1>Great!</h1>
          <p class="blurb">While the project is being imported, let’s set up your local user. This data will be used to let your collaborators know who you are.</p>
          <MbInput v-model="userName" :autofocus="!isMobile" :dark="dark" :error="errors.userName" icon="user" label="Full Name" @blur="validate('userName')" />
          <MbInput v-model="userEmail" :dark="dark" :error="errors.userEmail" icon="mail" label="Email Address" type="email" @blur="validate('userEmail')" />
          <h2>What’s your typical role in projects?</h2>
          <p>This can be overridden on a project-by-project basis.</p>
          <MbRadioGroup v-model="userRole" :dark="dark" :options="roleOptions" />
          <footer>
            <MbButton :dark="dark" :disabled="Boolean(!userName || !userEmail || !userRole || errors.userName || errors.userEmail)" type="primary" @click="createUser">Create User</MbButton>
          </footer>
        </div>
        <div v-else-if="currentSlide === 2" class="slide">
          <AvatarUploader ref="uploader" @ready="handleAvatarReady" />
          <h1>Almost there!</h1>
          <p class="blurb">You can add an avatar to your profile so your collaborators know at a glance who made those great changes—or use the one we generated for you, your choice.</p>
          <img :src="userAvatar" alt="Avatar could not be loaded">
          <div class="avatar-buttons">
            <MbButton v-show="avatarUploaded" :dark="dark" icon-first icon="trash" type="negative" @click="regenerateAvatar">Remove Image</MbButton>
            <MbButton :dark="dark" icon-first :icon="avatarUploaded ? 'replace-alt' : 'upload'" @click="$refs.uploader.$el.click()">{{ avatarUploaded ? 'Replace Image' : 'Upload Image' }}</MbButton>
          </div>
          <footer>
            <MbButton :dark="dark" type="primary" @click="completeSetup">Save Avatar</MbButton>
          </footer>
        </div>
        <div v-else-if="currentSlide === 3" class="slide">
          <h1>Just a moment…</h1>
          <p>We’re finishing the import of your project. This shouldn’t take long.</p>
        </div>
        <div v-else-if="currentSlide === 4" class="slide">
          <h1>You’re all set!</h1>
          <p v-if="isMattrbldProject">Your project has been imported successfully and is ready to be edited.</p>
          <p v-else>Your project has been imported successfully and is now ready to be set up to work with Mattrbld.</p>
          <footer>
            <MbButton :dark="dark" type="primary" @click="openProject">Start {{ isMattrbldProject ? 'Editing' : 'Setup' }}</MbButton>
          </footer>
        </div>
      </transition>
    </section>
  </div>
</template>

<script>
import { clone, listServerRefs, setConfig } from 'isomorphic-git';
import http from 'isomorphic-git/http/web/index.cjs';
import slugify from '@sindresorhus/slugify';

import generateAvatar from '../assets/js/generateAvatar';
import TimeoutError from '../assets/js/TimeoutError';
import fs, { PlainFS } from '../fs';

import AvatarUploader from '../components/utility/AvatarUploader.vue';
import GitLoginModal from '../components/utility/GitLoginModal.vue';

export default {
  components: {
    AvatarUploader,
    GitLoginModal,
  },
  computed: {
    cloneLabel() {
      if (!this.cloneStep) return '';
      if (this.cloneStep === 'done') return 'Done';
      if (this.cloneStep === 'initialising') return 'Initialising';
      return `${this.cloneStep[0].toUpperCase()}${this.cloneStep.slice(1)}: ${(this.cloneProgress * 100).toFixed(2)}%`;
    },
    currentStep() {
      return this.steps[this.currentSlide];
    },
    gitProvider() {
      try {
        return new URL(this.repoURL).hostname;
      } catch (err) {
        return 'Git';
      }
    },
    isMobile() {
      return this.$store.state.application.mobile;
    },
  },
  data() {
    return {
      avatarUploaded: false,
      cloneProgress: 0,
      cloneStep: '',
      corsProxy: 'http://localhost:9999', // Requires a cors buster running on 9999 (is this safe?)
      // corsProxy: 'https://cors.isomorphic-git.org', // TODO: replace with our own before launch!
      credentialPromise: null,
      credentials: null,
      currentSlide: 0,
      errors: {
        repoURL: '',
        userEmail: '',
        userName: '',
      },
      gitLoginMessage: `This repository seems to be private. Please log into your <strong>${this.gitProvider}</strong> account to confirm that you may perform this action.`,
      isMattrbldProject: false,
      lastRepoURL: '',
      loadingBranches: false,
      projectName: '',
      repoURL: '',
      repoBranch: null,
      repoBranches: [],
      roleOptions: [
        { label: 'Project Owner', value: 'owner' },
        { label: 'Developer', value: 'dev' },
        { label: 'Content Editor', value: 'editor' },
      ],
      showAdvancedSettings: false,
      showGitLoginModal: false,
      steps: [
        {
          icon: 'mattrbld',
        },
        {
          icon: 'user',
        },
        {
          icon: 'image',
        },
        {
          icon: 'mattrbld',
        },
        {
          icon: 'mattrbld',
        },
      ],
      userAvatar: '',
      userEmail: '',
      userId: '',
      userName: '',
      userRole: '',
    };
  },
  methods: {
    async completeSetup() {
      try {
        // Save the avatar uri as Uint8Array along with the rest of the user configuration data
        // Based on https://stackoverflow.com/questions/12168909/blob-from-dataurl
        const byteString = window.atob(this.userAvatar.split(',')[1]);
        const arrayBuffer = Uint8Array.from(byteString, (ch) => ch.charCodeAt(0)).buffer;
        await fs.writeFile(`/users/${this.userId}.jpg`, arrayBuffer, 'utf8'); // we know it’s a image/jpeg because we converted it ourselves in AvatarUploader / generateAvatar
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while saving the user avatar: ${err.message}`, type: 'error' });
        return; // abort
      }
      try {
        const config = {
          activeUser: this.userId,
          corsProxy: this.corsProxy,
          initialised: true,
        };
        await fs.writeFile('/mattrbld.conf', JSON.stringify(config), 'utf8');
        if (this.cloneStep !== 'done') this.currentSlide += 1;
        else this.currentSlide += 2;
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while saving the configuration: ${err.message}`, type: 'error' });
      }
    },
    async createUser() {
      try {
        this.userId = slugify(this.userEmail.trim()); // WARNING: this could lead to collisions if there’s two very similar email addresses (foo-bar@exmaple.com foo.bar@example.com), but since we have a low amount of local users, I think it’s negligible
        const user = {
          email: this.userEmail.trim(),
          name: this.userName.trim().toLowerCase(),
          projects: [this.projectName],
        };
        await fs.mkdir('/users');
        await fs.writeFile(`/users/${this.userId}.json`, JSON.stringify(user), 'utf8');
        this.regenerateAvatar();
        this.currentSlide += 1;
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while creating the user: ${err.message}`, type: 'error' });
      }
    },
    handleAvatarReady(avatar) {
      this.userAvatar = avatar;
      this.avatarUploaded = true;
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

          // TODO: find a way to extract the default branch?
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
        // Create a projects folder and one to clone into based on the repoURL (naive implementation, but should work considering we’re forcing the URL to be a HTTP one)
        this.projectName = this.repoURL.split('/').slice(-1)[0].replace('.git', '');
        try {
          await fs.mkdir('/projects');
          await fs.mkdir(`/projects/${this.projectName}`);
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while creating the folder structure: ${err.message}`, type: 'error' });
          return; // abort
        }
        // Start cloning the repo and advance to the next slide (no await since we want to progress to the next slide)
        clone({
          fs: PlainFS,
          http,
          onAuth: () => ({ username: this.credentials.user, password: this.credentials.password }), // we still have credentials from listing the branches
          onProgress: (progress) => {
            this.cloneStep = progress.phase;
            if (progress.total) this.cloneProgress = progress.loaded / progress.total;
            else this.cloneProgress = 0;
          },
          dir: `/projects/${this.projectName}`,
          corsProxy: this.corsProxy,
          url: this.repoURL,
          ref: this.repoBranch,
          singleBranch: true,
          depth: 5,
        })
          .then(() => {
            fs.stat(`/projects/${this.projectName}/.mattrbld`)
              .then((stat) => {
                if (stat.isDirectory()) this.isMattrbldProject = true;
                else this.isMattrbldProject = false;
              })
              .catch(() => { this.isMattrbldProject = false; }); // if it doesn’t exist the project hasn’t been configured yet
            this.cloneStep = 'done';
          })
          .catch((err) => {
            // If cloning fails, reset everything and start anew
            this.$store.commit('addToast', { message: `Something went wrong while cloning the project: ${err.message}`, type: 'error' });
            // TODO: wipe the file system or rimraf /projects and remove mattrbld.conf if it exists
            this.currentSlide = 0;
          });
        this.currentSlide += 1;
      }
    },
    openGitLoginModal() {
      this.showGitLoginModal = true;
      return new Promise((resolve) => { this.credentialPromise = resolve; });
    },
    async openProject() {
      try { // we’re setting the config here, because we know we’re done cloning
        await setConfig({
          fs: PlainFS,
          dir: `/projects/${this.projectName}`,
          path: 'user.name',
          value: this.userName.trim(),
        });
        await setConfig({
          fs: PlainFS,
          dir: `/projects/${this.projectName}`,
          path: 'user.email',
          value: this.userEmail.trim(),
        });
        if (this.isMattrbldProject) this.$router.push({ name: 'project', params: { name: this.projectName } }); // go to project dashboard
        else this.$router.push({ name: 'project.settings', params: { name: this.projectName } }); // go to project settings / will only work if we have a child route with such a name
      } catch (err) {
        // TODO: figure out a way to clean this up in case something goes wrong, if the config isn’t set other operations will fail in the future
        this.$store.commit('addToast', { message: `Something went wrong while setting the project configuration: ${err.message}`, type: 'error' });
      }
    },
    regenerateAvatar() {
      const split = this.userName.split(' ');
      const initials = `${split[0][0]}${split[split.length - 1][0]}`.toUpperCase();
      this.userAvatar = generateAvatar(initials, '#A29BFE', '#6c5ce7', 'light', this.userEmail);
      if (this.avatarUploaded) this.avatarUploaded = false;
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
          // just checks if we’re using http(s) and it ends with .git
          else if (!/https?:\/\/.*\.git$/.test(this.repoURL)) error = 'Invalid URL, only https URLs ending in .git are supported';
          break;
        case 'userEmail':
          if (!this.userEmail) error = 'An email address is required';
          else if (!/^([a-z0-9_.+-]+)@([\da-z.-]+)\.([a-z.]{2,6})$/.test(this.userEmail)) error = 'Invalid address'; // Regex source: https://graphcms.com/user-guides/working-with/field-validations
          break;
        case 'userName':
          if (!this.userName) error = 'Please let your collaborators know who you are';
          else if (!this.userName.includes(' ')) error = 'Please make sure to use your full name';
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
    currentSlide() {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.onboarding
  display: flex
  min-height: 100vh
  user-select: none

  &.dark
    > section
      &.animation
        background-color: $bg-dark

      &.steps
        background-color: $bg-secondary-dark

        header .progress::v-deep(.bar)
          background-color: $bg-tertiary-dark

        .slide
          .input
            background-color: $bg-tertiary-dark

          .hint
            background-color: $warning-saturated

  @media $mobile
    display: block

  > section
    width: 50%

    @media $mobile
      width: 100%
      min-height: 50vh

    &.animation
      background-color: $bg-secondary

      header
        padding-left: 4rem
        padding-top: @padding-left

        .icon
          width: 3rem
          height: @width

    &.steps
      padding: 4rem
      display: flex
      flex-direction: column
      position: relative

      @media $mobile
        padding: 2rem

        .button
          width: 100%

      header
        margin-left: auto

        @media $mobile
          margin-left: 0
          margin-bottom: 2rem

        .progress
          transition: opacity 200ms ease

          @media $mobile
            width: 100%

          &.faded
            opacity: 0

      .slide
        max-width: (488 / 16)rem
        margin: auto

        &.v-enter-active,
        &.v-leave-active
          transition: transform 200ms ease, opacity 200ms ease

          &.v-enter-from
            opacity: 0
            transform: translateX(4rem)

            @media $mobile
              transform: none

          &.v-leave-to
            opacity: 0
            transform: translateX(-4rem)

            @media $mobile
              transform: none

        h1
          margin-top: 0

        h2
          margin-top: 4rem

          @media $mobile
            margin-top: 2rem

        .blurb
          margin-bottom: 4rem

          @media $mobile
            margin-bottom: 2rem

        .input
          width: 100%
          margin-bottom: 1rem

        .radio-group
          margin-top: 2rem
          margin-bottom: 1rem

          &.dark::v-deep(.fake-radio)::after
            background-color: $bg-secondary-dark

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

        img
          display: block
          width: (92 / 16)rem
          height: @width
          border-radius: 50%
          box-shadow: 0 0 0 0.125rem $bg-tertiary-dark, inset 0 0 0 0.125rem $bg-tertiary-dark
          margin-bottom: 2rem
          margin-left: auto
          margin-right: auto

        .avatar-buttons
          text-align: center
          margin-bottom: 4rem

          .button:first-child
            margin-right: 1rem

            @media $mobile
              margin-right: 0
              margin-bottom: 1rem

        footer
          text-align: right
          margin-top: 2rem

        .advanced-settings
          position: absolute
          bottom: 2rem
          right: 2rem
          cursor: pointer
          color: $accent
          margin: 0

          @media $mobile
            position: static
            margin-top: 2rem
            text-align: right

.advanced-settings-modal
  h3
    margin-top: 0

  .input
    width: 100%
    margin-bottom: 1rem
</style>
