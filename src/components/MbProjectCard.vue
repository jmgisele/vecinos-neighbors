<template lang="html">
  <button class="project-card" :class="{dark}">
    <MbProjectAvatar :avatar="avatar" :project-id="id" :project-name="name" />
    <footer>
      <span>{{name}}</span>
      <MbButton :dark="dark" icon="more-vertical" rounded />
    </footer>
  </button>
</template>

<script>
export default {
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
