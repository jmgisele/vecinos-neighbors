<template lang="html">
  <TabContent class="general-settings" :dark="dark">
    <section class="wrapper">
      <h1 class="h2">Project</h1>
      <MbInput v-model="projectName" :dark="dark" :error="errors.name" icon="tag" label="Project name" :max-len="32" @blur="changeName" @keyup.enter="changeName" />
      <p class="avatar-label" :class="{ dark }">Project Avatar</p>
      <div class="avatar-wrapper">
        <MbProjectAvatar v-if="currentProject.id" :avatar="avatar" :project-id="currentProject.id" :project-name="currentProject.name" />
        <div class="buttons">
          <AvatarUploader :compression="0.9" :height="180" ref="uploader" :width="320" @ready="handleAvatarReady" />
          <MbButton v-show="avatar" :dark="dark" icon-first icon="trash" type="negative" @click="removeAvatar">Remove</MbButton>
          <MbButton :dark="dark" icon-first :icon="avatar ? 'replace-alt' : 'upload'" @click="$refs.uploader.$el.click()">{{ avatar ? 'Replace' : 'Upload' }}</MbButton>
        </div>
      </div>
    </section>
    <section class="wrapper">
      <h2>Repository</h2>
      <MbInput v-model="projectRepo" :dark="dark" disabled :error="errors.repo" icon="repo" label="Repository URL" @blur="changeRepo" @keyup.enter="changeRepo" />
      <div class="select-wrapper">
        <span>Repository branch:</span>
        <MbSelect :dark="dark" disabled :loading="!projectBranch" :modelValue="projectBranch" :options="repoBranches" @update:model-value="changeBranch" />
      </div>
      <MbHighlightBox :dark="dark">
        <p>The options above are read-only for the time being. Changing the remote of a repository or switching to a different branch are complex features that may be added in the future.</p>
      </MbHighlightBox>
      <h2>Other</h2>
      <MbInput v-model="projectProxy" :dark="dark" :error="errors.proxy" icon="link" label="CORS Proxy URL" @blur="changeProxy" @keyup.enter="changeProxy" />
    </section>
    <section class="wrapper">
      <h2>Slugify Options</h2>
      <p>These options will be passed to the internal slugifier that is used for creating url-safe filenames, slugs and internal links. You should make sure that the options Mattrbld uses are the same that you use when building your project to ensure consistent paths / slugs.</p>
      <p>Mattrbld uses <a href="https://github.com/sindresorhus/slugify" rel="noopener noreferrer nofollow" target="_blank">@sindresorhus/slugify</a> internally, so all options for that are valid here, too.</p>
    </section>
  </TabContent>
</template>

<script>
import { currentBranch, listBranches, listRemotes } from 'isomorphic-git';

import fs, { PlainFS } from '../../fs';

import AvatarUploader from '../../components/utility/AvatarUploader.vue';
import TabContent from '../../components/utility/TabContent.vue';

