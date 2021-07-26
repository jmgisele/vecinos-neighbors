<template lang="html">
  <MbModal class="legal-modal" :dark="dark" :title="title" :visible="visible" @close="$emit('close')">
    <p><strong>Todo:</strong> add dynamic privacy policy passed in through an env variable? So people self hosting can easily adjust it. 🤔</p>
    <p>Default message something like “A privacy policy was not configured for this Mattrbld instance. Please contact the administrator. Mattrbld is not affiliated with this instance.”</p>
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
