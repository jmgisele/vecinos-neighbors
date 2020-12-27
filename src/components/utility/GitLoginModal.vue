<template lang="html">
  <MbModal class="git-login-modal" :dark="dark" slim title="Log into your Git account" :visible="visible" @close="handleCancel">
    <p v-if="message" v-html="message" />
    <p v-else>To confirm that you may perform this action, please sign into your Git account.</p>
    <MbInput v-model="user" autofocus :dark="dark" icon="user" label="Username or Email Address" />
    <MbInput v-model="password" :dark="dark" icon="key" label="Password" type="password" />
    <MbCheckbox v-model="savePassword" :dark="dark">Remember password until the end of the session</MbCheckbox>
    <p class="note"><strong>Note:</strong> if you have set up two-factor authentication (2FA)
      on your account, you will have to generate an App Password or Personal Access Token
      to use instead of your password. You may also want to do this in order to
      increase security for your account while using Mattrbld.
    </p>
    <template #actions>
      <MbButton :dark="dark" @click="handleCancel">Cancel</MbButton>
      <MbButton :dark="dark" :disabled="!user || !password" type="primary" @click="handleSubmit">Submit</MbButton>
    </template>
  </MbModal>
</template>

<script>
export default {
  data() {
    return {
      user: '',
      password: '',
      savePassword: false,
    };
  },
  methods: {
    handleCancel() {
      this.$emit('cancel');
      this.password = '';
    },
    handleSubmit() {
      this.$emit('submit', { user: this.user, password: this.password, savePassword: this.savePassword });
      this.password = '';
    },
  },
  props: {
    dark: Boolean,
    message: String,
    visible: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.git-login-modal
  &.dark .note
    background-color: $warning-saturated

  .input
    width: 100%

  .checkbox
    margin-top: 1.5rem

  .note
    padding: 1.5rem
    background-color: $warning
    border-radius: $radius-l
    margin-top: 2rem
    margin-bottom: 0
    color: $text
</style>
