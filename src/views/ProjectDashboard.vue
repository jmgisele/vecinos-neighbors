<template lang="html">
  <div class="project-dashboard">
    <header>
      <h1>Welcome back, {{firstName}}!</h1>
    </header>
    <section class="wrapper cards">
      <MbScroller>
        <div class="card" :class="{ dark }">
          <p v-if="locallyChangedFiles > 0" class="number h1">{{locallyChangedFiles}}</p>
          <MbIcon v-else icon="check" />
          <p class="label">{{locallyChangedFiles === 1 ? 'Local change' : locallyChangedFiles !== 0 ? 'Local changes' : 'Everything is in sync'}}</p>
          <MbButton :dark="dark" type="primary" @click="$emit('push')">{{ locallyChangedFiles !== 0 ? 'Synchronise' : 'Check for Updates'}}</MbButton>
        </div>
        <div v-for="entry in sidebarCards" class="card" :key="entry.label">
          <MbIcon :icon="entry.icon || (entry.target.name === 'Project.Collection' ? 'folder' : 'document')" />
          <p class="label">{{entry.label}}</p>
          <MbButton v-if="entry.target.name === 'Edit Content'" :dark="dark" @click="$router.push({ name: 'Edit Content', params: { ...entry.target.params, path: `${projectDir}${entry.target.params.path}` } })">Edit</MbButton>
          <MbButton v-else :dark="dark" @click="$router.push(entry.target)">Open</MbButton>
        </div>
      </MbScroller>
    </section>
    <section class="wrapper">
      <h2>News and Announcements</h2>
    </section>
    <section class="wrapper">
      <h2>Recent Updates</h2>
    </section>
    <section class="wrapper">
      <h2>Local Changes</h2>
    </section>
  </div>
</template>

<script>
export default {
  computed: {
    firstName() {
      if (!this.$store.getters.userInCurrentProject) return 'Anonymous'; // Dashboard gets unloaded after Project so this is needed to avoid an error
      return this.$store.getters.userInCurrentProject.name.split(' ')[0];
    },
    locallyChangedFiles() {
      return this.$store.state.application.locallyChangedFiles.length;
    },
    projectDir() {
      return `/projects/${this.$store.state.currentProject.id}`;
    },
    sidebarCards() {
      const { sidebar } = this.$store.state.currentProject;
      return sidebar.filter((entry) => entry.showInDashboard && entry.target);
    },
  },
  emits: ['push'],
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.project-dashboard
  padding: 0 2rem 8rem 2rem

  @media $mobile
    padding-left: 1rem
    padding-right: 1rem
    padding-bottom: 4rem

  header,
  section.wrapper
    max-width: (1120 / 16)rem
    margin: 0 auto

  header
    margin-bottom: 4rem

    h1
      margin-top: 1.5rem
      line-height: 2.5rem

  section.wrapper
    &:not(:last-child)
      margin-bottom: 8rem

      @media $mobile
        margin-bottom: 4rem

    &.cards
      @media $mobile
        margin-left: -1rem
        margin-right: @margin-left

      .scroller::v-deep(.scroll-area)
        display: flex

        @media $mobile
          padding-left: 1rem
          padding-right: @padding-left

      .card
        min-width: 16rem
        padding: 0.5rem
        border-radius: $radius-l
        border: 0.0625rem solid alpha($text-tertiary, 0.12)
        text-align: center

        &.dark
          border-color: alpha($text-tertiary-dark, 0.12)

        &:not(:last-child)
          margin-right: 1rem

        .number
          margin-top: 3.5rem
          margin-bottom: 0.5rem

        .icon
          margin: 3.5rem auto 0.5rem auto
          width: 3rem
          height: @width

        .label
          margin: 0
          margin-bottom: (56 / 16)rem

        .button
          width: 100%
</style>
