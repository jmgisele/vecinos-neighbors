<template lang="html">
  <div class="edit-schema">
    <header>
      <div class="left">
        <h1>{{schemaName}}</h1>
        <MbChip :color="status.color" :label="status.message" :loading="status.loading" />
      </div>
      <div class="right">
        <MbButton :dark="dark" icon="settings" @click="showSchemaSettings = true">{{isTablet && !isMobile ? '' : 'Settings'}}</MbButton>
        <MbButton :dark="dark" icon="save" :icon-first="true" type="primary">{{isTablet && !isMobile ? '' : 'Save'}}</MbButton>
      </div>
    </header>
    <MbTabs v-model="activeTab" :dark="dark" show-add-option :tabs="cleanTabs" @add-tab="showEditTab = true" />
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
        <transition mode="out-in">
          <FieldArrangementList :dark="dark" :field-being-edited="fieldBeingEdited" :fields="fieldsForTab" parent-key="___toplevel" :key="activeTab" @fieldclick="handleFieldClick" @fieldmove="handleFieldMove" />
        </transition>
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
    <MbModal class="edit-tab-modal" :dark="dark" slim :title="tabBeingEdited.index !== null ? 'Edit Tab' : 'Add Tab'" :visible="showEditTab" @close="showEditTab = false" @after-close="resetTabBeingEdited" @after-open="$refs.tabLabelInput.focus()">
      <MbInput v-model="tabBeingEdited.data.label" :dark="dark" :error="errors.tabLabel" icon="text-input" label="Tab label" ref="tabLabelInput" @blur="showEditTab && validate('tabLabel')" @keyup.ctrl.enter="saveTab" />
      <MbToggle v-model="enableGroupAs" :dark="dark" :icons="['cross', 'check']" @update:model-value="!$event ? tabBeingEdited.data.groupAs = '' : $nextTick(() => $refs.tabGroupAsInput.focus())">Group fields in this tab as an object</MbToggle>
      <transition>
        <MbInput v-show="enableGroupAs" v-model="tabBeingEdited.data.groupAs" :dark="dark" :error="errors.tabGroupAs" icon="group" label="Key to group fields under" ref="tabGroupAsInput" @keyup.ctrl.enter="saveTab" @blur="validate('tabGroupAs')" />
      </transition>
      <template #actions>
        <MbButton :dark="dark" @click="showEditTab = false">Cancel</MbButton>
        <MbButton :dark="dark" :disabled="Boolean(errors.tabLabel || errors.tabGroupAs)" type="primary" @click="saveTab">{{tabBeingEdited.index !== null ? 'Save' : 'Add'}}</MbButton>
      </template>
    </MbModal>
    <MbModal class="edit-schema-modal" :dark="dark" slim title="Schema Settings" :visible="showSchemaSettings" @close="showSchemaSettings = false" @after-close="resetSchemaName">
      <MbInput v-model="newSchemaName" :dark="dark" :error="errors.schemaName" icon="text-input" label="Name" @blur="validate('schemaName')" />
      <MbSortableList v-slot="{ beingDragged, item }" :items="schema.tabs" key-name="label" @itemclick="handleTabClick" @itemmove="handleTabMove">
        <div class="edit-tab-element" :class="{ 'being-dragged': beingDragged, dark }">
          <MbIcon data-drag-handle icon="drag-handle" />
          <span>{{item.label}}</span>
          <MbButton data-ignore-drag :dark="dark" icon="pencil" rounded />
        </div>
      </MbSortableList>
      <template #actions>
        <MbButton :dark="dark" @click="showSchemaSettings = false">Cancel</MbButton>
        <MbButton :dark="dark" :disabled="Boolean(errors.schemaName)" type="primary" @click="setSchemaSettings">Save</MbButton>
      </template>
    </MbModal>
  </div>
</template>

