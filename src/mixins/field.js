import { cloneDeep as _cloneDeep } from 'lodash-es';

import { validateField } from '../assets/js/validateContent';

export default {
  computed: {
    firstLocalisedValue() {
      if (this.modelValue && typeof this.modelValue !== 'object') return this.modelValue;
      if (this.modelValue) {
        return Object.values(this.modelValue).find((value) => value) || null;
      }
      return null;
    },
    showLocalisedOptions() {
      return this.localised && this.languages && this.languages.length > 0;
    },
    teleportTarget() {
      if (!this.inSplit && this.splitTarget) return this.splitTarget;
      return null;
    },
  },
  emits: ['update:active', 'update:error', 'update:modelValue'],
  methods: {
    convertLocalisedValue(localised) {
      if (localised) {
        return this.languages.reduce((acc, lang, index) => {
          if (index === 0 && this.modelValue) acc[lang] = this.modelValue;
          else acc[lang] = null;
          return acc;
        }, {});
      }
      return Object.values(this.modelValue)[0] || null;
    },
    handleInput(newValue, lang) {
      const error = this.validate(newValue);

      if (!lang) {
        if (error || this.error) this.$emit('update:error', error);
        this.$emit('update:modelValue', newValue);
      } else {
        if (error || (this.error && this.error.get(lang))) {
          const errorClone = _cloneDeep(this.error) || new Map();
          if (error) errorClone.set(lang, error);
          else if (!error && this.error.get(lang)) errorClone.delete(lang);
          if (errorClone.size > 0) this.$emit('update:error', errorClone);
          else this.$emit('update:error', '');
        }
        if (this.modelValue && typeof this.modelValue === 'object' && !Array.isArray(this.modelValue)) this.$emit('update:modelValue', { ...this.modelValue, [lang]: newValue });
        else if (this.modelValue && lang !== this.languages[0]) this.$emit('update:modelValue', { [this.languages[0]]: this.modelValue, [lang]: newValue });
        else this.$emit('update:modelValue', { [lang]: newValue });
      }
    },
    validate(value) {
      return validateField(value, this.type, this.validation);
    },
    validateLocalisedValues(values, defaultValue) {
      if (!this.validation) return '';

      const errors = new Map();
      this.languages.forEach((lang) => {
        const error = this.validate((values && values[lang]) || defaultValue);
        if (error) errors.set(lang, error);
      });
      if (errors.size > 0) return errors;
      return '';
    },
  },
  props: {
    active: Boolean,
    children: Array,
    compact: Boolean,
    dark: Boolean,
    default: {}, // can be anything
    displayField: String,
    error: [String, Map], // will be a Map if localised / has subfields
    fieldKey: String,
    inSplit: Boolean,
    label: String,
    languages: Array,
    localised: Boolean,
    modelValue: {}, // can be anything
    options: {
      type: Object,
      default: () => ({}),
    },
    splitTarget: [String, HTMLElement],
    type: String,
    validation: Object,
  },
  watch: {
    showLocalisedOptions(nv) {
      let newValue;
      if (nv) {
        if (this.modelValue !== null && (!this.modelValue || Array.isArray(this.modelValue) || typeof this.modelValue !== 'object')) newValue = this.convertLocalisedValue(true);
        this.$emit('update:error', this.validateLocalisedValues(newValue || this.modelValue, ''));
      } else {
        if (this.modelValue && !Array.isArray(this.modelValue) && typeof this.modelValue === 'object') newValue = this.convertLocalisedValue(false);
        const error = this.validate(newValue || this.modelValue);
        if (error || this.error) this.$emit('update:error', error); // we only emit if we have an error set or the value is invalid
      }

      if (typeof newValue !== 'undefined') this.$emit('update:modelValue', newValue);
    },
  },
};
