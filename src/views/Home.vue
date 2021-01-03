<template>
  <div class="home">
    <header>
      <h1>Your Projects</h1>
      <MbProgress v-if="usedQuota !== false && !isMobile" :colors="['positive', 'warning', 'negative']" :dark="dark" :label="`Storage used: ≈ ${(usedQuota * 100).toFixed(2)}%`" :progress="usedQuota" />
    </header>
    <main>

      <MbButton :dark="dark" type="primary" @click="$store.commit('addToast', { message: `Toast ${tc} lorem ipsum dolor sicet numquam dolor ipsut`, timeout: false }); tc++">Add toast</MbButton>
    </main>
  </div>
</template>

<script>
export default {
  name: 'Home',
  computed: {
    isMobile() {
      return this.$store.state.application.mobile;
    },
  },
  async created() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        this.usedQuota = estimate.usage / estimate.quota;
      } catch (err) {
        this.usedQuota = false; // probably should tell the user that there’s an issue with the quota
      }
    } else this.usedQuota = false; // probably should tell the user that there’s an issue with the quota
  },
  data() {
    return {
      tc: 0,
      usedQuota: 0,
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
  header
    display: flex
    align-items: center
    padding: 0 2rem
    padding-bottom: 2rem

    @media $mobile
      padding: 0 1rem
      padding-bottom: 1rem

    h1
      margin: 0

    .progress
      margin-left: auto

  main
    background-color: $bg-secondary
    height: "calc(100vh - %s)" % (196 / 16)rem
    overflow-x: hidden
    overflow-y: auto

    @media $mobile
      height: "calc(100vh - %s)" % (144 / 16)rem
</style>
