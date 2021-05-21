<template lang="html">
  <div class="fields-editor" :class="{ dark, 'in-split': inSplit }">
    <template v-for="field in visibleFields" :key="field.key">
      <component
        v-model="model[field.key]"
        :active="field.key === activeField"
        :children="field.value"
        :compact="compact"
        :dark="dark"
        :default="field.default"
        :display-field="field.displayField"
        :error="error.get(field.key)"
        :in-split="inSplit"
        :is="componentForType(field.type)"
        :label="field.label"
        :languages="languages"
        :localised="field.localised"
        :options="field.options"
        :split-target="splitTarget"
        :validation="field.validation"
        @update:active="$event ? activeField = field.key : activeField = null"
        @update:error="handleError(field.key, $event)"
      />
    </template>
  </div>
</template>

<script>
import { cloneDeep as _cloneDeep, get as _get } from 'lodash-es';

import fieldTypeToComponent from '../assets/js/fieldTypeToComponent';
import userInputToRegex from '../assets/js/userInputToRegex';

const requireComponent = require.context('./fields', false, /[A-Z]\w+\.(vue|js)$/);

const components = requireComponent.keys().reduce((acc, path) => {
  const componentConfig = requireComponent(path);
  const componentName = path.split('/').pop().replace(/\.\w+$/, '');
  acc[componentName] = componentConfig.default || componentConfig; // eslint-disable-line no-param-reassign
  return acc;
}, {});

export default {
  components,
  computed: {
    visibleFields() {
      if (!this.fields) return [];
      const currentUser = this.$store.getters.userInCurrentProject || {};

      return this.fields.filter((field) => (
        !field.visibility.hidden
        && (!field.type === 'languages' || (this.languages && this.languages.length > 0)) // showing languages fields when there are no languages or localisation is disabled doesn’t make sense
        && (!field.visibility.limitToRoles || field.visibility.limitToRoles.length === 0 || field.visibility.limitToRoles.find((role) => role.value === currentUser.role))
        && (!field.visibility.showByValue || !field.visibility.showByValue.field || this.fieldShouldBeVisible(field.visibility.showByValue))
      ));
    },
  },
  created() {
    this.externalChange = true;
    this.model = _cloneDeep(this.modelValue) || {};
  },
  data() {
    return {
      activeField: null,
      externalChange: false,
      internalChange: false,
      model: {},
    };
  },
  emits: ['update:error', 'update:modelValue', 'update:splitVisible'],
  methods: {
    componentForType(type) {
      const componentName = fieldTypeToComponent(type);

      if (componentName && this.$options.components && this.$options.components[componentName]) return componentName;
      return 'UnknownField';
    },
    fieldShouldBeVisible({ comparator, field, value }) { // field is actually a path to a field in the Schema, comparator is a number or string to compare the field value to
      const valueToCompare = _get(this.model, field);
      // value can be either null, true, false, or a string
      if (typeof value !== 'string') return valueToCompare === value;
      // if it’s a string things get a little more complex
      switch (value) {
        case 'matches':
          try {
            return userInputToRegex(comparator).test(valueToCompare);
          } catch (err) {
            return false; // if there’s an error, it’s because the supplied regex was invalid so we default to not showing the field
          }
        case 'equals':
          return valueToCompare === comparator;
        case 'smaller':
          return valueToCompare < comparator;
        case 'greater':
          return valueToCompare > comparator;
        default:
          return false;
      }
    },
    handleError(key, err) {
      const errorClone = _cloneDeep(this.error);
      if (err) errorClone.set(key, err);
      else errorClone.delete(key);
      this.$emit('update:error', errorClone);
    },
    updateModelValue() {
      this.internalChange = true;
      this.$emit('update:modelValue', _cloneDeep(this.model));
    },
  },
  name: 'MbFieldsEditor',
  props: {
    compact: Boolean,
    dark: Boolean,
    error: {
      type: Map,
      default: () => new Map(),
    },
    fields: Array,
    inSplit: Boolean,
    modelValue: Object,
    languages: Array,
    splitTarget: [String, HTMLElement],
    splitVisible: Boolean,
  },
  watch: {
    activeField(nv, ov) {
      if (!ov && nv && !this.splitVisible) this.$emit('update:splitVisible', true);
      else if (ov && !nv && this.splitVisible) this.$emit('update:splitVisible', false);
    },
    model: {
      deep: true,
      async handler() {
        if (this.externalChange) {
          this.externalChange = false;
          return;
        }

        await this.$nextTick(); // we wait a tick so this.error has the correct value before we check it (otherwise it would check an outdated value, causing invalid modelValue to be emitted)
        if (!this.error.size) this.updateModelValue();
      },
    },
    modelValue: {
      deep: true,
      handler(nv) {
        if (this.internalChange) {
          this.internalChange = false;
          return;
        }

        this.externalChange = true;
        this.model = _cloneDeep(nv) || {};
      },
    },
    splitVisible(nv) {
      if (!nv) this.activeField = null;
    },
  },
};
</script>

<style lang="stylus" scoped>
.fields-editor
  overflow: hidden

  .field
    &.text:not(.localised):first-child // so the label is still visible even when it’s floating
      margin-top: 2rem

    &:not(:last-child)
      margin-bottom: 2rem

    &:last-child
      margin-bottom: 0.125rem // so we can still see the active state while :active
</style>
