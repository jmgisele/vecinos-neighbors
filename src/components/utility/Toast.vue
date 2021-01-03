<template lang="html">
  <div class="toast" :class="[toast.type, { dark }]" :key="toast.id">
    <p>{{toast.message}}</p>
    <footer>
      <MbButton v-if="toast.action" :dark="dark" rounded :type="toast.type" @click="handleAction">{{toast.actionLabel || 'Action'}}</MbButton>
      <MbButton v-if="!toast.permanent" :dark="dark" icon="cross" rounded @click="close" />
    </footer>
  </div>
</template>

<script>
export default {
  data() {
    return {
      timeoutId: null,
    };
  },
  methods: {
    close() {
      if (this.timeoutId) window.clearTimeout(this.timeoutId);
      this.$store.commit('removeToast', this.toast.id);
    },
    handleAction() {
      this.toast.action();
      this.$store.commit('removeToast', this.toast.id);
    },
  },
  mounted() {
    if (this.toast.timeout > 0) this.timeoutId = window.setTimeout(() => this.close(), this.toast.timeout);
  },
  props: {
    dark: Boolean,
    toast: Object,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.toast
  margin: 1rem auto
  padding: 1rem
  border-radius: $radius-l
  background-color: $bg
  box-shadow: 0 0.75rem 2rem 0 alpha($bg-dark, .18)
  display: flex
  align-items: center
  max-width: 40rem
  width: calc(100% - 2rem)
  pointer-events: auto // to counter none from the parent

  @media $mobile
    flex-wrap: wrap
    margin-top: 0

    &:first-child
      margin-top: auto

  &.dark
    background-color: $bg-secondary-dark
    box-shadow: inset 0 0 0 0.0625rem $bg-tertiary-dark

  &::before
    display: block
    content: ''
    width: 0.25rem
    align-self: stretch
    border-radius: 0.125rem
    background-color: $accent
    margin-right: 1rem
    flex-shrink: 0

    @media $mobile
      margin-bottom: 1rem

  &.negative::before
    background-color: $negative-saturated

  &.positive::before
    background-color: $positive-saturated

  &.warning::before
    background-color: $warning-saturated

    @media $mobile
      margin-bottom: 1rem

  p
    margin: 0
    margin-right: 2rem

    @media $mobile
      margin-right: 0
      margin-bottom: 1rem
      max-width: calc(100% - 1.25rem)

  footer
    margin-left: auto
    text-align: right
    white-space: nowrap

    .button:last-child
      margin-left: 1rem
</style>
