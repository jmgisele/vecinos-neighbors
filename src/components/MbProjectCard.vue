<template lang="html">
  <button class="project-card" :class="{dark}" @click="handleClick" @contextmenu.prevent="openMenu">
    <MbProjectAvatar :avatar="avatar" :project-id="id" :project-name="name" />
    <footer>
      <span>{{name}}</span>
      <MbButton :dark="dark" icon="more-vertical" ref="menuButton" rounded tooltip="More" @click="openMenu" />
    </footer>
    <MbContextMenu class="options" :dark="dark" :from-right="popover.fromRight" :options="options" :show="popover.show" :target="popover.target" :x="popover.x" :y="popover.y" @close="popover.show = false" />
  </button>
</template>

<script>
export default {
  data() {
    return {
      options: [
        {
          action: () => this.$router.push({ name: 'Project', params: { id: this.id } }),
          icon: 'open',
          label: 'Open',
        },
        {
          action: () => {
            const routeData = this.$router.resolve({ name: 'Project', params: { id: this.id } });
            window.open(routeData.href, '_blank');
          },
          icon: 'open-new-window',
          label: 'Open in new window',
        },
        {
          action: () => this.$router.push({ name: 'Project.Settings', params: { id: this.id } }),
          icon: 'settings',
          label: 'Project settings',
        },
        {
          action: this.deleteProject,
          icon: 'trash',
          label: 'Delete',
          type: 'negative',
        },
      ],
      popover: {
        show: false,
        target: null,
        x: 0,
        y: 0,
      },
    };
  },
  emits: ['click'],
  methods: {
    async deleteProject() {
      // soft delete the project and show a toast to undo it
      // maybe warn the user if there are unpublished changes?
      // after a timeout actually delete the project from the device by removing it from the user’s projects and deleting the project folder if no other user uses this project
      this.$store.commit('addToast', { message: 'Todo: implement project deletion', type: 'warning' });
    },
    handleClick(e) {
      if (e.target === this.$refs.menuButton.$el || this.$refs.menuButton.$el.contains(e.target)) return;
      this.$emit('click', e);
    },
    openMenu(e) {
      if (e.type === 'contextmenu') {
        this.popover.x = e.clientX;
        this.popover.y = e.clientY;
        this.popover.fromRight = false;
      } else {
        const rect = e.target.getBoundingClientRect();
        this.popover.fromRight = true;
        this.popover.x = rect.right;
        this.popover.y = rect.top;
      }
      this.popover.target = e.currentTarget;
      this.popover.show = true;
    },
  },
  props: {
    avatar: String,
    dark: Boolean,
    id: String,
    name: String,
    updatedAt: Number,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.project-card
  position: relative
  user-select: none
  border: none
  box-shadow: inset 0 0 0 0.0625rem $bg
  border-radius: $radius-m
  padding: 0
  background-color: $bg
  color: inherit
  display: flex
  flex-direction: column
  overflow: hidden
  cursor: pointer
  transition: background-color 200ms ease

  &.dark
    box-shadow: inset 0 0 0 0.0625rem $bg-tertiary-dark
    background-color: $bg-tertiary-dark

    &:focus,
    &:hover
      background-color: $bg-secondary-dark

    &:active
      background-color: $bg-dark

  &:focus,
  &:hover
    background-color: $bg-secondary

    .project-avatar::v-deep(img)
      transform: scale(1.2)

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
    z-index: 1
    pointer-events: none
    transition: opacity 200ms ease

  .project-avatar
    border-bottom-left-radius: $radius-m
    border-bottom-right-radius: $radius-m

    &::v-deep(img)
      transition: transform 350ms ease

  footer
    height: 100%
    width: 100%
    display: flex
    align-items: center
    padding: 0.5rem
    padding-left: 1rem

    span
      margin-right: 1rem

    .button
      margin-left: auto
</style>
