<template lang="html">
  <div class="localised-fields-container" :class="{ active, dark, error, 'in-split': inSplit }" tabindex="0" @click="openValues" @keyup.enter.space="openValues" @keydown.space.prevent>
    <div class="left">
      <p class="label">{{errorMessage || `${label} (localised)`}}</p>
      <p class="content" :class="{ empty }">{{!empty ? displayValue : 'Not set'}}</p>
    </div>
    <MbIcon :icon="active ? 'cross' : error ? 'error' : 'pencil'" />
    <MbModal class="localisation-modal" :dark="dark" :title="`${label} (localised)`" :visible="showModal" @close="closeValues" @after-close="$emit('modal-closed')" @keyup.ctrl.enter="closeValues">
      <teleport v-if="!teleportTarget || active" :disabled="!teleportTarget" :to="teleportTarget">
        <h2 v-if="teleportTarget" class="h3 split-title">{{label}} (localised)</h2>
        <template v-for="lang in languages" :key="lang">
          <slot :lang="lang" />
        </template>
      </teleport>
      <template #actions>
        <MbButton :dark="dark" type="primary" @click="closeValues">Done</MbButton>
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
  emits: ['modal-closed', 'update:active'],
  methods: {
    closeValues() {
      if (this.teleportTarget) this.$emit('update:active', false);
      else this.showModal = false;
    },
    openValues() {
      if (this.active) {
        this.closeValues();
        return;
      }
      if (this.teleportTarget) this.$emit('update:active', true);
      else this.showModal = true;
    },
  },
  props: {
    active: Boolean,
    dark: Boolean,
    displayValue: {}, // could be anything
    error: [String, Object],
    inSplit: Boolean,
    label: String,
    languages: Array,
    teleportTarget: [String, HTMLElement],
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/fields'
</style>
