<template>
  <div class="home">
    <h1>Welcome to Mattrbld!</h1>
    <p>Press <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> to open an overview of all available components.</p>
    <router-link :to="{ name: 'Project', params: { id: 'portfolio-v2' } }">Test</router-link>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
    };
  },
  methods: {
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'

.home
  padding: 2rem
</style>
