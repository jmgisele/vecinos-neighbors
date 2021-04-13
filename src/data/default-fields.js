/*

interface Field {
  type: String!,
  icon: String,
  name: String!,
  options: {
    default: Any,
    group: String,
    localised: Boolean,
    validation: { required: Boolean },
    visibility: { limitToGroups: Array, showByValue: { field: String, value: Any } },
    // + field specific options
  },
  tab: String,
  value: Any,
},

*/

export default [
  {
    type: 'id',
    icon: 'hashtag',
    name: '',
    options: {
      default: null,
      group: 'basic',
      localised: false,
      validation: { required: false },
      visibility: { limitToGroups: [], showByValue: { field: null, value: null } },
      // + field specific options
    },
    tab: null,
    value: null,
  },
  {
    type: 'languages',
    icon: 'language',
    name: '',
    options: {
      default: null,
      group: 'basic',
      localised: false,
      validation: { required: false },
      visibility: { limitToGroups: [], showByValue: { field: null, value: null } },
    },
    tab: null,
    value: null,
  },
];
