<template lang="html">
  <MbModal class="entity-creation-modal" :dark="dark" :title="title" :visible="visible" @close="handleCancel">
    <MbSegmentedSelector v-if="!only" v-model="entity" :dark="dark" :options="[{ label: 'File', value: 'file' }, { label: 'Folder', value: 'directory' }]" />
    <!-- Todo: add an input for the name and a connected select for the filetype / connected field if there’s only one file type -->
    <template #actions>
      <MbButton :dark="dark" @click="handleCancel">Cancel</MbButton>
      <MbButton :dark="dark" :disabled="!name && nameError" type="primary" @click="handleSubmit">Submit</MbButton>
    </template>
  </MbModal>
</template>

<script>
export default {
  computed: {
    fullName() {
      return `${this.name}.${this.currentFileExtension}`;
    },
  },
  created() {
    if (this.only) this.entity = this.only;
    else this.entity = 'file';

    if (Array.isArray(this.fileExtension)) [this.currentFileExtension] = this.fileExtension;
    else if (typeof this.fileExtension === 'string') this.currentFileExtension = this.fileExtension;
  },
  data() {
    return {
      currentFileExtension: null,
      entity: null,
      name: '',
      nameError: '',
    };
  },
  emits: ['cancel'],
  methods: {
    handleCancel() {
      this.$emit('cancel');
    },
    handleSubmit() {
      this.$emit('create', this.fullName);
    },
  },
  props: {
    dark: Boolean,
    fileExtension: [String, Array],
    only: {
      type: String,
      validator: (v) => ['file', 'directory'].includes(v),
    },
    path: {
      type: String,
      default: '/',
    },
    title: {
      type: String,
      default: 'Create new…',
    },
    visible: Boolean,
  },
  watch: {
    only(nv) {
      if (nv) this.entity = nv;
      else this.entity = 'file';
    },
  },
};
</script>

<style lang="stylus" scoped>
</style>
