<template lang="html">
  <div class="editor">

  </div>
</template>

<script>
export default {
  props: {
    dark: Boolean,
    disabled: Boolean,
    error: String,
    formats: {
      type: Array,
      default: () => [
        'blockquote',
        'bold',
        'code',
        'code-block',
        'header',
        'image',
        'indent',
        'italic',
        'linebreak',
        'link',
        'list',
        'strike',
        'underline',
      ],
    },
    label: String,
    outputFormat: {
      type: String,
      default: 'text',
      validator: (v) => ['text', 'markdown', 'html'].includes(v),
    },
    placeholder: String,
    value: String,
  },
};
</script>

<style lang="stylus" scoped>
</style>
