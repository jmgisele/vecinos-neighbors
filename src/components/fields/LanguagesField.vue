<template lang="html">
  <section class="languages field">
    <p :class="{ error }">{{ error || `${label}:` }}</p>
    <MbCheckboxGroup :checkboxes="checkboxes" :dark="dark" inline :model-value="modelValue || []" @update:model-value="handleInput" />
  </section>
</template>

<script>
import field from '../../mixins/field';

export default {
  computed: {
    checkboxes() {
      if (!this.$store.state.currentProject.languages) return [];
      return this.$store.state.currentProject.languages.map((lang) => ({ label: lang, value: lang }));
    },
  },
  methods: {
    validate(value) {
      if (!this.validation) return '';

      let error = '';

      if (this.validation.min && value.length < this.validation.min) {
        if (this.validation.min === 1) error = 'At least one language is required';
        else error = `At least ${this.validation.min} languages are required`;
      }
      return error;
    },
  },
  mixins: [field],
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/colors'

.languages.field
  > p
    margin-top: 0
    margin-bottom: 0.5rem

    &.error
      color: $negative-saturated
</style>
