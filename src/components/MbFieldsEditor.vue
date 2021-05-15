<template lang="html">
  <div class="fields-editor" :class="{ dark, 'in-split': inSplit }">
    <template v-for="field in visibleFields" :key="field.key">
      <component
        v-model="model[field.key]"
        :children="field.value"
        :compact="compact"
        :dark="dark"
        :default="field.default"
        :display-field="field.displayField"
        :error="errors.get(field.key)"
        :in-split="inSplit"
        :is="componentForType(field.type)"
        :label="field.label"
        :languages="languages"
        :localised="field.localised"
        :options="field.options"
        :validation="field.validation"
        @update:error="$event ? errors.set(field.key, $event) : errors.delete(field.key)"
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
    languages() {
      const languagesField = this.fields.find((field) => field.type === 'languages');

      if (languagesField) return this.model[languagesField.key];
      return this.$store.state.currentProject.languages;
    },
    visibleFields() {
      const currentUser = this.$store.getters.userInCurrentProject || {};

      return this.fields.filter((field) => (
        !field.visibility.hidden
        && (!field.visibility.limitToRoles || field.visibility.limitToRoles.find((role) => role.value === currentUser.role))
        && (!field.visibility.showByValue || !field.visibility.showByValue.field || this.fieldShouldBeVisible(field.visibility.showByValue))
      ));
    },
  },
  created() {
    this.externalChange = true;
    this.model = _cloneDeep(this.modelValue);
  },
  data() {
    return {
      errors: new Map(),
      externalChange: false,
      internalChange: false,
      model: {},
    };
  },
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
    updateModelValue() {
      this.internalChange = true;
      this.$emit('update:modelValue', _cloneDeep(this.model));
    },
  },
  name: 'MbFieldsEditor',
  props: {
    dark: Boolean,
    compact: Boolean,
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

        if (!this.errors.size) this.updateModelValue();
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
.fields-editor
  .field:not(:last-child)
    margin-bottom: 2rem
</style>
