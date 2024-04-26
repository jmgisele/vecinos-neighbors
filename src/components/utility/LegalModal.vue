<template>
  <MbModal class="legal-modal" :dark="dark" :title="title" :visible="visible" @close="$emit('close')">
    <slot>
      <p>This is an instance of Mattrbld hosted by a third party. No privacy policy was configured for it, please contact the administrator of the instance.</p>
      <p><strong>The Mattrbld project is not affiliated with this instance.</strong></p>
    </slot>
    <template #actions>
      <MbButton :dark="dark" type="primary" @click="$emit('close')">Got it</MbButton>
    </template>
  </MbModal>
</template>

<script>
export default {
  emits: ['close'],
  props: {
    dark: Boolean,
    title: String,
    visible: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
</style>
