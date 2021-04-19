<template lang="html">
  <div class="edit-schema">
    <header>
      <div class="left">
        <h1>{{schema.name}}</h1>
        <MbChip :color="status.color" :label="status.message" :loading="status.loading" />
      </div>
      <div class="right">
        <MbButton :dark="dark" icon="settings">{{isTablet && !isMobile ? '' : 'Settings'}}</MbButton>
        <MbButton :dark="dark" icon="save" :icon-first="true" type="primary">{{isTablet && !isMobile ? '' : 'Save'}}</MbButton>
      </div>
    </header>
    <MbTabs v-model="activeTab" :dark="dark" show-add-option :tabs="cleanTabs" @add-tab="handleAddTab" />
    <TabContent :dark="dark" :show-split="showSplit" @split-close="showSplit = false" @split-closed="handleSplitClosed">
      <div v-if="currentOperation !== 'add-field' && schema.fields && schema.fields.length === 0" class="empty-state" :class="{ dark }">
        <h2>There’s nothing here yet</h2>
        <p>This schema currently has no fields. You can start adding some with the button below, or have Mattrbld automatically generate a set of fields for you based on a piece of content.</p>
        <footer>
          <MbButton :dark="dark" icon="document">Generate from content</MbButton>
          <MbButton :dark="dark" icon="plus" type="positive" @click="handleAddField">Add field</MbButton>
        </footer>
      </div>
      <div v-else-if="currentOperation !== 'add-field' && fieldsForTab.length === 0" class="empty-state" :class="{ dark }">
        <h2>There’s nothing here yet</h2>
        <footer>
          <MbButton :dark="dark" icon="plus" type="positive" @click="handleAddField">Add field</MbButton>
        </footer>
      </div>
      <div v-else class="added-fields-list">
        <FieldArrangementList :dark="dark" :field-being-edited="fieldBeingEdited" :fields="fieldsForTab" parent-key="___toplevel" @fieldclick="handleFieldClick" @fieldmove="handleFieldMove" />
        <MbButton v-show="currentOperation !== 'add-field'" :dark="dark" icon="plus" type="positive" @click="handleAddField">Add field</MbButton>
      </div>

      <template #right>
        <div v-if="currentOperation === 'add-field'" class="add-field" :class="{ dark }">
          <header>
            <h2 :class="{ h3: isMobile }">Add a field</h2>
            <MbInput v-model="fieldFilter" :dark="dark" icon="search" placeholder="Search field…" type="search" />
          </header>
          <transition mode="out-in">
            <div v-if="fieldsLoading" class="loader-wrapper">
              <MbLoader />
              <p>Loading available fields…</p>
            </div>
            <div v-else class="fields-list">
              <div v-for="key in filteredFields.keys()" class="field-group" :key="key">
                <h3>{{key}}</h3>
                <FieldThumbnail v-for="(field, index) in filteredFields.get(key)" :dark="dark" :description="field.description" :icon="field.icon" :key="index" :name="field.label" @add-field="addFieldToSchema(field)" @field-over="handleFieldOver" />
              </div>
            </div>
          </transition>
        </div>
      </template>
    </TabContent>
  </div>
</template>

<script>
import { status } from 'isomorphic-git';
import fs, { PlainFS, readdirDeep, joinPath } from '../fs';

import defaultFields from '../data/defaultFields';

import FieldArrangementList from '../components/utility/FieldArrangementList.vue';
import FieldThumbnail from '../components/utility/FieldThumbnail.vue';
import TabContent from '../components/utility/TabContent.vue';

