<template lang="html">
  <div class="onboarding" :class="{ dark }">
    <section class="animation">
      <header>
        <MbIcon :icon="currentStep.icon" />
      </header>
    </section>
    <section class="steps">
      <header>
        <MbProgress :dark="dark" :label="`${cloneProgress * 100}%`" :progress="cloneProgress" />
      </header>
      <transition mode="out-in">
        <div v-if="currentSlide === 0" class="slide">
          <h1>Welcome to Mattrbld!</h1>
          <p class="blurb">Mattrbld is the CMS that works in your browser. Let’s get started by importing your first project.</p>
          <MbInput v-model="repoURL" autofocus :dark="dark" :error="errors.repoURL" icon="link" label="Project Repository URL" @blur="validate('repoURL')" />
          <label>
            <span>Repository branch:</span>
            <!-- Todo: should be fetched via listServerRefs after the repoURL has been validated -->
            <MbSelect v-model="repoBranch" :dark="dark" :disabled="Boolean(!repoURL || errors.repoURL)" :options="repoBranches" />
          </label>
          <footer>
            <MbButton :dark="dark" :disabled="Boolean(!repoURL || errors.repoURL)" type="primary" @click="importProject">Import Project</MbButton>
          </footer>
          <p class="hint">
            <strong>Note:</strong> this is a very early prototype. Regardless of
            the URL and Branch selected, clicking “Import Project” will only create
            a mock-project for demonstrational purposes.
          </p>
        </div>
      </transition>
    </section>
  </div>
</template>

<script>
export default {
  computed: {
    currentStep() {
      return this.steps[this.currentSlide];
    },
  },
  data() {
    return {
      cloneProgress: 0.5,
      currentSlide: 0,
      errors: {
        repoURL: '',
      },
      repoURL: '',
      repoBranch: 'master',
      repoBranches: ['master', 'dev', 'production'],
      steps: [
        {
          icon: 'mattrbld',
        },
      ],
    };
  },
  methods: {
    importProject() {
      // TODO: actually clone the repo and ask for credentials if needed, need to figure out how to link up the modal for that with the onAuth callback
    },
    validate(field) {
      let error = '';
      switch (field) {
        case 'repoURL':
          // just checks if we’re using http(s) and it ends with .git
          if (!/https?:\/\/.*\.git$/.test(this.repoURL)) error = 'Invalid URL, only https URLs ending in .git are supported';
          break;
        default:
          // no op
      }
      this.errors[field] = error;
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

.onboarding
  display: flex
  min-height: 100vh

  &.dark
    > section
      &.animation
        background-color: $bg-dark

      &.steps
        background-color: $bg-secondary-dark

  > section
    width: 50%

    &.animation
      background-color: $bg-secondary

      header
        padding-left: 4rem
        padding-top: @padding-left

        .icon
          width: 3rem
          height: @width

    &.steps
      padding: 4rem
      display: flex
      flex-direction: column

      header
        margin-left: auto

      .slide
        max-width: (488 / 16)rem
        margin: auto

        h1
          margin-top: 0

        .blurb
          margin-bottom: 4rem

        .input
          width: 100%
          margin-bottom: 1rem

        label
          display: flex
          align-items: center
          margin-bottom: 2rem

          span
            margin-right: auto

        footer
          text-align: right

        .hint
          margin-top: 4rem
          padding: 1.5rem
          border-radius: $radius-l
          background-color: $warning
          color: $text
</style>
