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
    handleInput(newValue) {
      const error = this.validate(newValue);
      if (error || this.error) this.$emit('update:error', error);
      this.$emit('update:modelValue', newValue);
    },
    validate(value) { // very basic validation, most fields will probably override this
      if (!this.validation) return '';

      let error = '';

      if (this.validation.required && !value) error = 'This field is required';
      return error;
    },
    validateLocalisedValues() {
      if (!this.validation) return '';

      const errors = {};
      let hasErrors = false;
      this.languages.forEach((lang) => {
        const error = this.validate((this.modelValue && this.modelValue[lang]));
        if (error) {
          hasErrors = true;
          errors[lang] = error;
        }
      });
      if (hasErrors) return errors;
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
    validation: Object,
  },
};
