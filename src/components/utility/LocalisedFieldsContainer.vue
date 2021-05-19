<template lang="html">
  <div class="localised-fields-container" :class="{ dark, error, 'in-split': inSplit }" tabindex="0" @click="showModal = true" @keyup.enter.space="showModal = true" @keydown.space.prevent>
    <div class="left">
      <p class="label">{{errorMessage || `${label} (localised)`}}</p>
      <p class="content" :class="{ empty }">{{!empty ? displayValue : 'Not set'}}</p>
    </div>
    <MbIcon :icon="error ? 'error' : 'pencil'" />
    <MbModal class="localisation-modal" :dark="dark" :title="`${label} (localised)`" :visible="showModal" @close="showModal = false" @after-close="$emit('modal-closed')" @keyup.ctrl.enter="showModal = false">
      <teleport :disabled="!teleportTarget" :to="teleportTarget">
        <template v-for="lang in languages" :key="lang">
          <slot :lang="lang" />
        </template>
      </teleport>
      <template #actions>
        <MbButton :dark="dark" type="primary" @click="showModal = false">Done</MbButton>
      </template>
    </MbModal>
  </div>
</template>

<script>
export default {
  computed: {
    empty() {
      return this.displayValue === null || this.displayValue === '' || typeof this.displayValue === 'undefined';
    },
    errorMessage() {
      if (this.error && typeof this.error === 'string') return this.error;
      if (this.error && Object.values(this.error).some((value) => value)) return 'One or more subfields have errors';
      return '';
    },
  },
  data() {
    return {
      showModal: false,
    };
  },
  emits: ['modal-closed'],
  props: {
    dark: Boolean,
    displayValue: {}, // could be anything
    error: [String, Object],
    inSplit: Boolean,
    label: String,
    languages: Array,
    teleportTarget: HTMLElement,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/fields'
</style>
