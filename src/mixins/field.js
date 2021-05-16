export default {
  emits: ['update:error', 'update:modelValue'],
  props: {
    children: Array,
    compact: Boolean,
    dark: Boolean,
    default: {}, // can be anything
    displayField: String,
    error: [String, Object], // will be an object if localised
    inSplit: Boolean,
    label: String,
    languages: Array,
    localised: Boolean,
    modelValue: {}, // can be anything
    options: Object,
    splitTarget: HTMLElement,
    validation: Object,
  },
};
