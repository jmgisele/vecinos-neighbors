<template lang="html">
  <div class="project">
    <h1>Project Dashboard for {{$route.params.id}}</h1>
    <router-view :dark="dark" />
  </div>
</template>

<script>
export default {
  created() {
    // TODO: Load Project configuration and data into the store here, so we can access it from the sub-components (things like global slugifyOptions, corsProxy, etc.)
    // When committing changes we’ll always use the name + email of the currently active user, that way we don’t need to constantly switch up the config
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
</style>
