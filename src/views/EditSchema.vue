<template lang="html">
  <div class="edit-schema">
    <header>
      <div class="left">
        <h1>{{schemaName}}</h1>
        <MbChip :color="status.color" :label="status.message" :loading="status.loading" />
      </div>
      <div class="right">
        <MbButton :dark="dark" icon="settings" @click="showSchemaSettings = true">{{isTablet ? '' : 'Settings'}}</MbButton>
        <MbButton :dark="dark" :disabled="!wasChanged" icon="save" :icon-first="true" :loading="saveLoading" type="primary" @click="saveChanges">{{isTablet && !isMobile ? '' : 'Save'}}</MbButton>
      </div>
    </header>
    <MbTabs v-model="activeTab" :dark="dark" show-add-option :tabs="cleanTabs" @add-tab="showEditTab = true" />
    <TabContent :dark="dark" ref="tabContent" :show-split="showSplit" @split-close="showSplit = false" @split-closed="handleSplitClosed">
      <transition mode="out-in">
        <div v-if="!showSplit && schema.fields && schema.fields.length === 0" class="empty-state" :class="{ dark }">
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
            <FieldArrangementList :dark="dark" :field-being-edited="fieldBeingEdited" :fields="fieldsForTab" parent-key="___toplevel" :key="activeTab" @fieldclick="handleFieldClick" @fieldcontextmenu="openContextMenu" @fieldmove="handleFieldMove" />
          </transition>
          <transition>
            <MbButton v-show="currentOperation !== 'add-field'" :dark="dark" icon="plus" type="positive" @click="handleAddField">Add field</MbButton>
          </transition>
        </div>
      </transition>

      <template #right="{ isModal }">
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
        <div v-else-if="currentOperation === 'edit-field'" class="edit-field" :class="{ dark, 'in-modal': isModal }">
          <header>
            <h2 :class="{ h3: isMobile }">{{fieldBeingEdited.label}}<span v-if="!fieldBeingEdited.label">Untitled Field</span></h2>
            <span>{{fieldBeingEdited.type}} field</span>
          </header>
          <section>
            <h3>General Settings</h3>
            <div class="input-row">
              <MbInput v-model.lazy.trim="fieldBeingEdited.label" :dark="dark" :error="fieldErrors.label" icon="tag" label="Label" @update:model-value="validateField('label')" />
              <MbInput v-if="!fieldBeingEdited.visualOnly" v-model.lazy.trim="fieldBeingEdited.key" :dark="dark" :error="fieldErrors.key" icon="key" label="Content key" @focus="validateField('key')" @update:model-value="validateField('key')" />
            </div>
            <div v-if="fieldBeingEditedToplevel" class="select-wrapper">
              <span>Tab:</span>
              <MbSelect :dark="dark" :model-value="fieldBeingEdited.tab" :options="tabsForSelect" @update:model-value="moveFieldToTab(fieldBeingEdited, $event)" />
            </div>
            <div v-if="typeof fieldBeingEdited.displayField !== 'undefined'" class="select-wrapper">
              <span>Field value to display in compact mode:</span>
              <MbSelect v-model="fieldBeingEdited.displayField" :dark="dark" :options="childFieldKeys" placeholder="Select a field…" />
            </div>
            <MbToggle v-if="typeof fieldBeingEdited.localised !== 'undefined'" v-model="fieldBeingEdited.localised" :dark="dark">Enable localisation for this field</MbToggle>
            <p v-if="typeof fieldBeingEdited.default !== 'undefined'"><strong>Todo:</strong> insert an actual field of this type here with the options of <code>fieldBeingEdited</code> to set a default! (Except replace "label" prop with "Default Value")</p>
          </section>
          <section v-if="availableFieldOptions.has(fieldBeingEdited.type)">
            <h3>Field Configuration</h3>
            <section v-for="option in availableFieldOptions.get(fieldBeingEdited.type)" class="config-option" :class="[option.component]" :key="option.key">
              <span v-if="option.label">{{option.label}}</span>
              <component v-bind="option.props" v-model="fieldBeingEdited.options[option.key]" :dark="dark" :is="option.component">{{option.slot}}</component>
            </section>
          </section>
          <section v-if="fieldBeingEdited.validation">
            <h3>Validation</h3>
            <MbToggle v-if="typeof fieldBeingEdited.validation.required !== 'undefined'" v-model="fieldBeingEdited.validation.required" :dark="dark">Make this field required</MbToggle>
            <div v-if="typeof fieldBeingEdited.validation.min !== 'undefined' || typeof fieldBeingEdited.validation.max !== 'undefined'" class="input-row">
              <MbInput v-if="typeof fieldBeingEdited.validation.min !== 'undefined'" v-model.lazy.number="fieldBeingEdited.validation.min" :dark="dark" label="Minimum length (optional)" type="number" />
              <MbInput v-if="typeof fieldBeingEdited.validation.max !== 'undefined'" v-model.lazy.number="fieldBeingEdited.validation.max" :dark="dark" label="Maximum length (optional)" type="number" />
            </div>
            <MbToggle v-if="typeof fieldBeingEdited.validation.enforceMinMax !== 'undefined' && (fieldBeingEdited.validation.min || fieldBeingEdited.validation.max)" v-model="fieldBeingEdited.validation.enforceMinMax" :dark="dark">Enforce minimum / maximum length</MbToggle>
            <div v-if="fieldBeingEdited.validation && typeof fieldBeingEdited.validation.regex !== 'undefined'" class="input-row">
              <MbInput v-model.lazy="fieldBeingEdited.validation.regex" :dark="dark" label="Regular expression (optional)" @update:model-value="validateField('regex')" />
              <MbInput v-show="fieldBeingEdited.validation.regex" v-model.lazy="fieldBeingEdited.validation.regexError" :dark="dark" label="Error message (optional)" />
            </div>
          </section>
          <section v-if="fieldBeingEdited.visibility">
            <h3>Visibility</h3>
            <MbToggle v-if="typeof fieldBeingEdited.visibility.hidden !== 'undefined'" v-model="fieldBeingEdited.visibility.hidden" :dark="dark">Hide this field</MbToggle>
            <MbTagInput v-if="!fieldBeingEdited.visibility.hidden" v-model="fieldBeingEdited.visibility.limitToRoles" :autocomplete-model="projectRoles" autocomplete-property="label" :dark="dark" label="Limit visibility to (optional)" placeholder="Role(s)" />
            <div v-if="flattenedFieldKeys.length > 1 && !fieldBeingEdited.visibility.hidden && fieldBeingEdited.visibility.showByValue" class="conditional-wrapper">
              <span>Show if</span>
              <MbSelect v-model="fieldBeingEdited.visibility.showByValue.field" :dark="dark" :options="flattenedFieldKeys" placeholder="Field…" />
              <MbSelect v-model="fieldBeingEdited.visibility.showByValue.value" allow-null class="operator" :dark="dark" :options="showByValueOptions" placeholder="Condition…" />
              <MbInput v-if="fieldBeingEdited.visibility.showByValue.value === 'matches'" v-model.lazy="fieldBeingEdited.visibility.showByValue.comparator" :dark="dark" placeholder="Regular expression" />
              <MbInput v-else-if="['equals', 'greater', 'smaller'].includes(fieldBeingEdited.visibility.showByValue.value)" v-model.lazy.number="fieldBeingEdited.visibility.showByValue.comparator" :dark="dark" placeholder="Number" type="number" />
            </div>
          </section>
          <section>
            <MbHighlightBox color="negative" :dark="dark" label="Field removal">
              <p>Deleting a field from a Schema <strong>does not</strong> delete that field in content elements. It only makes it so that field can no longer be edited through Mattrbld.</p>
              <MbButton :dark="dark" icon="trash" type="negative" @click="deleteField(fieldBeingEdited)">Delete field</MbButton>
            </MbHighlightBox>
          </section>
        </div>
      </template>
    </TabContent>
    <MbModal class="edit-tab-modal" :dark="dark" slim :title="tabBeingEdited.index !== null ? 'Edit Tab' : 'Add Tab'" :visible="showEditTab" @close="showEditTab = false" @after-close="resetTabBeingEdited" @after-open="!tabBeingEdited.data.label && $refs.tabLabelInput.focus()">
      <MbInput v-model="tabBeingEdited.data.label" :dark="dark" :error="errors.tabLabel" icon="tag" label="Tab label" ref="tabLabelInput" @blur="showEditTab && validate('tabLabel')" @keyup.ctrl.enter="saveTab" />
      <MbToggle v-model="enableGroupAs" :dark="dark" :icons="['cross', 'check']" @update:model-value="!$event ? tabBeingEdited.data.groupAs = '' : $nextTick(() => $refs.tabGroupAsInput.focus())">Group fields in this tab as an object</MbToggle>
      <transition>
        <MbInput v-show="enableGroupAs" v-model="tabBeingEdited.data.groupAs" :dark="dark" :error="errors.tabGroupAs" icon="group" label="Key to group fields under" ref="tabGroupAsInput" @keyup.ctrl.enter="saveTab" @blur="validate('tabGroupAs')" />
      </transition>
      <MbHighlightBox v-if="tabBeingEdited.index !== null && schema.tabs.length > 1" color="negative" :dark="dark" label="Danger Zone">
        <p>Deleting a tab also removes all fields contained within from the Schema.</p>
        <MbButton class="delete-tab-button" :dark="dark" icon="trash" type="negative" @click="deleteTab">Delete Tab</MbButton>
      </MbHighlightBox>
      <template #actions>
        <MbButton :dark="dark" @click="showEditTab = false">Cancel</MbButton>
        <MbButton :dark="dark" :disabled="Boolean(errors.tabLabel || errors.tabGroupAs)" type="primary" @click="saveTab">{{tabBeingEdited.index !== null ? 'Save' : 'Add'}}</MbButton>
      </template>
    </MbModal>
    <MbModal class="edit-schema-modal" :dark="dark" slim title="Schema Settings" :visible="showSchemaSettings" @close="showSchemaSettings = false" @after-close="resetSchemaName">
      <MbInput v-model="newSchemaName" :dark="dark" :error="errors.schemaName" icon="document" label="Name" @blur="validate('schemaName')" />
      <p><strong>Tabs</strong></p>
      <MbSortableList v-slot="{ activeItem, item }" :items="schema.tabs" key-name="label" @itemclick="handleTabClick" @itemmove="handleTabMove">
        <div class="edit-tab-element" :class="{ 'being-dragged': activeItem === item, dark }" :data-drag-handle="isMobile ? undefined : true">
          <MbIcon data-drag-handle icon="drag-handle" />
          <span>{{item.label}}</span>
          <MbIcon icon="pencil" />
        </div>
      </MbSortableList>
      <MbButton class="add-tab-button" :dark="dark" icon="plus" type="positive" @click="showEditTab = true">Add Tab</MbButton>
      <MbHighlightBox color="negative" :dark="dark" label="Danger Zone">
        <p>Deleting a Schema that is still used for content elements will cause them to not be displayed correctly. Please make sure to only delete this schema, if you know what you’re doing.</p>
        <MbButton class="delete-tab-button" :dark="dark" icon="trash" type="negative" @click="deleteSchema">Delete Schema</MbButton>
      </MbHighlightBox>
      <template #actions>
        <MbButton :dark="dark" @click="showSchemaSettings = false">Cancel</MbButton>
        <MbButton :dark="dark" :disabled="Boolean(errors.schemaName)" type="primary" @click="renameSchema">Save</MbButton>
      </template>
    </MbModal>
    <MbContextMenu :dark="dark" :options="fieldContextMenu.options" :show="fieldContextMenu.show" :target="fieldContextMenu.target" :x="fieldContextMenu.x" :y="fieldContextMenu.y" @close="fieldContextMenu.show = false; resetFieldContextMenu()" />
  </div>
