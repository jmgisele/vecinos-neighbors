<template lang="html">
  <div class="not-found">
    <div class="wrapper">
      <MbIcon icon="warning" />
      <h1>Page Not Found</h1>
      <p>
        The page you were looking for does not exist. Perhaps you’d like to build it? 😉
      </p>
      <footer>
        <MbButton :dark="dark" @click="$router.replace('/')">Go Home</MbButton>
        <MbButton :dark="dark" type="primary" @click="$router.back()">Go Back</MbButton>
      </footer>
    </div>
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
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'

.not-found
  display: flex
  flex-direction: column
  justify-content: center
  align-items: center
  max-width: 40rem
  width: calc(100% - 2rem)
  margin: 0 auto

  .icon
    width: 4rem
    height: @width
    color: $warning-saturated
    margin-top: 16rem

    @media $mobile
      margin-top: 8rem

  h1
    margin-top: 2rem

  footer
    margin-top: 2rem

    .button:first-child
      margin-right: 1rem
</style>
