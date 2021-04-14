/*

interface Field {
  type: String!,
  default: Any,
  description: String,
  group: String,
  icon: String,
  key: String!,
  label: String!,
  localised: Boolean,
  options: [
    {
      component: String!,
      key: String!,
      props: Object,
      slot: String,
      value: Any,
    },
  ],
  tab: String,
  validation: { max: Number, min: Number, regex: String, required: Boolean },
  value: Any,
  visibility: { hidden: false, limitToGroups: Array, showByValue: { field: String, value: Any } },
  visualOnly: Boolean!, // excluded from content files, serves purely visual function
},

*/

export default [
  {
    type: 'id',
    default: null,
    description: 'Adds a unique ID to the content',
    group: 'basic',
    icon: 'hashtag',
    key: '',
    label: 'Unique ID',
    options: [
      {
        component: 'MbRadioGroup',
        key: 'type',
        props: { inline: true, options: [{ label: 'Filepath', value: 'filepath' }, { label: 'Generated UUID', value: 'uuid' }] },
        value: 'filepath',
      },
      {
        component: 'MbToggle',
        key: 'editable',
        slot: 'Make editable',
        value: false,
      },
    ],
    tab: null,
    validation: { required: true },
    value: null,
    visibility: { hidden: false, limitToGroups: [], showByValue: { field: null, value: null } },
  },
  {
    type: 'languages',
    default: null,
    description: 'Allows selecting which languages the content will be available in',
    group: 'basic',
    icon: 'language',
    key: '',
    label: 'Content Languages',
    tab: null,
    validation: { min: 1 },
    value: null,
    visibility: { hidden: false, limitToGroups: [], showByValue: { field: null, value: null } },
  },
];
