<template>
  <div class="home" :class="{dark}">
    <header>
      <h1>Your Projects</h1>
      <MbProgress v-if="usedQuota !== false && !isMobile" :colors="['positive', 'warning', 'negative']" :dark="dark" :label="`Storage used: ≈ ${(usedQuota * 100).toFixed(2)}%`" :progress="usedQuota" />
    </header>
    <main>
      <MbButton :dark="dark" type="primary" @click="addToast">Add toast</MbButton>
      <button class="add-project" :class="{dark}">
        <div class="icon-wrapper">
          <MbIcon icon="download" />
        </div>
        <span>Import Project</span>
      </button>
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
        this.usedQuota = false;
      }
    } else this.usedQuota = false;

    if (this.usedQuota > 0.9) this.$store.commit('addToast', { message: 'You might be running out of storage soon. Please free up some space by removing old projects to ensure that everything can run smoothly', timeout: false, type: 'warning' });
    if (this.usedQuota === false) this.$store.commit('addToast', { message: 'We could not estimate how much storage Mattrbld is using on your device. Please be aware that you might have to periodically remove old projects to free some space', timeout: false, type: 'warning' });
  },
  data() {
    return {
      tc: 0,
      usedQuota: 0,
    };
  },
  methods: {
    addToast() {
      const types = ['positive', 'negative', 'default', 'warning'];
      const type = types[Math.floor(Math.random() * types.length)];
      this.$store.commit('addToast', { message: `Toast ${this.tc} lorem ipsum dolor sicet numquam dolor ipsut`, timeout: false, type });
      this.tc += 1;
    },
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.home
  &.dark
    main
      background-color: $bg-secondary-dark

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
    padding: 2rem
    display: grid
    grid-template-columns: repeat(auto-fill, (320 / 16)rem)
    grid-auto-rows: (246 / 16)rem
    grid-gap: 2rem
    justify-content: center

    @media $mobile
      height: "calc(100vh - %s)" % (144 / 16)rem
      padding: 1rem

    .add-project
      background-color: $bg
      border: none
      color: inherit
      padding: 2rem
      display: flex
      align-items: center
      justify-content: center
      flex-direction: column
      border-radius: $radius-m
      box-shadow: inset 0 0 0 0.0625rem $accent
      cursor: pointer
      transition: background-color 200ms ease

      &.dark
        background-color: $bg-tertiary-dark

        &:focus,
        &:hover
          background-color: $bg-secondary-dark

        &:active
          background-color: $bg-dark

      &:focus,
      &:hover
        background-color: $bg-secondary

      &:focus
        box-shadow: inset 0 0 0 0.125rem $accent

      &:active
        background-color: $bg-tertiary
        transform: translateY(2px)

      .icon-wrapper
        padding: 1rem
        border-radius: 50%
        background-color: $accent-secondary
        margin-bottom: 1rem
        color: $text-dark

        .icon
          width: 2rem
          height: @width
</style>
