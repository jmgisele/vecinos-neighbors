<template lang="html">
  <section class="select field">
    <p :class="{ error }">{{ error || `${label}:` }}</p>
    <MbSelect :class="{ error }" :dark="dark" :disabled="!selectOptions || selectOptions.length === 0" :filterable="options.filterable" :model-value="modelValue" :options="selectOptions" :placeholder="options.placeholder" @update:model-value="handleInput" />
  </section>
</template>

<script>
import fs, { joinPath } from '../../fs';

import field from '../../mixins/field';

export default {
  computed: {
    selectOptions() {
      if (Array.isArray(this.options.options)) return this.options.options;
      // it’s a file
      return this.fileModel;
    },
  },
  created() {
    if (this.options.options && !Array.isArray(this.options.options)) this.fetchFileModel();
  },
  data() {
    return {
      fileModel: [],
    };
  },
  methods: {
    async fetchFileModel() {
      if (!this.options.options.path || !this.options.options.key) this.fileModel = [];
      else {
        try {
          this.fileModel = JSON.parse(await fs.readFile(joinPath('/projects', this.$store.state.currentProject.id, this.options.options.path), 'utf8'))[this.options.options.key];
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while loading the model for ${this.label}: ${err}`, type: 'error' });
        }
      }
    },
  },
  mixins: [field],
  watch: {
    'options.options': {
      handler(nv, ov) {
        if (!Array.isArray(nv) && nv.path && nv.key && (this.fileModel.length === 0 || ov.path !== nv.path)) this.fetchFileModel();
      },
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'

.select.field
  display: flex
  align-items: center
  justify-content: space-between

  > p
    margin: 0
    margin-right: 1rem

    &.error
      color: $negative-saturated

  ::v-deep(.select.error)
    border-color: $negative

  @media $mobile
    display: block

    > p
      margin-bottom: 0.5rem

    ::v-deep(.select)
      width: 100%
</style>
