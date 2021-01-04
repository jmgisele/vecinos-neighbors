<template lang="html">
  <button class="project-card" :class="{dark}" @contextmenu.prevent="openMenu">
    <MbProjectAvatar :avatar="avatar" :project-id="id" :project-name="name" />
    <footer>
      <span>{{name}}</span>
      <MbButton :dark="dark" icon="more-vertical" rounded @click="openMenu" />
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
          icon: 'open',
          label: 'Open',
        },
        {
          icon: 'open-new-window',
          label: 'Open in new tab',
        },
        {
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
  methods: {
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
  user-select: none
  border: none
  box-shadow: inset 0 0 0 0.0625rem $accent
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
    background-color: $bg-tertiary-dark

    &:focus,
    &:hover
      background-color: $bg-secondary-dark

    &:active
      background-color: $bg-dark

  &:focus,
  &:hover
    background-color: $bg-secondary

  &:focus
    box-shadow: inset 0 0 0 0.125rem $accent

  &:active
    background-color: $bg-tertiary
    transform: translateY(2px)

  .project-avatar
    border-bottom-left-radius: $radius-m
    border-bottom-right-radius: $radius-m

  footer
    height: 100%
    width: 100%
    display: flex
    align-items: center
    padding-left: 1rem
    padding-right: 0.5rem

    span
      margin-right: 1rem

    .button
      margin-left: auto
</style>
