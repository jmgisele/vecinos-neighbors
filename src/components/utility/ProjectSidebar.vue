<template lang="html">
  <div class="project-sidebar" :class="{ dark }">
    <MbProjectAvatar v-if="currentProject.id" :avatar="currentProject.avatar" :project-id="currentProject.id" :project-name="currentProject.name" />
    <div class="meta">
      <p>{{currentProject.name}}</p>
    </div>
    <MbButton class="back-button" :dark="dark" icon="chevron-left" icon-first @click="$router.push({ name: 'Home' })">Back to all projects</MbButton>
  </div>
</template>

<script>
export default {
  beforeUnmount() {
    this.$store.commit('setAppProperty', { key: 'sidebarVisible', value: false });
  },
  computed: {
    currentProject() {
      return this.$store.state.currentProject;
    },
  },
  created() {
    this.$store.commit('setAppProperty', { key: 'sidebarVisible', value: true });
  },
  data() {
    return {
      collapsed: false,
    };
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.project-sidebar
  position: fixed
  top: 0rem
  left: @top
  width: (320 / 16)rem
  height: 100%
  padding: 1.5rem
  background-color: $bg-secondary
  display: flex
  flex-direction: column

  &.dark
    background-color: $bg-secondary-dark
  //   border-top-right-radius: $radius-l
  //   border-bottom-right-radius: @border-top-right-radius
  //   box-shadow: inset 0 0 0 0.0625rem $bg-tertiary-dark
  //
  //   &::before,
  //   &::after
  //     content: none
  //
  // &::before,
  // &::after
  //   content: ''
  //   display: block
  //   position: absolute
  //   top: 0
  //   right: ($radius-l * -2)
  //   width: (@right * -1)
  //   height: (@width / 2)
  //   border-top-left-radius: @height
  //   box-shadow: (@height * -1) 0 0 0 @background-color
  //   background-color: transparent
  //
  // &::after
  //   top: auto
  //   bottom: 0
  //   border-top-left-radius: 0
  //   border-bottom-left-radius: @height

  .project-avatar
    // margin: -1.5rem
    margin: -0.5rem
    margin-bottom: 1rem
    width: calc(100% + 1rem)
    border-radius: $radius-s

  .meta
    display: flex

    p
      margin: 0

  .back-button
    margin-top: auto
</style>
