import { cloneDeep as _cloneDeep } from 'lodash-es';

import { validateField } from '../assets/js/validateContent';

export default {
  computed: {
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
        if (this.modelValue && typeof this.modelValue === 'object') this.$emit('update:modelValue', { ...this.modelValue, [lang]: newValue });
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
};
