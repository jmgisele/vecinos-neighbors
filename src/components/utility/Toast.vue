<template lang="html">
  <div class="toast" :class="[toast.type, { dark, 'no-footer': toast.permanent && !toast.action }]" :key="toast.id">
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
      actionHandled: false,
      timeoutId: null,
    };
  },
  methods: {
    close() {
      if (this.timeoutId) window.clearTimeout(this.timeoutId);
      if (typeof this.toast.onClose === 'function') this.toast.onClose(this.actionHandled);
      this.$store.commit('removeToast', this.toast.id);
    },
    handleAction() {
      this.toast.action();
      this.actionHandled = true;
      this.close();
    },
  },
  mounted() {
    if (this.toast.timeout > 0) this.timeoutId = window.setTimeout(() => this.close(), this.toast.timeout);
    if (this.toast.closeOnRouteChange) {
      this.$watch(
        '$route',
        (to, from) => {
          if (to.name !== from.name) this.close();
        },
      );
    }
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
  box-shadow:
    0 1.3px 2.2px -12px alpha($bg-dark,.017),
    0 3.2px 5.3px -12px alpha($bg-dark,.024),
    0 6px 10px -12px alpha($bg-dark,.03),
    0 10.7px 17.9px -12px alpha($bg-dark,.036),
    0 20.1px 33.4px -12px alpha($bg-dark,.043),
    0 48px 80px -12px alpha($bg-dark,.06),
    inset 0 0 0 0.0625rem $accent-secondary
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

    &.no-footer
      &::before
        margin-bottom: 0

      p
        margin-bottom: 0

  &.dark
    background-color: $bg-secondary-dark
    box-shadow: inset 0 0 0 0.0625rem mix($accent-secondary, $bg-tertiary-dark, 25)

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

  &.negative
    box-shadow:
      0 1.3px 2.2px -12px alpha($bg-dark,.017),
      0 3.2px 5.3px -12px alpha($bg-dark,.024),
      0 6px 10px -12px alpha($bg-dark,.03),
      0 10.7px 17.9px -12px alpha($bg-dark,.036),
      0 20.1px 33.4px -12px alpha($bg-dark,.043),
      0 48px 80px -12px alpha($bg-dark,.06),
      inset 0 0 0 0.0625rem $negative-saturated

    &.dark
      box-shadow: inset 0 0 0 0.0625rem mix($negative-saturated, $bg-tertiary-dark, 25)

    &::before
      background-color: $negative-saturated

  &.positive
    box-shadow:
      0 1.3px 2.2px -12px alpha($bg-dark,.017),
      0 3.2px 5.3px -12px alpha($bg-dark,.024),
      0 6px 10px -12px alpha($bg-dark,.03),
      0 10.7px 17.9px -12px alpha($bg-dark,.036),
      0 20.1px 33.4px -12px alpha($bg-dark,.043),
      0 48px 80px -12px alpha($bg-dark,.06),
      inset 0 0 0 0.0625rem $positive-saturated

    &.dark
      box-shadow: inset 0 0 0 0.0625rem mix($positive-saturated, $bg-tertiary-dark, 25)

    &::before
      background-color: $positive-saturated

  &.warning
    box-shadow:
      0 1.3px 2.2px -12px alpha($bg-dark,.017),
      0 3.2px 5.3px -12px alpha($bg-dark,.024),
      0 6px 10px -12px alpha($bg-dark,.03),
      0 10.7px 17.9px -12px alpha($bg-dark,.036),
      0 20.1px 33.4px -12px alpha($bg-dark,.043),
      0 48px 80px -12px alpha($bg-dark,.06),
      inset 0 0 0 0.0625rem $warning-saturated

    &.dark
      box-shadow: inset 0 0 0 0.0625rem mix($warning-saturated, $bg-tertiary-dark, 25)

    &::before
      background-color: $warning-saturated

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
