<template>
  <div id="app">
    <router-view :dark="dark" />
  </div>
</template>

<script>
export default {
  computed: {
    dark() {
      const { theme } = this.$store.state.user;
      if (theme === 'dark') return true;
      if (theme === 'light') return false;
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) || false;
    },
  },
  created() {
    if (this.dark) document.body.classList.add('dark');
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
