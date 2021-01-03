<template>
  <SvgSprite />
  <GlobalTooltipController />
  <header v-if="!$route.meta.hideAppHeader" id="appHeader">
    <MbButton v-if="$route.meta.showBack" :dark="dark" icon="chevron-left" rounded tooltip="Back" @click="$router.back" />
    <p v-if="$route.meta.label && !isMobile" class="h3">{{$route.meta.label}}</p>
    <UserSwitcher :dark="dark" />
  </header>
  <router-view :dark="dark" />
  <ModalOverlay :dark="dark" />
  <Snackbar :dark="dark" />
  <MbModal id="componentsModal" :dark="dark" :padded-body="false" :visible="showComponentsModal" @close="showComponentsModal = false">
    <Components :dark="dark" />
  </MbModal>
</template>

<script>
import GlobalTooltipController from './components/utility/GlobalTooltipController.vue';
import Components from './views/Components.vue';
import ModalOverlay from './components/utility/ModalOverlay.vue';
import Snackbar from './components/utility/Snackbar.vue';
import SvgSprite from './components/utility/SvgSprite.vue';
import UserSwitcher from './components/utility/UserSwitcher.vue';

export default {
  components: {
    GlobalTooltipController,
    Components,
    ModalOverlay,
    Snackbar,
    SvgSprite,
    UserSwitcher,
  },
  computed: {
    dark() {
      // HACK: Mention a reactive property so it will recomputed when we want to
      this.forceRecompute; // eslint-disable-line no-unused-expressions
      const { theme } = this.$store.state.user;
      if (theme === 'dark') return true;
      if (theme === 'light') return false;
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) || false;
    },
    isMobile() {
      return this.$store.state.application.mobile;
    },
    scale() {
      return this.$store.state.user.uiScale;
    },
    tooltip() {
      return this.$store.state.application.tooltip || {};
    },
  },
  created() {
    if (this.dark) document.body.classList.add('dark');

    window.addEventListener('scroll', this.handleScroll, { passive: true });
    if (window.matchMedia) {
      const mobileQuery = window.matchMedia('(max-width: 40rem)');
      if (mobileQuery.matches) this.$store.commit('setMobile', true);

      window.matchMedia('(prefers-color-scheme: dark)').addListener(() => { this.forceRecompute += 1; });
      mobileQuery.addListener((e) => this.$store.commit('setMobile', e.matches));
    }

    window.addEventListener('keyup', this.handleComponentsModal);
  },
  data() {
    return {
      forceRecompute: 0,
      showComponentsModal: false,
    };
  },
  methods: {
    handleComponentsModal(e) {
      if (e.key === 'c' && e.ctrlKey && e.altKey) {
        e.preventDefault();
        this.showComponentsModal = !this.showComponentsModal;
      }
    },
    handleScroll() {
      if (this.$store.state.application.tooltip) this.$store.commit('setTooltip', null);
    },
  },
  watch: {
    dark(newVal) {
      if (newVal) document.body.classList.add('dark');
      else document.body.classList.remove('dark');
    },
    scale(newVal) {
      if (typeof newVal === 'number' && newVal !== 'auto') document.documentElement.style.fontSize = `${16 * newVal}px`;
      else document.documentElement.style.removeProperty('font-size');
    },
  },
};
</script>

<style lang="stylus">
@require './assets/styles/breakpoints'
@require './assets/styles/colors'

#appHeader
  padding: 2rem
  display: flex
  align-items: center

  @media $mobile
    padding: 1rem

  .button
    margin-right: 1rem

  .h3
    margin: 0
    margin-right: 2rem

  .user-switcher
    margin-left: auto

#componentsModal
  width: 80vw

  @media $mobile
    width: 100%
</style>
