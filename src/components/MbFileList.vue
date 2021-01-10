<template lang="html">
  <div class="file-list">

  </div>
</template>

<script>
export default {
  created() {
    this.sortBy = this.initialSortBy;
  },
  data() {
    return {
      sortBy: null,
      sortOptions: [
        {
          label: 'Name, asending',
          value: 'name+',
        },
        {
          label: 'Name, descending',
          value: 'name-',
        },
        {
          label: 'Last Edited, asending',
          value: 'edited+',
        },
        {
          label: 'Last Edited, descending',
          value: 'edited-',
        },
      ],
    };
  },
  props: {
    action: Object,
    dark: Boolean,
    fileActions: {
      type: Array,
      default: () => [],
    },
    filterable: {
      type: Boolean,
      default: true,
    },
    foldersFirst: {
      type: Boolean,
      default: true,
    },
    foldersOnly: Boolean,
    initialSortBy: {
      type: String,
      default: 'name+',
    },
    root: {
      type: String,
      default: '/',
    },
    showHidden: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
</style>