<script>
import { status } from 'isomorphic-git';
import slugify from '@sindresorhus/slugify';
import fs, { exists, PlainFS, readdirDeep, joinPath, pathBasename, pathDirname } from '../fs'; // eslint-disable-line object-curly-newline
import prettifyEntityName from '../assets/js/prettifyEntityName';

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
        vm.newSchemaName = prettifyEntityName(pathBasename(path)); // eslint-disable-line no-param-reassign
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
      return this.schema.fields.filter((field) => field.tab === this.cleanTabs[this.activeTab] || field.key === '___addIndicator');
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
    schemaName() {
      return prettifyEntityName(pathBasename(this.$route.params.path));
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
      enableGroupAs: false,
      errors: {
        schemaName: '',
        tabGroupAs: '',
        tabLabel: '',
      },
      fieldAddIndex: null,
      fieldAddParent: null,
      fieldBeingEdited: null,
      fileStatus: null,
      fieldFilter: '',
      fieldToTransfer: null,
      fieldsLoading: false,
      newSchemaName: '',
      schema: {},
      showEditTab: false,
      showSchemaSettings: false,
      showSplit: false,
      tabBeingEdited: {
        index: null,
        data: {
          label: '',
          groupAs: '',
        },
      },
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
        const parentFieldFields = this.fieldAddParent === '___toplevel' ? this.schema.fields : this.getField(this.fieldAddParent).value;

        this.removeCurrentAddIndicator();

        if (parentFieldFields.length === 0) {
          cleanField.key = field.type || 'unknown';
          parentFieldFields.push(cleanField);
        } else {
          cleanField.key = this.generateUniqueFieldKey(parentFieldFields, field.type);
          parentFieldFields.splice(this.fieldAddIndex, 0, cleanField);
        }
      } else {
        cleanField.key = this.generateUniqueFieldKey(this.schema.fields, cleanField.type);
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
    generateUniqueFieldKey(otherFields, potentialKey = 'unknown') {
      if (!otherFields.find((existingField) => existingField.key === potentialKey)) return potentialKey;
      let counter = 1;
      // NOTE: this loop actually works as intended, despite the warning by eslint – and I wouldn’t really know how to write it otherwise
      while (otherFields.find((existingField) => existingField.key === `${potentialKey}-${counter}`)) { // eslint-disable-line no-loop-func
        counter += 1;
      }
      return `${potentialKey}-${counter}`;
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
    handleFieldOver({ parent, index, dropzone, isBottomHalf }) { // eslint-disable-line object-curly-newline
      let realIndex = parent === '___toplevel' ? this.schema.fields.indexOf(this.fieldsForTab[index]) : index;
      if (realIndex === -1) realIndex = this.schema.fields.length; // happens when hovering a dropzone when toplevel is empty
      else if (isBottomHalf) realIndex += 1;
      if (parent && index !== null && !dropzone) {
        const parentFieldFields = parent === '___toplevel' ? this.schema.fields : this.getField(parent).value;

        if (parentFieldFields.length > 0) {
          const id = Math.random().toString(36).slice(2, 9);
          parentFieldFields.splice(realIndex, 0, { id, key: '___addIndicator' });
          this.removeCurrentAddIndicator();
          this.currentAddIndicatorParent = parent;
          this.currentAddIndicatorId = id;
        }
      } else this.removeCurrentAddIndicator();

      this.fieldAddParent = parent;
      this.fieldAddIndex = realIndex;
    },
    handleFieldClick({ detail }) {
      const { parent, index } = detail;
      const parentFieldFields = parent === '___toplevel' ? this.fieldsForTab : this.getField(parent).value;
      const field = parentFieldFields[index];
      if (field === this.fieldBeingEdited) {
        this.showSplit = false;
        return;
      }
      this.fieldBeingEdited = field;
      this.currentOperation = 'edit-field';
      if (!this.showSplit) this.showSplit = true;
    },
    handleFieldMove({ detail }) {
      const { parent, index, target } = detail;
      const parentFieldFields = parent === '___toplevel' ? this.schema.fields : this.getField(parent).value;
      const targetFieldFields = target.parent === '___toplevel' ? this.schema.fields : this.getField(target.parent).value;
      const realIndex = parent === '___toplevel' ? this.schema.fields.indexOf(this.fieldsForTab[index]) : index;
      const realTargetIndex = target.parent === '___toplevel' ? this.schema.fields.indexOf(this.fieldsForTab[target.index]) : target.index;
      this.removeCurrentAddIndicator();
      if (parent === target.parent) {
        if ((realIndex < realTargetIndex && target.isBottomHalf) || (realIndex > realTargetIndex && !target.isBottomHalf)) {
          const [field] = parentFieldFields.splice(realIndex, 1);
          if (field) targetFieldFields.splice(realTargetIndex, 0, field);
        }
        window.removeEventListener('pointerup', this.transferField, { once: true, capture: true });
        this.fieldAddIndex = null;
        this.fieldAddParent = null;
        this.fieldToTransfer = null;
      } else {
        const targetIndex = (!target.dropzone && target.isBottomHalf) ? realTargetIndex + 1 : realTargetIndex;
        this.fieldToTransfer = { parent, index: realIndex };
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
    handleSplitClosed() {
      if (this.fieldBeingEdited) this.fieldBeingEdited = null;
      this.currentOperation = null;
    },
    handleTabClick(index) {
      console.log('clicked tab', index);
    },
    handleTabMove({ activeItem, index, isBottomHalf }) {
      console.log('dragged tab', activeItem, 'to', index, 'which is bottom half:', isBottomHalf);
    },
    removeCurrentAddIndicator() {
      if (!this.currentAddIndicatorParent) return;
      const parentFieldFields = this.currentAddIndicatorParent === '___toplevel' ? this.schema.fields : this.getField(this.currentAddIndicatorParent).value;
      parentFieldFields.splice(parentFieldFields.findIndex((field) => field.key === '___addIndicator' && field.id === this.currentAddIndicatorId), 1);
      this.currentAddIndicatorParent = null;
      this.currentAddIndicatorId = null;
    },
    resetSchemaName() {
      this.newSchemaName = this.schemaName;
      this.errors.schemaName = '';
    },
    resetTabBeingEdited() {
      this.tabBeingEdited = {
        index: null,
        data: {
          label: '',
          groupAs: '',
        },
      };
      this.enableGroupAs = false;
      this.errors.tabLabel = '';
      this.errors.tabGroupAs = '';
    },
    saveTab() {
      this.validate('tabLabel');
      this.validate('tabGroupAs');
      if (this.errors.tabLabel || this.errors.tabGroupAs) return;

      const cleanTab = {
        label: this.tabBeingEdited.data.label.trim(),
        groupAs: this.tabBeingEdited.data.groupAs || null,
      };

      if (this.tabBeingEdited.index !== null) this.schema.tabs.splice(this.tabBeingEdited.index, 1, cleanTab);
      else {
        this.schema.tabs.push(cleanTab);
        this.$nextTick(() => { // wait a tick so the underline can update correctly
          this.activeTab = this.schema.tabs.length - 1;
        });
      }
      this.showEditTab = false;
    },
    async setSchemaSettings() {
      this.validate('schemaName');
      if (this.errors.schemaName) return;

      const newName = slugify(this.newSchemaName, this.$store.state.currentProject.slugifyOptions || { lowercase: false, decamelize: false, preserveLeadingUnderscore: true });
      const newPath = joinPath(pathDirname(this.$route.params.path), `${newName}.json`);
      const alreadyExists = await exists(newPath);

      if (alreadyExists) {
        this.errors.schemaName = 'A schema with this name already exists';
        return;
      }

      await fs.rename(this.$route.params.path, newPath);
      this.$router.replace({ params: { id: this.$route.params.id, path: newPath } });
      this.showSchemaSettings = false;
    },
    transferField() {
      if (this.fieldAddParent && this.fieldToTransfer) {
        this.$store.commit('setAppProperty', { key: 'dragActive', value: false });
        const { parent, index } = this.fieldToTransfer;
        const parentFieldFields = parent === '___toplevel' ? this.schema.fields : this.getField(parent).value;
        const targetFieldFields = this.fieldAddParent === '___toplevel' ? this.schema.fields : this.getField(this.fieldAddParent).value;
        const [field] = parentFieldFields.splice(index, 1);

        field.key = this.generateUniqueFieldKey(targetFieldFields, field.key);

        this.removeCurrentAddIndicator();
        targetFieldFields.splice(this.fieldAddIndex, 0, field);
        this.fieldAddIndex = null;
        this.fieldAddParent = null;
        this.fieldToTransfer = null;
      }
    },
    validate(field) {
      let error = '';
      switch (field) {
        case 'schemaName':
          if (!this.newSchemaName || !this.newSchemaName.trim()) error = 'A name is required';
          break;
        case 'tabLabel':
          if (!this.tabBeingEdited.data.label) error = 'A label is required';
          else if (this.schema.tabs.find((tab) => tab.label === this.tabBeingEdited.data.label)) error = 'A tab with this label already exists';
          break;
        case 'tabGroupAs':
          if (this.schema.tabs.find((tab) => tab.groupAs === this.tabBeingEdited.data.groupAs)) error = 'A tab with this key already exists';
          break;
        default:
          // no op
      }
      this.errors[field] = error;
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
@require '../assets/styles/corners'

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

        &.v-enter-active,
        &.v-leave-active
          transition: opacity 200ms ease

          &.v-enter-from,
          &.v-leave-to
            opacity: 0

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

.edit-tab-modal,
.edit-schema-modal
  .input
    width: 100%

    &.v-enter-active,
    &.v-leave-active
      transition: opacity 200ms ease

      &.v-enter-from,
      &.v-leave-to
        opacity: 0

  .toggle
    margin-top: 1.5rem

.edit-schema-modal
  .input
    margin-bottom: 1rem

  .sortable-list
    &::v-deep(.drag-item:not(:last-child))
      margin-bottom: 0.5rem

// needs to be toplevel so dragging clone can have its styles
.edit-tab-element
  padding: 1rem
  padding-right: 0.5rem
  box-shadow: inset 0 0 0 0.0625rem $text-tertiary
  border-radius: $radius-m
  display: flex
  align-items: center
  background-color: $bg

  &.dark
    background-color: $bg-secondary-dark
    box-shadow: inset 0 0 0 0.0625rem $bg-tertiary-dark

  .icon:not(.button)
    flex-shrink: 0
    margin-right: 1rem

  span
    margin-right: auto
    text-overflow: ellipsis
    white-space: nowrap
    overflow: hidden

  .button
    flex-shrink: 0
    margin-left: 0.5rem

  &.being-dragged
    opacity: 0.25

</style>
