<template lang="html">
  <transition mode="out-in">
    <svg class="icon" viewBox="0 0 24 24" fill="none" :key="icon" xmlns="http://www.w3.org/2000/svg">
      <path v-if="icon === 'mattrbld'" d="M4.5 15.5L1 12L12 1L15.5 4.5M4.5 15.5L8.5 19.5M4.5 15.5L10 10M15.5 4.5L19.5 8.5M15.5 4.5L10 10M8.5 19.5L12 23L23 12L19.5 8.5M8.5 19.5L14 14M19.5 8.5L14 14M10 10L14 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path v-else-if="icon === 'moon'" d="M20 13.0977C18.9708 13.7652 17.7434 14.1528 16.4253 14.1528C12.7923 14.1528 9.84722 11.2077 9.84722 7.57465C9.84722 6.25664 10.2348 5.02916 10.9023 4C7.00072 4.5526 4 7.9059 4 11.9601C4 16.4004 7.5996 20 12.0399 20C16.0941 20 19.4474 16.9993 20 13.0977Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path v-else-if="icon === 'plus'" d="M12 6V12M12 18V12M12 12H18M12 12H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path v-else-if="icon === 'sun'" d="M12 1V3M12 23V21M23 12H21M1 12H3M19.7782 19.7782L18.364 18.364M4.22183 4.22183L5.63604 5.63604M4 19.5563L5.41422 18.1421M19.5564 3.99999L18.1421 5.4142M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <g v-else-if="icon === 'error'">
        <path d="M12 7V13M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="17" r="1" fill="currentColor"/>
      </g>
      <path v-else-if="icon === 'check'" d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </transition>
</template>

<script>
export default {
  props: {
    icon: {
      type: String,
      default: 'mattrbld',
    },
  },
};
</script>

<style lang="stylus" scoped>
.icon
  display: inline-block
  width: 1.5rem
  height: 1.5rem
  vertical-align: middle

  &.v-enter-active,
  &.v-leave-active
    transition: transform 200ms ease, opacity 200ms ease

    &.v-enter-from,
    &.v-leave-to
      opacity: 0

    &.v-enter-from
      transform: rotate(-45deg)

    &.v-leave-to
      transform: rotate(45deg)

</style>
