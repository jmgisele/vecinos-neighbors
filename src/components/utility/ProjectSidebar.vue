<template lang="html">
  <transition duration="350">
    <div v-if="isTablet && visible" class="mask" :class="{ dark, swiping }" :style="{ opacity: maskOpacity }" @click="visible = false" />
  </transition>
  <transition>
    <div v-if="currentProject.id" v-show="visible" v-bind="$attrs" class="project-sidebar" :class="{ dark, swiping }" ref="el" :style="{ transform: sidebarTransform }" tabindex="-1" @touchstart="swipeStart" @touchmove="swipeUpdate" @touchend="swipeEnd">
      <MbProjectAvatar :avatar="currentProject.avatar" :project-id="currentProject.id" :project-name="currentProject.name" />
      <div class="meta">
        <p>{{currentProject.name}}</p>
        <MbChip v-if="gitStatus.label" :color="gitStatus.color" :label="gitStatus.label" :loading="gitStatus.loading" @click="$emit('git-status-click')" @mouseenter="handleChipTooltip" />
      </div>
      <ul class="custom options">
        <template v-for="(option, index) in sidebarOptions" :key="index">
          <router-link v-if="option.target" custom :to="option.target.name  === 'Edit Content' ? { name: 'Edit Content', params: { ...option.target.params, path: `${projectDir}${option.target.params.path }` } } : option.target" v-slot="{ isExactActive, navigate }">
            <!-- the :class below is an ugly hack since isExactActive ignores queries on nested routes apparently -->
            <li :class="{ active: option.target && option.target.query && option.target.query.tab ? isExactActive && $route.query.tab === option.target.query.tab : isExactActive }" role="link" tabindex="0" @click="goTo(navigate)" @keydown.space.prevent @keyup.enter.space="goTo(navigate)">
              <MbIcon :icon="option.icon || (option.target && option.target.name === 'Project.Collection' && 'folder') || 'document'" />
              <span>{{option.label}}</span>
            </li>
          </router-link>
          <li class="separator" v-else>{{option.label}}</li>
        </template>
      </ul>
      <ul class="default options">
        <router-link custom :to="{ name: 'Project'}" v-slot="{ isExactActive, navigate }">
          <li :class="{ active: isExactActive }" role="link" tabindex="0" @click="goTo(navigate)" @keydown.space.prevent @keyup.enter.space="goTo(navigate)">
            <MbIcon icon="grid" />
            <span>Dashboard</span>
          </li>
        </router-link>
        <router-link custom :to="{ name: 'Project.MediaLibrary'}" v-slot="{ isExactActive, navigate }">
          <li :class="{ active: isExactActive }" role="link" tabindex="0" @click="goTo(navigate)" @keydown.space.prevent @keyup.enter.space="goTo(navigate)">
            <MbIcon icon="image-stack" />
            <span>Media Library</span>
          </li>
        </router-link>
        <router-link v-if="isPrivilegedUser" custom :to="{ name: 'Project.Settings'}" v-slot="{ isExactActive, navigate }">
          <li :class="{ active: isExactActive }" role="link" tabindex="0" @click="goTo(navigate)" @keydown.space.prevent @keyup.enter.space="goTo(navigate)">
            <MbIcon icon="settings" />
            <span>Settings</span>
          </li>
        </router-link>
      </ul>
      <MbButton class="back-button" :dark="dark" icon="chevron-left" icon-first @click="backToProjects">Back to all projects</MbButton>
    </div>
  </transition>
</template>

<script>
import isPrivilegedUser from '../../mixins/isPrivilegedUser';

