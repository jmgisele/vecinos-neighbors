<template>
  <SvgSprite />
  <GlobalTooltipController />
  <router-view :dark="dark" />
  <ModalOverlay :dark="dark" />
  <MbModal id="componentsModal" :dark="dark" :padded-body="false" :visible="showComponentsModal" @close="showComponentsModal = false">
    <Components :dark="dark" />
  </MbModal>
</template>

<script>
import GlobalTooltipController from '@/components/utility/GlobalTooltipController.vue';
import Components from '@/views/Components.vue';
import ModalOverlay from '@/components/utility/ModalOverlay.vue';
import SvgSprite from '@/components/utility/SvgSprite.vue';

export default {
  components: {
    GlobalTooltipController,
    Components,
    ModalOverlay,
    SvgSprite,
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
  },
};
</script>

<style lang="stylus">
@require './assets/styles/breakpoints'
@require './assets/styles/colors'

#componentsModal
  width: 80vw

  @media $mobile
    width: 100%
</style>
