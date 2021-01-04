<template lang="html">
  <button class="project-card" :class="{dark}">
    <MbProjectAvatar :avatar="avatar" :project-id="id" :project-name="name" />
    <footer>
      <span>{{name}}</span>
      <MbButton :dark="dark" icon="more-vertical" rounded @click="openMenu" />
    </footer>
    <MbPopover class="options" :dark="dark" from-right no-content-padding :visible="popover.show" :x="popover.x" :y="popover.y" @close="popover.show = false">
      <ul class="wrapper">
        <li v-for="(option, index) in options" :class="{dark}" :key="index" tabindex="0" @click="option.action">
          <MbIcon v-if="option.icon" :icon="option.icon" />
          <span>{{option.label}}</span>
        </li>
      </ul>
    </MbPopover>
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
          icon: 'plus',
          label: 'Open in new tab',
        },
        {
          icon: 'trash',
          label: 'Delete',
        },
      ],
      popover: {
        show: false,
        x: 0,
        y: 0,
      },
    };
  },
  methods: {
    openMenu(e) {
      const rect = e.target.getBoundingClientRect();
      this.popover.x = rect.right;
      this.popover.y = rect.top;
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

.options
  user-select: none

  .wrapper
    list-style: none
    padding: 0.5rem
    margin: 0

    li
      display: flex
      align-items: center
      width: 100%
      padding: 0.75rem 1rem
      cursor: pointer
      border-radius: $radius-m

      &.dark
        &:hover,
        &:focus
          background-color: $bg-tertiary-dark

      &:not(:last-child)
        margin-bottom: 0.5rem

      &:hover,
      &:focus
        background-color: $bg-secondary

      .icon
        margin-right: 1rem
</style>
