<template lang="html">
  <MbModal class="schema-preview-modal" :dark="dark" :padded-body="false" :title="title" :visible="visible" @close="$emit('close')">
    <MbTabs v-if="schema.tabs && schema.tabs.length > 1" v-model="activeTab" :dark="dark" :tabs="cleanTabs" />
    <transition mode="out-in">
      <div class="content-wrapper" :key="Math.max(0, activeTab)">
        <MbFieldsEditor v-model="contentForTab" :class="{ 'tabs-visible': schema.tabs && schema.tabs.length > 1 }" compact :dark="dark" :fields="fieldsForTab" :languages="languages" />
        <h3 :class="{ dark }">Output</h3>
        <pre>{{fakeModel}}</pre>
      </div>
    </transition>
  </MbModal>
</template>

<script>
import getContentLanguages from '../../assets/js/getContentLanguages';
import generateDefaultContentFromSchema from '../../assets/js/generateDefaultContentFromSchema';

export default {
  computed: {
    cleanTabs() {
      if (!this.schema.tabs) return [];
      return this.schema.tabs.map((tab) => tab.label);
    },
    contentForTab: {
      get() {
        if (this.activeTab < 0) return this.fakeModel;
        const { groupAs } = this.schema.tabs[this.activeTab];
        if (groupAs) return this.fakeModel[groupAs] || {};
        return this.fakeModel;
      },
      set(v) {
        const { groupAs } = this.schema.tabs[this.activeTab];
        if (groupAs) this.fakeModel[groupAs] = v;
        else this.fakeModel = v;
        if (this.previewConnected) this.sendPreviewData();
      },
    },
    fieldsForTab() {
      if (!this.schema.fields) return [];
      if (this.activeTab === 0) return this.schema.fields.filter((field) => field.tab === this.cleanTabs[0] || !field.tab); // first tab shows all fields without tab, too
      return this.schema.fields.filter((field) => field.tab === this.cleanTabs[this.activeTab]);
    },
    languages() {
      return getContentLanguages(this.fakeModel, this.schema, this.$store.state.currentProject.languages);
    },
  },
  data() {
    return {
      activeTab: -1,
      fakeModel: {},
    };
  },
  emits: ['close'],
  props: {
    dark: Boolean,
    schema: Object,
    title: {
      type: String,
      default: 'Schema Preview',
    },
    visible: Boolean,
  },
  watch: {
    visible(nv) {
      if (!nv) return;
      this.fakeModel = generateDefaultContentFromSchema(this.schema);
      if (this.activeTab < 0) this.$nextTick(() => { this.activeTab = 0; }); // so the indicator looks right
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'

.schema-preview-modal
  .tabs
    position: sticky
    top: 0
    z-index: 2

  .content-wrapper
    padding: 2rem
    padding-top: 0

    @media $mobile
      padding: 1rem
      padding-top: 0

    &.v-enter-active,
    &.v-leave-active
      transition: opacity 200ms ease

      &.v-enter-from,
      &.v-leave-to
        opacity: 0

    .fields-editor
      margin-top: 1rem
      width: 100%

      &.tabs-visible
        margin-top: 2rem

    > h3
      margin-top: 3rem
      color: $text-secondary

      &.dark
        color: $text-secondary-dark

    > pre
      margin: 0
</style>