export default {
  async beforeRouteEnter(to, from, next) {
    try {
      const { id, path } = to.params;
      const schema = JSON.parse(await fs.readFile(path, 'utf8'));
      const fileStatus = await status({ fs: PlainFS, dir: `/projects/${id}`, filepath: path.replace(`/projects/${id}/`, '') }); // filepath needs to be relative

      return next((vm) => {
        vm.schema = { fields: [], tabs: [{ label: 'Untitled Tab', groupAs: null }], ...schema }; // eslint-disable-line no-param-reassign
        vm.fileStatus = fileStatus; // eslint-disable-line no-param-reassign
      });
    } catch (err) {
      if (err.code === 'ENOENT') return next({ name: 'NotFound' });
      return next({ name: 'Error', params: { code: err.code, message: err.message, name: err.name } });
    }
  },
  components: {
    FieldArrangementList,
    FieldThumbnail,
    TabContent,
  },
  computed: {
    cleanTabs() {
      if (!this.schema.tabs) return [];
      return this.schema.tabs.map((tab) => tab.label);
    },
    fieldsForTab() {
      if (!this.schema.fields) return [];
      if (this.activeTab === 0) return this.schema.fields.filter((field) => field.tab === this.cleanTabs[0] || !field.tab); // first tab shows all fields without tab, too
      return this.schema.fields.filter((field) => field.tab === this.cleanTabs[this.activeTab]);
    },
    filteredFields() {
      if (!this.availableFields) return new Map();
      if (!this.fieldFilter) return this.availableFields;
      return Array.from(this.availableFields).reduce((newMap, [group, fields]) => {
        const lowercaseFieldFilter = this.fieldFilter.toLowerCase();
        if (group.includes(lowercaseFieldFilter)) {
          newMap.set(group, fields);
          return newMap;
        }
        const filteredFields = fields.filter((field) => field.label.toLowerCase().includes(lowercaseFieldFilter) || field.type.includes(lowercaseFieldFilter));
        if (filteredFields.length > 0) newMap.set(group, filteredFields);
        return newMap;
      }, new Map());
    },
    isMobile() {
      return this.$store.state.application.mobile;
    },
    isTablet() {
      return this.$store.state.application.tablet;
    },
    status() {
      if (!this.fileStatus) return { color: 'warning', loading: true };
      if (this.fileStatus !== 'unmodified') return { color: 'warning', message: 'local changes' };
      return { color: 'positive', message: 'synchronised' };
    },
  },
  data() {
    return {
      activeTab: -1,
      availableFields: null,
      currentAddIndicatorId: null,
      currentAddIndicatorParent: null,
      currentOperation: null,
      fieldAddIndex: null,
      fieldAddParent: null,
      fieldBeingEdited: null,
      fileStatus: null,
      fieldFilter: '',
      fieldToTransfer: null,
      fieldsLoading: false,
      schema: {},
      showSplit: false,
    };
  },
  methods: {
    addFieldToSchema(field) {
      const cleanField = {};

      Object.entries(field).forEach(([key, value]) => {
        if (key === 'options' && value.length > 0) {
          cleanField.options = {};
          value.forEach((option) => {
            cleanField.options[option.key] = option.value;
          });
        } else if (key === 'value' && value) cleanField.value = [];
        else cleanField[key] = value;
      });

      cleanField.tab = this.cleanTabs[this.activeTab];
      delete cleanField.description; // not needed, so let’s save space
      delete cleanField.group; // not needed, so let’s save space

      if (this.fieldAddIndex !== null && this.fieldAddParent) {
        let parentFieldFields;
        if (this.fieldAddParent === '___toplevel') parentFieldFields = this.schema.fields;
        else parentFieldFields = this.getField(this.fieldAddParent).value;

        this.removeCurrentAddIndicator();

        if (parentFieldFields.length === 0) {
          cleanField.key = field.type || 'unknown';
          parentFieldFields.push(cleanField);
        } else {
          const potentialKey = field.type || 'unknown';
          if (!parentFieldFields.find((existingField) => existingField.key === potentialKey)) cleanField.key = potentialKey;
          else {
            let counter = 1;
            // NOTE: this loop actually works as intended, despite the warning by eslint – and I wouldn’t really know how to write it otherwise
            while (parentFieldFields.find((existingField) => existingField.key === `${potentialKey}-${counter}`)) { // eslint-disable-line no-loop-func
              counter += 1;
            }
            cleanField.key = `${potentialKey}-${counter}`;
          }
          parentFieldFields.splice(this.fieldAddIndex, 0, cleanField);
        }
      } else {
        this.schema.fields.push(cleanField);
      }
      this.fieldAddIndex = null;
      this.fieldAddParent = null;

      if (this.isMobile && this.showSplit) this.showSplit = false;
    },
    getField(path) {
      const segments = path.split('.');
      let next = this.schema.fields.find((field) => field.key === segments[0]);
      if (segments.length === 1) return next;
      for (let index = 1; index < segments.length; index += 1) {
        const segment = segments[index];
        if (next) next = next.value.find((field) => field.key === segment);
        else break;
      }
      return next;
    },
    async handleAddField() {
      this.currentOperation = 'add-field';
      this.showSplit = true;

      if (!this.availableFields) {
        this.fieldsLoading = true;

        let customFieldsData = [];

        try {
          const customFieldsPath = `/projects/${this.$route.params.id}/.mattrbld/custom-fields`;
          const customFieldFiles = await readdirDeep(customFieldsPath);
          customFieldsData = await Promise.all(customFieldFiles.map((file) => fs.readFile(joinPath(customFieldsPath, file), 'utf8')));
        } catch (err) {
          // the directory might not exist, but that is okay
          if (err.code !== 'ENOENT') this.$store.commit('addToast', { message: `Something went wrong while loading the custom fields: ${err.message}`, type: 'error' });
        }

        const unsortedMap = [...defaultFields, ...customFieldsData].reduce((map, data) => {
          const field = typeof data === 'string' ? JSON.parse(data) : data;
          let { group } = field;
          if (!group) group = 'miscellaneous';

          if (map.has(group)) map.get(group).push(field);
          else map.set(group, [field]);

          return map;
        }, new Map());
        this.availableFields = new Map([...unsortedMap].sort((a, b) => a[0].localeCompare(b[0])));
        this.fieldsLoading = false;
      }
    },
    handleAddTab() {
      console.log('new tab at index');
    },
    handleFieldOver({ parent, index, dropzone }) {
      if (parent && index !== null && !dropzone) {
        const parentFieldFields = parent === '___toplevel' ? this.schema.fields : this.getField(parent).value;

        if (parentFieldFields.length > 0) {
          const id = Math.random().toString(36).slice(2, 9);
          parentFieldFields.splice(index, 0, { id, key: '___addIndicator' });
          this.removeCurrentAddIndicator();
          this.currentAddIndicatorParent = parent;
          this.currentAddIndicatorId = id;
        }
      } else this.removeCurrentAddIndicator();

      this.fieldAddParent = parent;
      this.fieldAddIndex = index;
    },
    handleFieldClick({ detail }) {
      const { parent, index } = detail;
      const parentFieldFields = parent === '___toplevel' ? this.schema.fields : this.getField(parent).value;
      const field = parentFieldFields[index];
      if (field === this.fieldBeingEdited) {
        this.showSplit = false;
        return;
      }
      this.fieldBeingEdited = parentFieldFields[index];
      this.currentOperation = 'edit-field';
      if (!this.showSplit) this.showSplit = true;
    },
    handleFieldMove({ detail }) {
      const { parent, index, target } = detail;
      const parentFieldFields = parent === '___toplevel' ? this.schema.fields : this.getField(parent).value;
      const targetFieldFields = target.parent === '___toplevel' ? this.schema.fields : this.getField(target.parent).value;
      this.removeCurrentAddIndicator();
      if (parent === target.parent) {
        if ((index < target.index && target.isBottomHalf) || (index > target.index && !target.isBottomHalf)) {
          const [field] = parentFieldFields.splice(index, 1);
          if (field) targetFieldFields.splice(target.index, 0, field);
        }
        window.addEventListener('pointerup', this.transferField, { once: true, capture: true });
        this.fieldAddIndex = null;
        this.fieldAddParent = null;
        this.fieldToTransfer = null;
      } else {
        const targetIndex = (!target.dropzone && target.isBottomHalf) ? target.index + 1 : target.index;
        this.fieldToTransfer = { parent, index };
        this.fieldAddParent = target.parent;
        this.fieldAddIndex = targetIndex;

        if (!target.dropzone) {
          const id = Math.random().toString(36).slice(2, 9);
          targetFieldFields.splice(targetIndex, 0, { id, key: '___addIndicator' });
          this.currentAddIndicatorParent = target.parent;
          this.currentAddIndicatorId = id;
        }

        window.addEventListener('pointerup', this.transferField, { once: true, capture: true });
      }
    },
    transferField() {
      if (this.fieldAddParent && this.fieldToTransfer) {
        this.$store.commit('setAppProperty', { key: 'dragActive', value: false });
        const { parent, index } = this.fieldToTransfer;
        const parentFieldFields = parent === '___toplevel' ? this.schema.fields : this.getField(parent).value;
        const targetFieldFields = this.fieldAddParent === '___toplevel' ? this.schema.fields : this.getField(this.fieldAddParent).value;
        this.removeCurrentAddIndicator();
        targetFieldFields.splice(this.fieldAddIndex, 0, parentFieldFields.splice(index, 1)[0]);
        this.fieldAddIndex = null;
        this.fieldAddParent = null;
        this.fieldToTransfer = null;
      }
    },
    handleSplitClosed() {
      if (this.fieldBeingEdited) this.fieldBeingEdited = null;
      this.currentOperation = null;
    },
    removeCurrentAddIndicator() {
      if (!this.currentAddIndicatorParent) return;
      const parentFieldFields = this.currentAddIndicatorParent === '___toplevel' ? this.schema.fields : this.getField(this.currentAddIndicatorParent).value;
      parentFieldFields.splice(parentFieldFields.findIndex((field) => field.key === '___addIndicator' && field.id === this.currentAddIndicatorId), 1);
      this.currentAddIndicatorParent = null;
      this.currentAddIndicatorId = null;
    },
    validateSchema() {
      // TODO: add schema validation
      // Step 1: check if all fields have keys
      // Step 2: make sure there are no errors within any fields
    },
  },
  mounted() {
    this.$nextTick(() => { // needed so the active indicator looks right
      this.activeTab = 0;
    });
  },
  props: {
    dark: Boolean,
  },
  watch: {
    currentOperation(nv, ov) {
      if (nv && ov === 'edit-field') this.fieldBeingEdited = null;
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'

.edit-schema // 100% minus the height of the app-header
  height: "calc(100vh - %s)" % (116 / 16)rem
  user-select: none

  @media $tablet
    height: "calc(100vh - %s)" % (84 / 16)rem

  @media $mobile
    height: "calc(100vh - %s)" % (82 / 16)rem

  > header
    display: flex
    padding: 0 2rem 2rem 2rem

    @media $tablet
      padding: 1rem
      padding-top: 0

    @media $mobile
      display: block

    .left
      display: flex
      align-items: center
      margin-right: auto

      @media $tablet
        margin-left: 1rem

      @media $mobile
        margin-bottom: 1rem
        margin-left: 0

      h1
        margin: 0
        margin-right: 1.5rem
        margin-left: 1rem
        white-space: nowrap
        overflow: hidden
        text-overflow: ellipsis

        @media $tablet
          margin-left: 0

        @media $mobile
          font-size: 1.5rem
          margin-right: 0.5rem

      .chip
        @media $mobile
          order: -1
          width: 1rem
          height: @width
          padding: 0
          margin-right: 0.5rem

          &::v-deep(span)
            display: none

    .right
      display: flex
      align-items: center
      overflow: hidden
      margin-left: 1rem
      padding-bottom: 0.125rem

      @media $mobile
        margin-left: 0

      .button
        @media $tablet
          width: 100%

        &:not(:last-child)
          margin-right: 1rem

  .tabs
    position: sticky
    top: 0
    z-index: 1

  .tab-content
    height: "calc(100% - %s)" % ((86 + 56) / 16)rem // header + tabs

    @media $mobile
      height: auto

    .empty-state,
    .added-fields-list
      max-width: 40rem
      margin-top: 8rem
      margin-left: auto
      margin-right: auto

    .empty-state
      @media $mobile
        margin-top: 0

      &.dark
        h2, p
          color: $text-secondary-dark

      h2,
      p
        text-align: center
        color: $text-secondary

      p
        max-width: 32rem
        margin-left: auto
        margin-right: auto

        @media $mobile
          text-align: left

      footer
        margin: -0.5rem
        margin-top: 1.5rem
        display: flex
        flex-wrap: wrap
        justify-content: center

        .button
          margin: 0.5rem

          @media $mobile
            flex-grow: 1

    .added-fields-list
      @media $tablet
        margin-top: 4rem

      @media $mobile
        margin-top: 2rem

      .field-arrangement-list
        margin-bottom: 1rem

        &::v-deep(> .field-arrangement-item:last-child:not(.dragging))
          padding-bottom: 2rem

      .button
        display: flex
        margin-left: auto
        margin-right: auto

        @media $mobile
          width: 100%

.add-field // needs to be toplevel since modal teleports
  &.dark
    header .input
      background-color: $bg-tertiary-dark

    .fields-list .field-group h3
      color: $text-secondary-dark

  header
    margin-top: 8rem
    max-width: 40rem
    margin-left: auto
    margin-right: auto

    @media $tablet
      margin-top: 4rem

    @media $mobile
      margin-top: 0
      text-align: center

    h2
      margin-top: 0

    .input
      display: flex
      width: 100%

  .loader-wrapper,
  .fields-list
    &.v-enter-active,
    &.v-leave-active
      transition: opacity 200ms ease

      &.v-enter-from,
      &.v-leave-to
        opacity: 0

  .loader-wrapper
    margin: 4rem 0
    text-align: center

    p
      opacity: 0.5

  .fields-list
    max-width: 40rem
    margin-left: auto
    margin-right: auto

    .field-group
      margin-top: 4rem

      @media $tablet
        margin-top: 2rem

      h3
        text-transform: capitalize
        color: $text-secondary
</style>