</template>

<script>
import { cloneDeep } from 'lodash-es';
import { status } from 'isomorphic-git';
import slugify from '@sindresorhus/slugify';
import fs, { exists, PlainFS, readdirDeep, joinPath, pathBasename, pathDirname } from '../fs'; // eslint-disable-line object-curly-newline
import Store from '../store';
import prettifyEntityName from '../assets/js/prettifyEntityName';

import availableRoles from '../data/availableRoles';
import defaultFields from '../data/defaultFields';

import FieldArrangementList from '../components/utility/FieldArrangementList.vue';
import FieldThumbnail from '../components/utility/FieldThumbnail.vue';
import TabContent from '../components/utility/TabContent.vue';

export default {
  async beforeRouteEnter(to, from, next) {
    try {
      const { id, path } = to.params;
      let schema;
      let fromBackup = false;

      if (Store.state.application.temporaryStorage) { // if we have a backup
        schema = Store.state.application.temporaryStorage;
        fromBackup = true;
        Store.commit('setAppProperty', { key: 'temporaryStorage', value: null });
      } else {
        schema = JSON.parse(await fs.readFile(path, 'utf8'));
      }
      const fileStatus = await status({ fs: PlainFS, dir: `/projects/${id}`, filepath: path.replace(`/projects/${id}/`, '') }); // filepath needs to be relative

      let customFieldsData = [];
      const availableFieldOptions = new Map();

      try {
        const customFieldsPath = `/projects/${to.params.id}/.mattrbld/custom-fields`;
        const customFieldFiles = await readdirDeep(customFieldsPath);
        customFieldsData = await Promise.all(customFieldFiles.map((file) => fs.readFile(joinPath(customFieldsPath, file), 'utf8')));
      } catch (err) {
        // the directory might not exist, but that is okay
        if (err.code !== 'ENOENT') throw new Error(`Something went wrong while loading the custom fields: ${err.message}`);
      }

      const unsortedMap = [...defaultFields, ...customFieldsData].reduce((map, data) => {
        const field = typeof data === 'string' ? JSON.parse(data) : data;
        const { options, type } = field;
        let { group } = field;
        if (!group) group = 'miscellaneous';

        if (type && options) availableFieldOptions.set(type, options); // doing this here so we don’t have to loop over it multiple times

        if (map.has(group)) map.get(group).push(field);
        else map.set(group, [field]);

        return map;
      }, new Map());

      return next((vm) => {
        vm.schema = { fields: [], tabs: [{ label: 'Untitled Tab', groupAs: null }], ...schema }; // eslint-disable-line no-param-reassign
        vm.fileStatus = fileStatus; // eslint-disable-line no-param-reassign
        vm.newSchemaName = prettifyEntityName(pathBasename(path)); // eslint-disable-line no-param-reassign
        vm.availableFields = new Map([...unsortedMap].sort((a, b) => a[0].localeCompare(b[0]))); // eslint-disable-line no-param-reassign
        vm.availableFieldOptions = availableFieldOptions; // eslint-disable-line no-param-reassign
        if (fromBackup) vm.wasChanged = true; // eslint-disable-line no-param-reassign
      });
    } catch (err) {
      if (err.code === 'ENOENT') return next({ name: 'NotFound' });
      return next({ name: 'Error', params: { code: err.code, message: err.message, name: err.name } });
    }
  },
  async beforeRouteLeave() {
    // if (this.forceNavigation) {
    //   next();
    //   return;
    // }
    // if (this.wasChanged) {
    //   this.$store.commit('addToast', {
    //     action: next,
    //     actionLabel: 'Discard changes',
    //     message: 'You have unsaved changes, do you want to discard them?',
    //     type: 'warning',
    //   });
    // } else next();
    if (this.forceNavigation) return true;
    if (this.wasChanged) {
      // Massive HACK, but the old way of just running next() as a Toast-Callback is beyond broken in router-next (I’ve created an issue)
      const timeout = 5000;
      let resolvePromise;

      const timeoutId = window.setTimeout(() => resolvePromise(false), timeout);

      this.$store.commit('addToast', {
        action: () => {
          window.clearTimeout(timeoutId);
          resolvePromise(true);
        },
        actionLabel: 'Discard changes',
        message: 'You have unsaved changes, do you want to discard them?',
        timeout: timeout - 200,
        type: 'warning',
      });

      const result = await new Promise((resolve) => {
        resolvePromise = resolve;
      });
      return result;
    } else return true; // eslint-disable-line no-else-return
    // return true;
  },
  beforeUnmount() {
    window.removeEventListener('beforeunload', this.preventUnintentionalClose);
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
    flattenedFieldKeys() {
      if (!this.schema || !this.schema.fields || this.schema.fields.length === 0) return [];
      return this.extractFieldKeys(this.schema.fields).concat([{ label: 'Unset', value: null }]);
    },
    isMobile() {
      return this.$store.state.application.mobile;
    },
    isTablet() {
      return this.$store.state.application.tablet;
    },
    projectRoles() {
      return [
        ...availableRoles,
        ...this.$store.state.currentProject.customRoles,
      ];
    },
    schemaName() {
      return prettifyEntityName(pathBasename(this.$route.params.path));
    },
    childFieldKeys() {
      if (!this.schema || !this.schema.fields || this.schema.fields.length === 0 || !this.fieldBeingEdited || !Array.isArray(this.fieldBeingEdited.value)) return [];
      return this.extractFieldKeys(this.fieldBeingEdited.value).concat([{ label: 'None', value: null }]);
    },
    status() {
      if (!this.fileStatus) return { color: 'warning', loading: true };
      if (this.fileStatus !== 'unmodified') return { color: 'warning', message: 'local changes' };
      return { color: 'positive', message: 'synchronised' };
    },
    tabsForSelect() {
      return this.cleanTabs.map((tab) => ({ value: tab }));
    },
  },
  data() {
    return {
      activeTab: -1,
      availableFields: null,
      availableFieldOptions: new Map(),
      currentAddIndicatorId: null,
      currentAddIndicatorParent: null,
      currentOperation: null,
      enableGroupAs: false,
      errors: {
        fieldBeingEditedLabel: '',
        fieldBeingEditedKey: '',
        schemaName: '',
        tabGroupAs: '',
        tabLabel: '',
      },
      fieldAddIndex: null,
      fieldAddParent: null,
      fieldBeingEdited: null,
      fieldBeingEditedSiblings: null,
      fieldBeingEditedToplevel: true,
      fieldContextMenu: {
        detail: null,
        field: null,
        options: [
          {
            action: this.handleContextMenuEdit,
            label: 'Edit',
            icon: 'pencil',
          },
          {
            action: this.handleContextMenuDelete,
            label: 'Delete',
            icon: 'trash',
            type: 'negative',
          },
        ],
        show: false,
        target: null,
        x: 0,
        y: 0,
      },
      fieldErrors: {
        key: '',
        label: '',
        regex: '',
      },
      fieldFilter: '',
      fieldToTransfer: null,
      fieldsLoading: false,
      fileStatus: null,
      forceNavigation: false,
      initialised: false,
      newSchemaName: '',
      saveLoading: false,
      schema: {},
      showByValueOptions: [
        { label: 'is true', value: true },
        { label: 'is false', value: false },
        { label: 'is null', value: null },
        { label: 'matches', value: 'matches' },
        { label: 'equals', value: 'equals' },
        { label: 'is smaller than', value: 'smaller' },
        { label: 'is greater than', value: 'greater' },
      ],
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
      wasChanged: false,
    };
  },
  methods: {
    addFieldToSchema(field) {
      const cleanField = {};

      Object.entries(field).forEach(([key, value]) => {
        if (key === 'options' && value.length > 0) {
          cleanField.options = {};
          value.forEach((option) => {
            cleanField.options[option.key] = cloneDeep(option.value);
          });
        } else if (key === 'value' && value) cleanField.value = [];
        else cleanField[key] = cloneDeep(value);
      });

      cleanField.tab = this.cleanTabs[this.activeTab];
      delete cleanField.description; // not needed, so let’s save space
      delete cleanField.group; // not needed, so let’s save space

      if (this.fieldAddIndex !== null && this.fieldAddParent) {
        const parentFieldFields = this.fieldAddParent === '___toplevel' ? this.schema.fields : this.getField(this.fieldAddParent).value;

        this.removeCurrentAddIndicator();

        if (parentFieldFields.length === 0) {
          cleanField.key = (field.type && field.type.replace(/ /g, '-')) || 'unknown';
          parentFieldFields.push(cleanField);
        } else {
          cleanField.key = this.generateUniqueFieldKey(parentFieldFields, field.type.replace(/ /g, '-'));
          parentFieldFields.splice(this.fieldAddIndex, 0, cleanField);
        }
      } else {
        cleanField.key = this.generateUniqueFieldKey(this.schema.fields, cleanField.type.replace(/ /g, '-'));
        this.schema.fields.push(cleanField);
      }
      this.fieldAddIndex = null;
      this.fieldAddParent = null;

      if (this.isMobile && this.showSplit) this.showSplit = false;
    },
    changeTabOfFields(fields, newTab) {
      fields.forEach((field) => {
        field.tab = newTab; // eslint-disable-line no-param-reassign
        if (Array.isArray(field.value)) this.changeTabOfFields(field.value, newTab);
      });
    },
    deleteField(field) {
      if (!field) return;
      const fieldPath = this.getFieldPath(field, this.schema.fields);

      if (!fieldPath) return; // the field is not valid / doesn’t exist

      const parentField = this.getField(fieldPath.substring(0, Math.max(0, fieldPath.lastIndexOf('.')) || Infinity));

      const parentFieldFields = fieldPath === parentField.key ? this.schema.fields : parentField.value;
      const index = parentFieldFields.indexOf(field);
      const [backup] = parentFieldFields.splice(index, 1);
      const { wasChanged } = this;
      if (field === this.fieldBeingEdited) this.showSplit = false;

      this.$store.commit('addToast', {
        action: () => {
          parentFieldFields.splice(index, 0, backup);
          if (!wasChanged) this.wasChanged = false;
        },
        actionLabel: 'Undo',
        message: `The field “${backup.label}” was deleted`,
        timeout: 5000 - 200,
        type: 'warning',
      });
    },
    deleteSchema() {
      const { id, path } = this.$route.params;
      const timeout = 5000;
      const timeoutId = window.setTimeout(async () => {
        try {
          await fs.unlink(path);
          this.$store.commit('removeLocallyChangedFile', path);
          this.$store.dispatch('saveAppData');
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while deleting the schema: ${err.message}`, type: 'error' });
          this.$router.replace({ name: 'Edit Schema', params: { id, path } });
        } finally {
          window.clearTimeout(timeoutId);
          this.$store.commit('removeFromSoftDeleted', path);
          this.$store.commit('setAppProperty', { key: 'temporaryStorage', value: null });
        }
      }, timeout);

      this.showSchemaSettings = false;
      if (this.wasChanged) this.$store.commit('setAppProperty', { key: 'temporaryStorage', value: cloneDeep(this.schema) });
      this.forceNavigation = true;
      this.$store.commit('addToSoftDeleted', path);
      this.$store.commit('addToast', {
        action: () => {
          window.clearTimeout(timeoutId);
          this.$store.commit('removeFromSoftDeleted', path);
          this.$router.replace({ name: 'Edit Schema', params: { id, path } });
        },
        actionLabel: 'Undo',
        message: `The schema “${this.schemaName}” was deleted`,
        timeout: timeout - 200,
        type: 'warning',
      });
      this.$router.replace({ name: 'Project.Settings', params: { id }, query: { tab: 'schemas' } });
    },
    deleteTab() {
      if (this.tabBeingEdited.index === null || this.schema.tabs.length === 1) return;
      const { data: backup, index } = this.tabBeingEdited;
      const lastActiveTab = this.activeTab;
      const timeout = 5000;
      const timeoutId = window.setTimeout(() => {
        this.schema.fields = this.schema.fields.filter((field) => field.tab !== backup.label);
      }, timeout);

      this.schema.tabs.splice(this.tabBeingEdited.index, 1);

      this.showEditTab = false;
      this.$store.commit('addToast', {
        action: () => {
          window.clearTimeout(timeoutId);
          this.schema.tabs.splice(index, 0, backup);
          this.activeTab = lastActiveTab;
        },
        actionLabel: 'Undo',
        message: `The tab “${backup.label}” and all its fields were deleted`,
        timeout: timeout - 200,
        type: 'warning',
      });
    },
    extractFieldKeys(fields, parent) {
      return fields.reduce((acc, field) => {
        if (Array.isArray(field.value)) acc.push(...this.extractFieldKeys(field.value, parent ? `${parent}.${field.key}` : field.key));
        else if (field === this.fieldBeingEdited || field.visualOnly) return acc;
        else acc.push({ label: field.label, value: parent ? `${parent}.${field.key}` : field.key });
        return acc;
      }, []);
    },
    flattenFields(fields) {
      return fields.reduce((acc, field) => {
        acc.push(field);
        if (Array.isArray(field.value)) acc.push(...this.flattenFields(field.value));
        return acc;
      }, []);
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
    getFieldPath(field, fields) {
      const path = [];
      let found = false;

      function search(subfields) { // we need an inner function here because otherwise the variables in the outer scope would constantly be overwritten
        for (let index = 0; index < subfields.length; index += 1) {
          const currentField = subfields[index];
          path.push(currentField.key);
          if (currentField === field) {
            found = true;
            break;
          }
          if (Array.isArray(currentField.value)) {
            search(currentField.value);
            if (found) break;
          }
          path.pop();
        }
      }

      search(fields);
      return path.join('.');
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
    },
    handleContextMenuDelete() {
      this.deleteField(this.fieldContextMenu.field);
      this.fieldContextMenu.show = false;
    },
    handleContextMenuEdit() {
      this.handleFieldClick({ detail: this.fieldContextMenu.detail });
      this.fieldContextMenu.show = false;
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
      this.fieldBeingEditedSiblings = parentFieldFields;
      this.fieldBeingEditedToplevel = parent === '___toplevel';
      this.currentOperation = 'edit-field';
      if (this.fieldBeingEdited.errors) this.fieldBeingEdited.errors.forEach((value, key) => { this.fieldErrors[key] = value; });
      else {
        this.fieldErrors = {
          key: '',
          label: '',
          regex: '',
        };
      }
      if (!this.showSplit) this.showSplit = true;
    },
    handleFieldMove({ detail }) {
      const { parent, index, target } = detail;
      const parentFieldFields = parent === '___toplevel' ? this.schema.fields : this.getField(parent).value;
      const targetFieldFields = target.parent === '___toplevel' ? this.schema.fields : this.getField(target.parent).value;
      const realIndex = parent === '___toplevel' ? this.schema.fields.indexOf(this.fieldsForTab[index]) : index;
      const realTargetIndex = target.parent === '___toplevel' ? this.schema.fields.indexOf(this.fieldsForTab[target.index]) : target.index;
      let lastAddIndicatorIndex;
      if (this.currentAddIndicatorParent === target.parent) {
        lastAddIndicatorIndex = targetFieldFields.findIndex((field) => field.key === '___addIndicator' && field.id === this.currentAddIndicatorId);
      }
      this.removeCurrentAddIndicator();
      if (parent === target.parent) {
        if ((realIndex < realTargetIndex && target.isBottomHalf) || (realIndex > realTargetIndex && !target.isBottomHalf)) {
          const [field] = parentFieldFields.splice(realIndex, 1);
          targetFieldFields.splice(realTargetIndex, 0, field);
        } else if (realIndex < realTargetIndex && !target.isBottomHalf) {
          const [field] = parentFieldFields.splice(realIndex, 1);
          targetFieldFields.splice(Math.max(0, realTargetIndex - 1), 0, field);
        } else if (realIndex > realTargetIndex && target.isBottomHalf) {
          const [field] = parentFieldFields.splice(realIndex, 1);
          targetFieldFields.splice(Math.min(realTargetIndex + 1, targetFieldFields.length - 1), 0, field);
        }
        window.removeEventListener('pointerup', this.transferField, { once: true, capture: true });
        this.fieldAddIndex = null;
        this.fieldAddParent = null;
        this.fieldToTransfer = null;
      } else {
        let targetIndex;
        if (target.dropzone) targetIndex = realTargetIndex;
        else if (typeof lastAddIndicatorIndex !== 'undefined') {
          if ((lastAddIndicatorIndex < realTargetIndex && target.isBottomHalf) || (lastAddIndicatorIndex > realTargetIndex && !target.isBottomHalf)) {
            targetIndex = realTargetIndex;
          } else if (lastAddIndicatorIndex < realTargetIndex && !target.isBottomHalf) targetIndex = Math.max(0, realTargetIndex - 1);
          else if (lastAddIndicatorIndex > realTargetIndex && target.isBottomHalf) targetIndex = Math.min(realTargetIndex + 1, targetFieldFields.length - 1);
        } else targetIndex = realTargetIndex;

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
      if (this.fieldBeingEdited) {
        this.fieldBeingEdited = null;
        this.fieldBeingEditedSiblings = null;
      }
      this.currentOperation = null;
    },
    handleTabClick(index) {
      const data = this.schema.tabs[index];
      this.tabBeingEdited = {
        index,
        data: { ...data },
      };
      if (data.groupAs) this.enableGroupAs = true;
      this.showEditTab = true;
    },
    handleTabMove({ activeItem, index, isBottomHalf }) {
      const currentIndex = this.schema.tabs.indexOf(activeItem);
      const isActiveTab = this.activeTab === currentIndex;
      if ((currentIndex < index && isBottomHalf) || (currentIndex > index && !isBottomHalf)) {
        this.schema.tabs.splice(index, 0, this.schema.tabs.splice(currentIndex, 1)[0]);
        if (isActiveTab) this.activeTab = index;
      } else if (currentIndex < index && !isBottomHalf) {
        this.schema.tabs.splice(Math.max(0, index - 1), 0, this.schema.tabs.splice(currentIndex, 1)[0]);
        if (isActiveTab) this.activeTab = Math.max(0, index - 1);
      } else if (currentIndex > index && isBottomHalf) {
        this.schema.tabs.splice(Math.min(index + 1, this.schema.tabs.length - 1), 0, this.schema.tabs.splice(currentIndex, 1)[0]);
        if (isActiveTab) this.activeTab = Math.min(index + 1, this.schema.tabs.length - 1);
      }
    },
    moveFieldToTab(field, tab, recursiveCall) {
      field.tab = tab; // eslint-disable-line no-param-reassign
      if (Array.isArray(field.value)) field.value.forEach((childField) => this.moveFieldToTab(childField, tab, true));
      if (!recursiveCall) {
        this.activeTab = this.cleanTabs.indexOf(tab);
      }
    },
    openContextMenu({ detail }) {
      const { parent, index, e } = detail;
      const parentFieldFields = parent === '___toplevel' ? this.fieldsForTab : this.getField(parent).value;
      this.fieldContextMenu.field = parentFieldFields[index];
      this.fieldContextMenu.detail = { parent, index };
      this.fieldContextMenu.target = e.currentTarget;
      this.fieldContextMenu.x = e.clientX;
      this.fieldContextMenu.y = e.clientY;
      this.fieldContextMenu.show = true;
    },
    preventUnintentionalClose(e) {
      if (this.forceNavigation) return;
      if (this.wasChanged) {
        this.$store.commit('addToast', {
          message: 'You have unsaved changes, save them before exiting if you don’t want to lose them.',
          type: 'warning',
          timeout: 10000,
        });
        e.preventDefault();
        e.returnValue = ''; // for chrome
      }
    },
    removeCurrentAddIndicator() {
      if (!this.currentAddIndicatorParent) return;
      const parentFieldFields = this.currentAddIndicatorParent === '___toplevel' ? this.schema.fields : this.getField(this.currentAddIndicatorParent).value;
      parentFieldFields.splice(parentFieldFields.findIndex((field) => field.key === '___addIndicator' && field.id === this.currentAddIndicatorId), 1);
      this.currentAddIndicatorParent = null;
      this.currentAddIndicatorId = null;
    },
    async renameSchema() {
      if (this.newSchemaName === this.schemaName) {
        this.showSchemaSettings = false;
        return;
      }
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
      this.$store.commit('removeLocallyChangedFile', this.$route.params.path);
      this.$store.commit('addLocallyChangedFile', newPath);
      this.showSchemaSettings = false;
      this.forceNavigation = true;
      this.$router.replace({ params: { id: this.$route.params.id, path: newPath } });
    },
    resetFieldContextMenu() {
      this.fieldContextMenu.detail = null;
      this.fieldContextMenu.field = null;
      this.fieldContextMenu.target = null;
      this.fieldContextMenu.x = 0;
      this.fieldContextMenu.y = 0;
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
    async saveChanges() {
      this.saveLoading = true;
      const valid = this.validateSchema();

      if (valid) {
        try {
          await fs.writeFile(this.$route.params.path, JSON.stringify(this.schema, null, 2), 'utf8');
          this.$store.commit('addToast', { message: `“${this.schemaName}” was saved successfully`, type: 'positive' });
          this.wasChanged = false;
        } catch (err) {
          this.$store.commit('addToast', { message: `Something went wrong while saving the file: ${err.message}`, type: 'error' });
        }
      } else {
        this.$store.commit('addToast', { message: 'At least one of the fields has errors, please fix them before saving.', type: 'negative' });
      }
      this.saveLoading = false;
    },
    saveTab() {
      this.validate('tabLabel');
      this.validate('tabGroupAs');
      if (this.errors.tabLabel || this.errors.tabGroupAs) return;

      const cleanTab = {
        label: this.tabBeingEdited.data.label.trim(),
        groupAs: this.tabBeingEdited.data.groupAs || null,
      };

      if (this.tabBeingEdited.index !== null) {
        const { label: oldLabel } = this.schema.tabs[this.tabBeingEdited.index];
        this.changeTabOfFields(this.schema.fields.filter((field) => field.tab === oldLabel), cleanTab.label);
        this.schema.tabs.splice(this.tabBeingEdited.index, 1, cleanTab);
        const lastActiveTab = this.activeTab;
        this.$nextTick(() => { this.activeTab = lastActiveTab; });
      } else {
        this.schema.tabs.push(cleanTab);
        this.activeTab = this.schema.tabs.length - 1;
      }
      this.showEditTab = false;
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
          else if (
            ((this.tabBeingEdited.index !== null && this.tabBeingEdited.data.label !== this.schema.tabs[this.tabBeingEdited.index].label) || this.tabBeingEdited.index === null)
            && this.schema.tabs.find((tab) => tab.label === this.tabBeingEdited.data.label)) error = 'A tab with this label already exists';
          break;
        case 'tabGroupAs':
          if (
            this.tabBeingEdited.data.groupAs
            && ((this.tabBeingEdited.index !== null && this.tabBeingEdited.data.groupAs !== this.schema.tabs[this.tabBeingEdited.index].groupAs) || this.tabBeingEdited.index === null)
            && this.schema.tabs.find((tab) => tab.groupAs === this.tabBeingEdited.data.groupAs)) error = 'A tab with this key already exists';
          break;
        default:
          // no op
      }
      this.errors[field] = error;
    },
    validateField(property) {
      if (property) {
        let error = '';

        switch (property) {
          case 'key':
            if (!this.fieldBeingEdited.key || !this.fieldBeingEdited.key.trim()) error = 'A key is required';
            else if (['___toplevel', '___addIndicator'].includes(this.fieldBeingEdited.key)) error = 'This is a reserved key';
            else if (this.fieldBeingEditedSiblings.filter((existingField) => existingField.key === this.fieldBeingEdited.key).length > 1) error = 'A field with this key already exists';
            break;
          case 'label':
            if (!this.fieldBeingEdited.label || !this.fieldBeingEdited.label.trim()) error = 'A label is required';
            break;
          case 'regex':
            if (this.fieldBeingEdited.validation && this.fieldBeingEdited.validation.regex) {
              try {
                new RegExp(this.fieldBeingEdited.validation.regex); // eslint-disable-line no-new
              } catch (err) {
                error = 'Invalid regular expression';
              }
            }
            break;
          default:
            // no op
        }

        this.fieldErrors[property] = error;
        if (error && !this.fieldBeingEdited.errors) this.fieldBeingEdited.errors = new Map([[property, error]]);
        else if (error) this.fieldBeingEdited.errors.set(property, error);
        else if (this.fieldBeingEdited.errors) {
          this.fieldBeingEdited.errors.delete(property);
          if (this.fieldBeingEdited.errors.size === 0) delete this.fieldBeingEdited.errors;
        }
      }
    },
    validateSchema() {
      const flattenedFields = this.flattenFields(this.schema.fields);

      for (let index = 0; index < flattenedFields.length; index += 1) {
        const field = flattenedFields[index];
        if (field.errors && field.errors.size > 0) return false;
        if (!field.key) {
          field.errors = new Map(['key', 'A key is required']);
          return false;
        }
        if (field.errors) delete field.errors; // clear empty errors properties
      }
      return true;
    },
  },
  mounted() {
    this.$nextTick(() => { // needed so the active indicator looks right
      this.activeTab = 0;
      this.initialised = true;
    });
  },
  props: {
    dark: Boolean,
  },
  watch: {
    currentOperation(nv, ov) {
      if (nv && ov === 'edit-field') this.fieldBeingEdited = null;
    },
    fieldBeingEdited() {
      this.$nextTick(() => this.$refs.tabContent.scrollSplit());
    },
    schema: {
      deep: true, // this might cause performance issues in large schemas, but it’s the most simple and robust way to ensure that wasChanged is updated whenever something changes
      handler() {
        if (!this.initialised || this.wasChanged) return;
        this.wasChanged = true;
      },
    },
    wasChanged(nv) {
      if (nv) {
        window.addEventListener('beforeunload', this.preventUnintentionalClose);
        if (this.fileStatus === 'unmodified') this.fileStatus = '*modified';
      } else {
        window.removeEventListener('beforeunload', this.preventUnintentionalClose);
      }
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

      &.v-enter-active,
      &.v-leave-active
        transition: opacity 100ms ease

        &.v-enter-from,
        &.v-leave-to
          opacity: 0

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
        margin-bottom: 0

        &.v-enter-active,
        &.v-leave-active
          transition: opacity 200ms ease

          &.v-enter-from,
          &.v-leave-to
            opacity: 0

        &::v-deep(> .field-arrangement-item:last-child:not(.dragging))
          padding-bottom: 2rem

        &::v-deep(> .field-arrangement-item:last-child.dragging)
          margin-bottom: 2rem

      .button
        display: flex
        margin-left: auto
        // margin-right: auto

        @media $mobile
          width: 100%

        &.v-leave-active
          display: none

        &.v-enter-active
          transition: opacity 200ms ease

          &.v-enter-from
            opacity: 0

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
    margin-bottom: 4rem

    @media $mobile
      margin-bottom: 0

    .field-group
      margin-top: 4rem

      @media $tablet
        margin-top: 2rem

      h3
        text-transform: capitalize
        color: $text-secondary

.edit-field // toplevel because of teleport
  &.dark
    header span,
    section h3
        color: $text-secondary-dark

    section
      .input
        background-color: $bg-tertiary-dark

      .editor
        &::v-deep(.content-wrapper)
          background-color: $bg-tertiary-dark

          &:not(:focus-within)
            box-shadow: inset 0 0.0625rem 0 0 lighten($bg-tertiary-dark, 10)

      .highlight-box
        background-color: $bg-secondary-dark

    &.in-modal
      section
        .highlight-box
          background-color: $bg-dark

        .input
          background-color: $bg-secondary-dark

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
      margin: 0

    span
      text-transform: capitalize
      color: $text-secondary

  > section
    max-width: 40rem
    margin-left: auto
    margin-right: auto

    &:not(:last-child)
      margin-bottom: 4rem

      @media $mobile
        margin-bottom: 3rem

    h3
      color: $text-secondary

    > .toggle
      margin-bottom: 2rem

      & + .input-row .input
        margin-top: 0

    .input-row
      margin-left: -0.5rem
      margin-right: @margin-left
      display: flex
      flex-wrap: wrap

      &:not(:last-child)
        margin-bottom: 2rem

      & + .input-row .input
        margin-top: 0

      .input
        flex-grow: 1
        width: calc(50% - 1rem)
        margin-left: 0.5rem
        margin-right: @margin-left

        @media $tablet
          width: 100%

          &:not(:first-child)
            margin-top: 2rem

    .select-wrapper,
    .conditional-wrapper
      display: flex
      align-items: center
      margin-bottom: 2rem

      > span
        margin-right: auto

    .conditional-wrapper
      > span
        margin-right: 1rem
        flex-shrink: 0

      .input
        margin-top: 0
        flex-grow: 1
        border-top-left-radius: 0
        border-bottom-left-radius: 0
        border-color: $accent

      &::v-deep(.select)
        border-top-right-radius: 0
        border-bottom-right-radius: 0
        height: (58 / 16)rem
        border-right-width: 0

        &.operator
          border-radius: 0
          flex-shrink: 0
          min-width: (183 / 16)rem

          &:last-child
            border-top-right-radius: $radius-m
            border-bottom-right-radius: $radius-m
            border-right-width: 0.0625rem

      @media $mobile
        flex-wrap: wrap

        > span
          margin-bottom: 0.5rem
          width: 100%

        &::v-deep(.select)
          width: 100%
          margin-right: 0
          border-right-width: 0.0625rem
          border-bottom-width: 0
          border-top-right-radius: $radius-m
          border-bottom-left-radius: 0

          &.operator:last-child
            border-top-right-radius: 0
            border-bottom-left-radius: $radius-m
            border-bottom-width: 0.0625rem

        .input
          margin-top: 0
          border-top-right-radius: 0
          border-bottom-left-radius: $radius-m

    .tag-input
      margin-bottom: 2rem
      margin-top: 3rem

    .highlight-box
      .button
        display: flex
        margin-left: auto

        @media $mobile
          width: 100%

    .config-option
      display: flex
      align-items: center
      justify-content: space-between

      &.MbCheckboxGroup
        align-items: flex-start

        > span
          margin-right: 1rem

        > .checkbox-group
          width: 100%
          max-width: (192 / 16)rem

      @media $mobile
        flex-wrap: wrap

        > span
          margin-bottom: 0.5rem

        &::v-deep(> .select),
        > .radio-group.inline::v-deep(label)
          width: 100%

      &:not(:last-child)
        margin-bottom: 1rem

        &.MbCheckboxGroup
          margin-bottom: 2rem

      > *:only-child
        width: 100%

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

  .highlight-box
    margin-top: 2rem

    .button
      display: flex
      margin-left: auto

      @media $mobile
        width: 100%

.edit-schema-modal
  .input
    margin-bottom: 1rem

  .sortable-list
    &::v-deep(.drag-item)
      margin-bottom: 0.5rem

  .add-tab-button
    display: flex
    margin-left: auto

    @media $mobile
      width: 100%

    &.dark
      margin-top: 0.75rem

// needs to be toplevel so dragging clone can have its styles
.edit-tab-element
  padding: 1rem
  box-shadow: inset 0 0 0 0.0625rem $text-tertiary
  border-radius: $radius-m
  display: flex
  align-items: center
  background-color: $bg
  cursor: pointer

  &:hover
    background-color: $bg-secondary

  &.dark
    background-color: $bg-secondary-dark
    box-shadow: inset 0 0 0 0.0625rem $bg-tertiary-dark

  .icon
    flex-shrink: 0

    &:first-child
      margin-right: 1rem
      cursor: move

    &:last-child
      margin-right: 0

  span
    margin-right: auto
    text-overflow: ellipsis
    white-space: nowrap
    overflow: hidden

  &.being-dragged
    opacity: 0.25

</style>
