<template>
  <GlobalTooltipController />
  <router-view :dark="dark" />
</template>

<script>
import GlobalTooltipController from '@/components/utility/GlobalTooltipController.vue';

export default {
  components: {
    GlobalTooltipController,
  },
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
