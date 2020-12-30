<template lang="html">
  <div class="project">
    <h1>Project Dashboard for {{$route.params.id}}</h1>
    <router-view :dark="dark" />
  </div>
</template>

<script>
export default {
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
</style>
