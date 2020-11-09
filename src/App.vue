<template>
  <SvgSprite />
  <GlobalTooltipController />
  <router-view :dark="dark" />
</template>

<script>
import GlobalTooltipController from '@/components/utility/GlobalTooltipController.vue';
import SvgSprite from '@/components/utility/SvgSprite.vue';

export default {
  components: {
    GlobalTooltipController,
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
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addListener(() => { this.forceRecompute += 1; });
  },
  data() {
    return {
      forceRecompute: 0,
    };
  },
  methods: {
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
</style>
