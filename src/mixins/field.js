export default {
  emits: ['update:error', 'update:modelValue'],
  props: {
    children: Array,
    compact: Boolean,
    dark: Boolean,
    default: {}, // can be anything
    displayField: String,
    error: String,
    inSplit: Boolean,
    label: String,
    languages: Array,
    localised: Boolean,
    modelValue: {}, // can be anything
    options: Object,
    validation: Object,
  },
};
