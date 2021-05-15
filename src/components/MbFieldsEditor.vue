<template lang="html">
  <div class="fields-editor" :class="{ dark, 'in-split': inSplit }">
    <template v-for="field in visibleFields" :key="field.key">
      <component
        v-model="model[field.key]"
        v-model:error="errors[field.key]"
        :display-field="field.displayField"
        :is="componentForType(field.type)"
        :label="field.label"
        :localised="field.localised"
        :options="field.options"
        :validation="field.validation"
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
  return components;
}, {});

export default {
  components,
  computed: {
    visibleFields() {
      const currentUser = this.$store.getters.userInCurrentProject || {};

      return this.fields.filter((field) => (
        !field.hidden
        && (!field.limitToRoles || field.limitToRoles.find((role) => role.value === currentUser.role))
        && (!field.showByValue || !field.showByValue.field || this.fieldShouldBeVisible(field.showByValue))
      ));
    },
  },
  created() {
    this.externalChange = true;
    this.model = _cloneDeep(this.modelValue);
  },
  data() {
    return {
      errors: {},
      externalChange: false,
      internalChange: false,
      model: {},
    };
  },
  methods: {
    componentForType(type) {
      return fieldTypeToComponent(type);
    },
    fieldShouldBeVisible({ comparator, field, value }) { // field is actually a path to a field in the Schema, comparator is a number or string to compare the field value to
      const valueToCompare = _get(this.model, field);
      // value can be either null, true, false, or a string
      if (typeof value !== 'string') return valueToCompare === value;
      // if it’s a string things get a little more complex
      switch (value) {
        case 'matches':
          return userInputToRegex(comparator).test(valueToCompare);
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
    updateModelValue() {
      this.internalChange = true;
      this.$emit('update:modelValue', _cloneDeep(this.model));
    },
  },
  name: 'MbFieldsEditor',
  props: {
    dark: Boolean,
    fields: Array,
    inSplit: Boolean,
    modelValue: Object,
  },
  watch: {
    model: {
      deep: true,
      handler() {
        if (this.externalChange) {
          this.externalChange = false;
          return;
        }

        this.updateModelValue();
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
        this.model = _cloneDeep(nv);
      },
    },
  },
};
</script>

<style lang="stylus" scoped>
</style>
