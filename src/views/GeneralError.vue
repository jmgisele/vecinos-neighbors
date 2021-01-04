<template lang="html">
  <div class="general-error">
    <div v-if="!noDBError" class="wrapper">
      <MbIcon icon="error" />
      <h1>We’re sorry…</h1>
      <p v-if="!initError">Something went wrong. See the error code below for more information:</p>
      <p v-else>Mattrbld could not be initialised properly. See the error code below for more information:</p>
      <pre>{{`Name: ${name}\nCode: ${code}\nMessage: ${message}`}}</pre>
      <MbButton v-if="!initError" :dark="dark" type="primary" @click="$router.replace('/')">Go back</MbButton>
    </div>
    <div v-else class="wrapper">
      <MbIcon icon="error" />
      <h1>Unsupported Browser</h1>
      <p>
        It looks like your browser doesn’t support <strong>IndexedDB</strong>.
        This could be because you’ve opened Mattrbld in an <strong>incognito</strong>
        or <strong>private browsing</strong> window / tab, or because your browser is outdated.
      </p>
      <p>
        Please try again in a <strong>regular</strong> browser window / tab or
        a <strong>modern browser</strong> such as Chrome, Firefox, Edge, etc.
      </p>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    initError() {
      return this.stage === 'init';
    },
    noDBError() {
      return this.code === '11' && this.name === 'InvalidStateError';
    },
  },
  props: {
    code: String,
    dark: Boolean,
    message: String,
    name: String,
    stage: String,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'

.general-error
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
    color: $negative
    margin-top: 16rem

    @media $mobile
      margin-top: 8rem

  h1
    margin-top: 2rem

  h1,
  p
    user-select: none

  .button
    margin-top: 2rem
</style>
