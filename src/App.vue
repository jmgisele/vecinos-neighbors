<template>
  <router-view :dark="dark" />
  <MbTooltip :message="tooltip.message" :position="tooltip.position" :target="tooltip.target" />
</template>

<script>
import { hideTooltip } from '@/mixins/tooltipFunctions';

export default {
  computed: {
    dark() {
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
  },
  methods: {
    handleScroll() {
      if (this.$store.state.application.tooltip) hideTooltip();
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
