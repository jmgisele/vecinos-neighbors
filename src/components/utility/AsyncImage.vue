<template lang="html">
  <div class="async-image">
    <img :src="src" :alt="alt" @load="handleLoad">
    <transition>
      <div v-show="!loaded" class="placeholder" :style="{ backgroundColor: placeholderColor }">
        <MbLoader v-if="showLoader" />
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loaded: false,
    };
  },
  methods: {
    handleLoad(e) {
      this.loaded = true;
      this.$emit('load', e);
    },
  },
  props: {
    alt: String,
    placeholderColor: String,
    showLoader: Boolean,
    src: String,
  },
  watch: {
    src(nv) {
      if (nv) this.loaded = false;
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'

.async-image
  position: relative
  overflow: hidden

  img,
  .placeholder
    position: absolute
    top: 0
    left: 0
    width: 100%
    height: 100%

  img
    display: block

  .placeholder
    background-color: $accent-secondary
    display: flex
    align-items: center
    justify-content: center

    &.v-enter-active,
    &.v-leave-active
      transition: opacity 150ms ease

      &.v-enter-from,
      &.v-leave-to
        opacity: 0

</style>
