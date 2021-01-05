<template>
  <div class="home" :class="{dark}">
    <header>
      <h1>Your Projects</h1>
      <MbProgress v-if="usedQuota !== false && !isMobile" :colors="['positive', 'warning', 'negative']" :dark="dark" :label="`Storage used: ≈ ${(usedQuota * 100).toFixed(2)}%`" :progress="usedQuota" />
    </header>
      <main>
        <MbProjectCard v-for="project in projectsWithoutSoftDeleted" :avatar="project.avatar" :dark="dark" :id="project.id" :key="project.id" :local-changes="project.localChanges" :name="project.name" :updated-at="project.updatedAt" @click="openProject(project.id)" @deleted="removeProject(project.id)" />
        <button class="add-project" :class="{dark}">
          <div class="icon-wrapper">
            <MbIcon icon="download" />
          </div>
          <span>Import Project</span>
        </button>
        <MbButton :dark="dark" type="primary" @click="addToast">Add toast</MbButton>
        <transition>
          <div v-show="!loaded" class="loader-wrapper">
            <MbLoader />
            <p>Loading Projects…</p>
          </div>
        </transition>
      </main>
  </div>
</template>

<script>
import fs from '../fs';

export default {
  name: 'Home',
  computed: {
    isMobile() {
      return this.$store.state.application.mobile;
    },
    projectsWithoutSoftDeleted() {
      return this.projects.filter((project) => !this.$store.getters.isSoftDeleted(project.id));
    },
  },
  async created() {
    await this.refreshStorageQuota();

    if (this.usedQuota > 0.9) this.$store.commit('addToast', { message: 'You might be running out of storage soon. Please free up some space by removing old projects to ensure that everything can run smoothly', timeout: false, type: 'warning' });

    for (let i = 0; i < 10; i += 1) {
      const id = Math.random().toString(36).substr(2, 9);
      this.projects.push({ id, updatedAt: Date.now(), name: id });
    }
    this.fetchProjects();
  },
  data() {
    return {
      loaded: false,
      projects: [{ id: 'simple', updatedAt: new Date('2020-12-14').valueOf(), name: 'Strawberry Slush', localChanges: true }], // eslint-disable-line object-curly-newline
      tc: 0,
      usedQuota: 0,
    };
  },
  methods: {
    addToast() {
      const types = ['positive', 'negative', 'default', 'warning'];
      const type = types[Math.floor(Math.random() * types.length)];
      this.$store.commit('addToast', { message: `Toast ${this.tc} lorem ipsum dolor sicet numquam dolor ipsut`, timeout: false, type });
      this.tc += 1;
    },
    async fetchProjects() {
      try {
        const projects = await fs.readdir('/projects');
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

          project.localChanges = this.$store.state.application.locallyChangedProjects.includes(id);

          this.projects.push(project);
        });

        this.projects.sort((a, b) => b.updatedAt - a.updatedAt); // last modified first
      } catch (err) {
        this.$store.commit('addToast', { message: `Something went wrong while fetching the projects: ${err.message}`, type: 'error' });
      }
      this.loaded = true;
    },
    async refreshStorageQuota() {
      try {
        const estimate = await navigator.storage.estimate();
        this.usedQuota = estimate.usage / estimate.quota;
      } catch (err) {
        this.$store.commit('addToast', { message: 'We could not estimate how much storage Mattrbld is using on your device. Please be aware that you might have to periodically remove old projects to free some space', timeout: false, type: 'warning' });
      }
    },
    importProject() {
      // clone project and update the storage bar
    },
    openProject(id) {
      this.$router.push({ name: 'Project', params: { id } });
    },
    removeProject(id) {
      const index = this.projects.findIndex((project) => project.id === id);
      if (index > -1) {
        this.projects.splice(index, 1);
        this.refreshStorageQuota();
      }
    },
  },
  props: {
    dark: Boolean,
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
    display: grid
    grid-template-columns: repeat(auto-fill, (320 / 16)rem)
    grid-auto-rows: (246 / 16)rem
    grid-gap: 2rem
    justify-content: center

    @media $mobile
      display: block
      height: "calc(100vh - %s)" % (144 / 16)rem
      padding: 1rem

      .project-card,
      .add-project
        width: 100%
        max-width: (320 / 16)rem
        margin-left: auto
        margin-right: auto
        margin-bottom: 1rem

    .add-project
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
</style>
