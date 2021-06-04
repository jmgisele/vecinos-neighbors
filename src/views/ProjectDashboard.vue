<template lang="html">
  <div class="project-dashboard">
    <header>
      <h1>Welcome back, {{firstName}}!</h1>
    </header>
    <section class="wrapper">
    </section>
  </div>
</template>

<script>
export default {
  computed: {
    firstName() {
      return this.$store.getters.userInCurrentProject.name.split(' ')[0];
    },
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'

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
</style>