export default {
  beforeUnmount() {
    if (this.visible) this.$store.commit('setAppProperty', { key: 'sidebarVisible', value: false });
    window.removeEventListener('touchstart', this.windowSwipeStart, { passive: false });
  },
  computed: {
    currentProject() {
      return this.$store.state.currentProject;
    },
    isTablet() {
      return this.$store.state.application.tablet;
    },
    projectDir() {
      return `/projects/${this.currentProject.id}`;
    },
    sidebarOptions() {
      if (this.currentProject.sidebar && this.currentProject.sidebar.length > 0) return this.currentProject.sidebar;
      const defaultOptions = [{ label: 'The sidebar has not yet been configured for this project' }];

      if (this.isPrivilegedUser) defaultOptions.push({ icon: 'wrench-and-driver', label: 'Configure now', target: { name: 'Project.Settings', query: { tab: 'sidebar' } } });
      return defaultOptions;
    },
    visible: {
      get() {
        return this.$route.meta.sidebar && this.$store.state.application.sidebarVisible;
      },
      set(v) {
        this.$store.commit('setAppProperty', { key: 'sidebarVisible', value: v });
      },
    },
  },
  created() {
    if (!this.isTablet) this.$store.commit('setAppProperty', { key: 'sidebarVisible', value: true });
    else window.addEventListener('touchstart', this.windowSwipeStart, { passive: false });
  },
  data() {
    return {
      maskOpacity: null,
      maxSwipeDistance: null,
      sidebarTransform: null,
      swipeStartX: 0,
      swipeStartY: 0,
      swiping: false,
      windowSwipe: false,
    };
  },
  emits: ['git-status-click'],
  inheritAttrs: false,
  methods: {
    backToProjects() {
      if (!window.opener || window.opener.closed || window.opener.location.pathname !== '/') this.$router.push({ name: 'Home' });
      else {
        window.close();
        window.opener.focus();
      }
    },
    goTo(navigate) {
      navigate();
      if (this.isTablet) window.setTimeout(() => { this.visible = false; }, 0); // so the leave animation plays properly
    },
    handleChipTooltip(e) {
      const { message } = this.gitStatus;
      if (message) {
        this.$store.commit(
          'setTooltip',
          {
            position: 'right',
            message,
            target: e.target,
          },
        );
      }
    },
    async swipeEnd(e) {
      if (!this.swiping) return;
      const finalX = e.changedTouches[0].clientX;
      const distance = finalX - this.swipeStartX;
      this.swiping = false;

      await this.$nextTick(); // wait a tick so the swiping class is removed and the transitions can take over

      if (distance < 0 && Math.abs(distance) > this.maxSwipeDistance / 2) {
        this.sidebarTransform = 'translateX(-100%)';
        this.maskOpacity = 0;
        this.visible = false;
      } else {
        this.sidebarTransform = null;
        this.maskOpacity = null;
      }
    },
    swipeStart(e) {
      if (!this.isTablet) return;
      this.maxSwipeDistance = this.$refs.el.getBoundingClientRect().width;
      this.swipeStartX = e.changedTouches[0].clientX;
      this.swipeStartY = e.changedTouches[0].clientY;
      this.swiping = true;
    },
    swipeUpdate(e) {
      if (!this.swiping) return;
      const currentX = e.changedTouches[0].clientX;
      const currentY = e.changedTouches[0].clientY;
      const distance = currentX - this.swipeStartX;
      const distanceY = currentY - this.swipeStartY;

      if (Math.abs(distance) < 15 && Math.abs(distanceY) > Math.abs(distance)) { // if we haven’t moved much horizontally, but the y direction is bigger, we want to scroll, so abort
        this.swipeEnd(e);
        return;
      }

      this.sidebarTransform = `translateX(${Math.min(distance, 0)}px)`;
      this.maskOpacity = Math.min(1 + distance / this.maxSwipeDistance, 1);
    },
    async windowSwipeEnd(e) {
      window.removeEventListener('touchmove', this.windowSwipeUpdate, { passive: false });
      window.removeEventListener('touchend', this.windowSwipeEnd);
      if (!this.swiping) return;
      const finalX = e.changedTouches[0].clientX;
      const distance = finalX - this.swipeStartX;
      this.swiping = false;
      this.windowSwipe = false;

      await this.$nextTick(); // wait a tick so the swiping class is removed and the transitions can take over

      if (this.maxSwipeDistance && distance > this.maxSwipeDistance / 3) {
        this.sidebarTransform = null;
        this.maskOpacity = null;
      } else {
        this.sidebarTransform = 'translateX(-100%)';
        this.maskOpacity = 0;
        this.visible = false;
      }
    },
    windowSwipeStart(e) {
      if (!this.isTablet || this.swiping || this.visible || this.$store.state.application.openModals.length > 0) return;
      if (e.changedTouches[0].clientX > 48) return;

      // e.preventDefault(); // this would be needed to prevent chromes and safaris swipe to go back, but it also prevents clicks from firing, maybe it could be avoided with overscroll-behaviour on body?

      this.swipeStartX = e.changedTouches[0].clientX;
      this.swipeStartY = e.changedTouches[0].clientY;
      this.sidebarTransform = 'translateX(-100%)';
      this.maskOpacity = 0;

      window.addEventListener('touchmove', this.windowSwipeUpdate, { passive: false });
      window.addEventListener('touchend', this.windowSwipeEnd);
    },
    windowSwipeUpdate(e) {
      const currentX = e.changedTouches[0].clientX;
      const currentY = e.changedTouches[0].clientY;
      const distance = currentX - this.swipeStartX;
      const distanceY = currentY - this.swipeStartY;

      if (distance > 5) {
        if (e.cancelable) e.preventDefault();
        this.windowSwipe = true;
        this.swiping = true;
        this.$nextTick(() => { // wait a tick so it picks up on the set transform and opacity
          this.visible = true;
          this.$nextTick(() => { // wait another tick so we actually have the correct width
            this.maxSwipeDistance = this.$refs.el.getBoundingClientRect().width;
          });
        });
      }
      if (!this.swiping) return;

      if (Math.abs(distance) < 15 && Math.abs(distanceY) > Math.abs(distance)) { // if we haven’t moved much horizontally, but the y direction is bigger, we want to scroll, so abort
        this.windowSwipeEnd(e);
        return;
      }

      this.sidebarTransform = `translateX(${Math.min(-this.maxSwipeDistance + distance, 0)}px)`;
      this.maskOpacity = Math.min(distance / this.maxSwipeDistance, 1);
    },
  },
  mixins: [
    isPrivilegedUser,
  ],
  props: {
    dark: Boolean,
    gitStatus: {
      type: Object,
      default: () => ({}),
    },
  },
  watch: {
    isTablet(nv) {
      if (nv && this.visible) {
        this.visible = false;
        window.addEventListener('touchstart', this.windowSwipeStart, { passive: false });
      } else if (!nv && !this.visible) {
        this.visible = true;
        window.removeEventListener('touchstart', this.windowSwipeStart, { passive: false });
      }
    },
    visible(nv) {
      if (nv) {
        if (!this.windowSwipe) {
          if (this.sidebarTransform) this.sidebarTransform = null;
          if (this.maskOpacity !== null) this.maskOpacity = null;
        }
        this.$nextTick(() => this.$refs.el.focus());
      }
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.mask
  position: fixed
  top: 0
  left: 0
  width: 100%
  height: 100%
  background-color: alpha($bg-dark, 0.6)

  &:not(.swiping)
    transition: opacity 200ms ease

  &.dark
    background-color: alpha(black, 0.6)

  &.v-enter-active:not(.swiping),
  &.v-leave-active:not(.swiping)
    transition: opacity 350ms ease

    &.v-enter-from,
    &.v-leave-to
      opacity: 0 !important

.project-sidebar
  position: fixed
  top: 0rem
  left: @top
  width: (320 / 16)rem
  max-width: calc(100vw - 2rem)
  height: 100%
  padding: 1rem
  background-color: $bg-secondary
  display: flex
  flex-direction: column
  overflow-x: hidden
  overflow-y: auto
  user-select: none
  touch-action: pan-y

  @media $tablet
    border-top-right-radius: $radius-l
    border-bottom-right-radius: @border-top-right-radius

  &:not(.swiping)
    transition: transform 200ms ease

  &.dark
    background-color: $bg-secondary-dark

    .options
      li:not(.separator)
        &.disabled
          color: $text-tertiary-dark

        &:hover,
        &:focus-visible
          background-color: $bg-tertiary-dark

      li.separator
        color: $text-tertiary-dark

  &.v-enter-active:not(.swiping),
  &.v-leave-active:not(.swiping)
    transition: transform 350ms cubic-bezier(0.215, 0.610, 0.355, 1.000)

    &.v-enter-from,
    &.v-leave-to
      transform: translateX(-100%)

  &.v-leave-active
    transition-timing-function: cubic-bezier(0.645, 0.045, 0.355, 1.000)

  .project-avatar
    margin-bottom: 1rem
    width: 100%
    border-radius: $radius-s

  .meta
    display: flex
    margin-bottom: 2rem
    padding-left: 0.75rem
    align-items: center
    justify-content: space-between

    p
      margin: 0
      margin-right: 0.5rem
      white-space: nowrap
      overflow: hidden
      text-overflow: ellipsis

    .chip
      flex-shrink: 0
      cursor: pointer

      &:active
        transform: translateY(0.125rem)

  .options
    list-style: none
    margin: 0
    padding: 0
    margin-bottom: 2rem

    li:not(.separator)
      padding: 0.75rem 1rem
      cursor: pointer
      border-radius: $radius-m
      transition: background-color 200ms ease
      display: flex
      align-items: center

      &:not(:last-child)
        margin-bottom: 0.5rem

      &.active
        background-color: $accent
        color: $text-dark

      &.disabled
        pointer-events: none
        color: $text-tertiary

      &:focus-visible
        box-shadow: inset 0 0 0 (2 / 16)rem $accent

      &:hover,
      &:focus-visible
        background-color: $bg-tertiary

        &.active
          background-color: darken($accent, 5)

      .icon
        margin-right: 1rem
        flex-shrink: 0

      span
        white-space: nowrap
        overflow: hidden
        text-overflow: ellipsis

    li.separator
      padding-left: 0.75rem
      color: $text-secondary

      &:not(:last-child)
        margin-bottom: 0.5rem

      &:not(:first-child)
        margin-top: 1.5rem

  .back-button
    margin-top: auto
    flex-shrink: 0
</style>
