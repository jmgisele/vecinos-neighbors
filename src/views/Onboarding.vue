<template lang="html">
  <div class="onboarding" :class="{ dark }">
    <section class="animation">
      <header>
        <MbIcon :icon="currentStep.icon" />
      </header>
    </section>
    <section class="steps">
      <header>
        <MbProgress :class="{ faded: !cloneStep }" :dark="dark" :indetermined="cloneStep === 'initialising'" :label="cloneLabel" :progress="cloneProgress" />
      </header>
      <transition mode="out-in">
        <div v-if="currentSlide === 0" class="slide">
          <h1>Welcome to Mattrbld!</h1>
          <p class="blurb">Mattrbld is the CMS that works in your browser. Let’s get started by importing your first project.</p>
          <MbInput v-model.trim="repoURL" autofocus :dark="dark" :error="errors.repoURL" icon="link" label="Project Repository URL" @blur="validate('repoURL')" />
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
        <div v-else-if="currentSlide === 1" class="slide">
          <h1>Great!</h1>
          <p class="blurb">While the project is being imported, let’s set up your local user. This data will be used to let your collaborators know who you are.</p>
          <MbInput v-model.trim="userName" autofocus :dark="dark" :error="errors.userName" icon="user" label="Full Name" @blur="validate('userName')" />
          <MbInput v-model.trim="userEmail" :dark="dark" :error="errors.userEmail" icon="mail" label="E-Mail Address" @blur="validate('userEmail')" />
          <h2>What’s your typical role in projects?</h2>
          <p>This can be overridden on a project-by-project basis.</p>
          <MbRadioGroup v-model="userRole" :dark="dark" :options="roleOptions" />
          <footer>
            <MbButton :dark="dark" :disabled="Boolean(!userName || !userEmail || !userRole || errors.userName || errors.userEmail)" type="primary" @click="createUser">Create User</MbButton>
          </footer>
        </div>
        <div v-else-if="currentSlide === 2" class="slide">
          <h1>Almost there!</h1>
          <p class="blurb">You can add an avatar to your profile so your collaborators know at a glance who made those great changes—or use the one we generated for you, your choice.</p>
          <img :src="userAvatar" alt="Avatar could not be loaded">
          <MbButton class="centered" :dark="dark" icon-first icon="upload">Upload Image</MbButton>
          <footer>
            <MbButton :dark="dark" type="primary" @click="completeSetup">Save Avatar</MbButton>
          </footer>
        </div>
      </transition>
    </section>
  </div>
</template>

<script>
import generateAvatar from '../assets/js/generateAvatar';

export default {
  computed: {
    cloneLabel() {
      if (!this.cloneStep) return '';
      if (this.cloneStep === 'finishing') return 'Done';
      if (this.cloneStep === 'initialising') return 'Initialising';
      return `${this.cloneStep[0].toUpperCase()}${this.cloneStep.slice(1)}: ${(this.cloneProgress * 100).toFixed(2)}%`;
    },
    currentStep() {
      return this.steps[this.currentSlide];
    },
  },
  data() {
    return {
      cloneProgress: 0,
      cloneStep: '',
      currentSlide: 0,
      errors: {
        repoURL: '',
        userEmail: '',
        userName: '',
      },
      repoURL: '',
      repoBranch: 'master',
      repoBranches: ['master', 'dev', 'production'],
      roleOptions: [
        { label: 'Project Owner', value: 'owner' },
        { label: 'Developer', value: 'dev' },
        { label: 'Content Editor', value: 'editor' },
      ],
      steps: [
        {
          icon: 'mattrbld',
        },
        {
          icon: 'user',
        },
        {
          icon: 'image',
        },
      ],
      userAvatar: '',
      userEmail: '',
      userName: '',
      userRole: '',
    };
  },
  methods: {
    completeSetup() {
      // TODO: advance to waiting slide if we’re not done cloning, otherwise complete onboarding
    },
    createUser() {
      // TODO: Create a user file with basic configuration defaults
      const split = this.userName.split(' ');
      const initials = `${split[0][0]}${split[split.length - 1][0]}`.toUpperCase();
      this.userAvatar = generateAvatar(initials, '#A29BFE', 'light');
      this.currentSlide += 1;
    },
    fakeClone() {
      if (this.cloneStep === 'initialising') this.cloneStep = 'cloning';
      const progress = Math.max(Math.random() - 0.5, 0.1);

      if (this.cloneProgress + progress < 1) {
        this.cloneProgress += progress;
        window.setTimeout(this.fakeClone, Math.random() * 5000 + 1000);
      } else {
        this.cloneStep = 'finishing';
        this.cloneProgress = 1;
        window.setTimeout(() => {
          if (this.currentSlide === 3) this.currentSlide = 4;
        }, Math.random() * 5000 + 1000);
      }
    },
    importProject() {
      // TODO: actually clone the repo and ask for credentials if needed, need to figure out how to link up the modal for that with the onAuth callback
      this.currentSlide += 1;
      this.cloneStep = 'initialising';
      window.setTimeout(this.fakeClone, Math.random() * 5000 + 1000);
    },
    validate(field) {
      let error = '';
      switch (field) {
        case 'repoURL':
          // just checks if we’re using http(s) and it ends with .git
          if (!/https?:\/\/.*\.git$/.test(this.repoURL)) error = 'Invalid URL, only https URLs ending in .git are supported';
          break;
        case 'userEmail':
          if (!this.userEmail) error = 'An email address is required';
          else if (!/^([a-z0-9_.+-]+)@([\da-z.-]+)\.([a-z.]{2,6})$/.test(this.userEmail)) error = 'Invalid address'; // Regex source: https://graphcms.com/user-guides/working-with/field-validations
          break;
        case 'userName':
          if (!this.userName) error = 'Please let your collaborators know who you are';
          else if (!this.userName.includes(' ')) error = 'Please make sure to use your full name';
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

        header .progress::v-deep(.bar)
          background-color: $bg-tertiary-dark

        .slide
          .input
            background-color: $bg-tertiary-dark

          .hint
            background-color: $warning-saturated

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

        .progress
          transition: opacity 200ms ease

          &.faded
            opacity: 0

      .slide
        max-width: (488 / 16)rem
        margin: auto

        &.v-enter-active,
        &.v-leave-active
          transition: transform 200ms ease, opacity 200ms ease

          &.v-enter-from
            opacity: 0
            transform: translateX(4rem)

          &.v-leave-to
            opacity: 0
            transform: translateX(-4rem)

        h1
          margin-top: 0

        h2
          margin-top: 4rem

        .blurb
          margin-bottom: 4rem

        .input
          width: 100%
          margin-bottom: 1rem

        .radio-group
          margin-top: 2rem
          margin-bottom: 1rem

          &.dark::v-deep(.fake-radio)::after
            background-color: $bg-secondary-dark

        label
          display: flex
          align-items: center
          margin-bottom: 2rem

          span
            margin-right: auto

        img
          display: block
          width: (120 / 16)rem
          height: @width
          border-radius: 50%
          box-shadow: 0 0 0 0.25rem $bg-tertiary-dark, inset 0 0 0 0.25rem $bg-tertiary-dark
          margin-bottom: 2rem
          margin-left: auto
          margin-right: auto

        .button.centered
          display: flex
          margin-left: auto
          margin-right: auto
          margin-bottom: 4rem

        footer
          text-align: right
          margin-top: 2rem

        .hint
          margin-top: 4rem
          padding: 1.5rem
          border-radius: $radius-l
          background-color: $warning
          color: $text
</style>
