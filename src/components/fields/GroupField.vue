<template lang="html">
  <section class="group field">
    <div class="display-wrapper" :class="{ active, dark, error, 'in-split': inSplit, 'no-display-value': !localisedDisplayValue }" tabindex="0" @click="openGroup" @keyup.enter.space="openGroup" @keydown.space.prevent>
      <div class="left">
        <p class="label" :class="{ unstyled: !localisedDisplayValue }">{{error || label}}</p>
        <p v-if="localisedDisplayValue || error" class="content">{{localisedDisplayValue || label}}</p>
      </div>
      <MbIcon :icon="active ? 'cross' : error ? 'error' : 'pencil'" />
    </div>
    <MbModal class="group-content" :dark="dark" :title="label" :visible="showModal" @close="closeGroup" @keyup.ctrl.enter="closeGroup">
      <teleport v-if="!teleportTarget || active" :disabled="!teleportTarget" :to="teleportTarget">
        <MbFieldsEditor compact :dark="dark" :fields="children" :in-split="Boolean(teleportTarget)" :model-value="modelValue" :parent-languages="languages" @update:error="handleError" @update:model-value="update" />
      </teleport>
      <template #actions>
        <MbButton :dark="dark" type="primary" @click="closeGroup">Done</MbButton>
      </template>
    </MbModal>
  </section>
</template>

<script>
import { get as _get } from 'lodash-es';

import field from '../../mixins/field';

export default {
  computed: {
    localisedDisplayValue() {
      if (!this.displayField) return null;
      const displayValue = _get(this.modelValue, this.displayField);

      if (displayValue !== null && typeof displayValue === 'object') return Object.values(displayValue).find((value) => value) || '';
      return displayValue;
    },
  },
  data() {
    return {
      showModal: false,
    };
  },
  methods: {
    closeGroup() {
      if (this.splitTarget) this.$emit('update:active', false);
      else this.showModal = false;
    },
    handleError(err) {
      if (!err || err.size === 0) this.$emit('update:error', '');
      else this.$emit('update:error', err.size === 1 ? 'A subfield has errors' : `${err.size} subfields have errors`);
    },
    openGroup() {
      if (this.active) {
        this.closeGroup();
        return;
      }
      if (this.splitTarget) this.$emit('update:active', true);
      else this.showModal = true;
    },
    update(v) {
      this.$emit('update:modelValue', v);
    },
  },
  mixins: [field],
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/fields'

.group.field
  .display-wrapper
    &.no-display-value // to match height of input fields
      padding-top: 1.0625rem
      padding-bottom: @padding-top
</style>