export default {
  components: {
    AvatarUploader,
    TabContent,
  },
  computed: {
    currentProject() {
      return this.$store.state.currentProject;
    },
  },
  async created() {
    this.projectName = this.currentProject.name;
    this.projectProxy = this.currentProject.corsProxy;
    const dir = `/projects/${this.currentProject.id}`;
    const [remotes, branches, projectBranch] = await Promise.all([
      listRemotes({ fs: PlainFS, dir }),
      listBranches({ fs: PlainFS, dir }),
      currentBranch({ fs: PlainFS, dir }),
    ]);
    this.projectRepo = remotes[0].url;
    this.repoBranches = branches;
    this.projectBranch = projectBranch;
    this.fetchAvatar();
  },
  data() {
    return {
      avatar: null,
      errors: {
        name: null,
        proxy: null,
        repo: null,
      },
      projectBranch: null,
      projectProxy: null,
      projectName: null,
      projectRepo: null,
      repoBranches: [],
    };
  },
  methods: {
    changeBranch() {
      // TODO: implement branch switching → this would also mean that we should add an option to check out a remote branch that isn’t on the machine yet since we only clone one branch at a time to save disk-space
    },
    changeName() {
      if (this.projectName === this.currentProject.name) return;

      if (!this.projectName || !this.projectName.trim()) this.errors.name = 'A name is required';
      else if (this.projectName.length > 32) this.errors.name = 'Name is too long';
      else this.errors.name = '';

      if (this.errors.name) return;

      this.$store.commit('setCurrentProjectProperty', { key: 'name', value: this.projectName.trim() });

      if (!this.avatar) this.$store.commit('setCurrentProjectProperty', { key: 'avatar', value: null });

      this.$store.dispatch('saveCurrentProject');
    },
    changeProxy() {
      if (this.projectProxy === this.currentProject.corsProxy) return;

      this.$store.commit('setCurrentProjectProperty', { key: 'corsProxy', value: this.projectProxy.trim() });
      this.$store.dispatch('saveCurrentProject');
    },
    changeRepo() {
      // TODO: allow changing remote? Even adding a new one?
    },
    async fetchAvatar() {
      try {
        const avatarData = await fs.readFile(`/projects/${this.currentProject.id}/.mattrbld/avatar.jpg`);
        this.avatar = URL.createObjectURL(new Blob([avatarData], { type: 'image/jpeg' })); // revoking is handled by the ProjectAvatar component
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    },
    async handleAvatarReady(avatar) {
      try {
        // Save the avatar uri as Uint8Array along with the rest of the user configuration data
        // Based on https://stackoverflow.com/questions/12168909/blob-from-dataurl
        const byteString = window.atob(avatar.split(',')[1]);
        const avatarData = Uint8Array.from(byteString, (ch) => ch.charCodeAt(0));
        const path = `/projects/${this.currentProject.id}/.mattrbld/avatar.jpg`;
        await fs.writeFile(path, avatarData, 'utf8'); // we know it’s a image/jpeg because we converted it ourselves in AvatarUploader
        this.$store.commit('addLocallyChangedFile', path);
        this.avatar = URL.createObjectURL(new Blob([avatarData], { type: 'image/jpeg' })); // revoking is handled by the ProjectAvatar component
        this.$store.commit('setCurrentProjectProperty', { key: 'avatar', value: this.avatar }); // might become an issue if the url is already revoked → then we just need to create a new object URL for this one
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while saving the project avatar: ${err.message}`, type: 'error' });
      }
    },
    removeAvatar() {
      const path = `/projects/${this.currentProject.id}/.mattrbld/avatar.jpg`;
      const timeout = 5000;
      const timeoutId = window.setTimeout(async () => {
        try {
          await fs.unlink(path);
          this.$store.commit('addLocallyChangedFile', path);
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while deleting the project avatar: ${err.message}`, type: 'error' });
        }
      }, timeout);

      this.avatar = null;
      this.$store.commit('setCurrentProjectProperty', { key: 'avatar', value: null });

      this.$store.commit('addToast', {
        action: async () => {
          window.clearTimeout(timeoutId);
          await this.fetchAvatar();
          this.$store.commit('setCurrentProjectProperty', { key: 'avatar', value: this.avatar }); // might become an issue if the url is already revoked → then we just need to create a new object URL for this one
        },
        actionLabel: 'Undo',
        message: 'Deleted project avatar',
        type: 'warning',
      });
    },
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.general-settings
  user-select: none

  .wrapper
    max-width: 40rem
    margin-left: auto
    margin-right: auto

    .input
      width: 100%
      margin-bottom: 2rem

      & + h2
        margin-top: 1rem

    .avatar-label
      margin: 0
      margin-left: 0.625rem
      margin-bottom: 0.25rem
      font-size: 0.75rem
      color: $text-secondary

      &.dark
        color: $text-secondary-dark

    .avatar-wrapper
      display: flex
      align-items: center

      @media $mobile
        flex-direction: column

      .project-avatar
        border-radius: $radius-s
        flex-shrink: 0
        margin-right: 0.5rem

        @media $mobile
          margin-right: 0
          margin-bottom: 0.5rem

      .buttons
        text-align: center
        width: 100%

        .button
          margin: 0.5rem

          @media $mobile
            width: 100%
            margin-left: 0
            margin-right: 0
            max-width: (320 / 16)rem

    .select-wrapper
      display: flex
      align-items: center
      justify-content: space-between
      margin-bottom: 2rem
</style>
