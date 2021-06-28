<template lang="html">
  <div class="import" :class="{ dark }">
    <section class="intro">
      <div class="icon-wrapper">
        <MbIcon icon="mattrbld" />
      </div>
      <h1>Welcome to Mattrbld{{ firstname ? `, ${firstname}` : '' }}!</h1>
      <p v-if="projectName && inviter"><strong>{{inviter}}</strong> invited you to collaborate on <strong>{{projectName}}</strong>.</p>
      <p v-else-if="inviter"><strong>{{inviter}}</strong> invited you to collaborate on their project.</p>
      <p v-else-if="projectName">You were invited to collaborate on <strong>{{projectName}}</strong>.</p>
      <p v-else>You were invited to collaborate on a project.</p>
      <p>Please make sure the information below is complete before getting started.</p>
    </section>
    <section>
      <h2>User Information</h2>
      <MbInput v-model="email" :dark="dark" :disabled="Boolean($route.query.email)" :error="errors.email" icon="mail" label="Email address" type="email" />
      <MbInput v-model="name" :dark="dark" :error="errors.name" icon="user" label="Full name" />
      <MbButton :dark="dark" :disabled="Boolean(!name || !email || errors.name || errors.email)" type="primary">Start editing</MbButton>
    </section>
  </div>
</template>

<script>
export default {
  beforeRouteEnter(to, from, next) {
    const {
      name, email, repo, branch, proxy,
    } = to.query;

    if (!repo || !branch) next({ name: 'Error', params: { message: 'The invite URL is invalid', name: 'InvalidInviteError', stage: 'init' } });

    next((vm) => {
      /* eslint-disable no-param-reassign */
      vm.name = name;
      vm.email = email;
      vm.repo = repo;
      vm.branch = branch;
      vm.proxy = proxy;
      /* eslint-enable no-param-reassign */
    });
  },
  computed: {
    firstname() {
      if (!this.name) return '';
      return this.name.split(' ')[0];
    },
    inviter() {
      return this.$route.query.inviter;
    },
    projectName() {
      return this.$route.query.projectName;
    },
  },
  data() {
    return {
      branch: '',
      email: '',
      errors: {
        email: '',
        name: '',
      },
      name: '',
      proxy: '',
      repo: '',
    };
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'

.import
  user-select: none
  display: flex
  min-height: 100vh
  flex-direction: column
  justify-content: center
  padding: 2rem 2rem 6rem 2rem

  @media $mobile
    padding-left: 1rem
    padding-right: @padding-left
    padding-bottom: 4rem

  &.dark > section
    > h2
      color: $text-secondary-dark

  > section
    width: 100%
    max-width: (544 / 16)rem
    margin: 0 auto

    &:not(:last-child)
      margin-bottom: 4rem

    &.intro
      .icon-wrapper
        display: inline-block
        color: $text-dark
        background-color: $accent
        padding: 1rem
        border-radius: 50%

        .icon
          width: 3rem
          height: @width

      h1
        @media $mobile
          margin-top: 2rem

      p:last-child
        margin-bottom: 0

    > h2
      margin-top: 0
      color: $text-secondary

      + .input
        margin-top: 2rem

    > .input
      display: flex
      width: 100%

      &:not(:last-child)
        margin-bottom: 2rem

    > .button
      display: flex
      margin-left: auto
</style>
