<template lang="html">
  <section class="heading field">
    <h2 v-if="options.heading">{{options.heading}}</h2>
    <p v-if="options.description" v-html="options.description" />
  </section>
</template>

<script>
import field from '../../mixins/field';

export default {
  mixins: [field],
};
</script>

<style lang="stylus" scoped>
</style>
