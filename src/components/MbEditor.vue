<template lang="html">
  <div class="editor" :class="{ dark, disabled }">
    <div v-if="outputFormat !== 'text'" class="toolbar" :class="{ dark }">
      <MbToggle v-model="raw" :dark="dark">Show Raw</MbToggle>
    </div>
    <label class="content-wrapper" :class="{ dark, disabled, dirty: error || modelValue || placeholder, error: error || maxLen && overlength, raw }">
      <span v-if="displayLabel" class="label" :class="{ right: !label && maxLen }">{{displayLabel}}</span>
      <div v-if="outputFormat === 'text' || raw" class="autogrow-area" ref="autogrow">
        <pre ref="pre"></pre>
        <textarea autocomplete="off" :disabled="disabled" :placeholder="placeholder" ref="textarea" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"></textarea>
      </div>
    </label>
  </div>
</template>

<script>
export default {
  computed: {
    displayLabel() {
      if (this.error) return this.error;
      if (this.maxLen && (this.error || this.modelValue || this.placeholder)) {
        if (this.label) return `${this.label} (${this.outputFormat === 'text' ? this.modelValue.length : this.contentLength}/${this.maxLen})`;
        return `(${this.outputFormat === 'text' ? this.modelValue.length : this.contentLength}/${this.maxLen})`;
      }
      if (this.label) return this.label;
      return false;
    },
    overlength() {
      if (this.outputFormat === 'text') return this.modelValue.length > this.maxLen;
      return this.contentLength > this.maxLen;
    },
  },
  data() {
    return {
      contentLength: 0,
      focussed: false,
      raw: false,
    };
  },
  emits: ['update:modelValue'],
  methods: {
    recalculateHeight(modelValue) {
      this.$refs.pre.innerText = modelValue;
      this.$refs.pre.appendChild(document.createElement('BR'));
      this.$refs.autogrow.style.height = `${this.$refs.pre.offsetHeight}px`;
    },
  },
  mounted() {
    if (this.outputFormat === 'text') this.recalculateHeight(this.modelValue);
  },
  props: {
    dark: Boolean,
    disabled: Boolean,
    error: String,
    formats: {
      type: Array,
    },
    label: String,
    maxLen: Number,
    outputFormat: {
      type: String,
      default: 'text',
      validator: (v) => ['text', 'markdown', 'html'].includes(v),
    },
    placeholder: String,
    scrollingContainer: String,
    modelValue: String,
  },
  watch: {
    raw(nv) {
      if (nv) this.$nextTick(() => this.recalculateHeight(this.modelValue));
    },
    modelValue(newValue) {
      if (this.outputFormat === 'text' || this.raw) this.recalculateHeight(newValue);
    },
  },
};
</script>

<style lang="stylus">
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.editor

  .toolbar
    padding: 0.5rem
    background-color: $bg-secondary
    border-radius: $radius-m
    position: sticky
    top: 0
    z-index: 1

    &.dark
      background-color: $bg-secondary-dark

  .content-wrapper
    display: block
    background-color: $bg-secondary
    border-radius: $radius-m
    padding: 1rem
    position: relative
    cursor: text
    margin-top: 1.5rem
    border: 1px solid transparent
    transition: box-shadow 200ms ease

    &.raw
      .autogrow-area
        font-family: monospace

    &.dark
      background-color: $bg-secondary-dark

      .label
        color: $text-secondary-dark

      .editor-wrapper .ql-editor
        &.ql-blank::before
          color: $text-secondary-dark

        pre
          background-color: $bg-tertiary-dark

      .autogrow-area textarea
        &::placeholder
          color: $text-secondary-dark

    &.error
      color: $negative-saturated
      box-shadow: inset 0 0 0 2px $negative

      &:focus-within
        color: inherit

      .label
        color: $negative-saturated

    &.disabled
      pointer-events: none
      background-color: transparent
      border-style: dashed
      border-color: $text-tertiary
      color: $text-tertiary
      box-shadow: none

      &.dark
        border-color: $text-tertiary-dark
        color: $text-tertiary-dark

      .label
        color: inherit

      .autogrow-area textarea::placeholder
        color: inherit

    &:focus-within
      box-shadow: inset 0 0 0 2px $accent

    &:focus-within,
    &.dirty
      .label
        transform: translate((-1rem + $radius-m), calc(-100% - 1.25rem)) scale(0.75)
        width: 'calc(125% + 1rem - %s)' % (2 * $radius-m) // it’s scaled down by 0.75 and we can’t use stylus expressions in calc

    .label
      display: block
      cursor: text
      user-select: none
      color: $text-secondary
      transform-origin: bottom left
      position: absolute
      white-space: nowrap
      width: calc(100% - 2rem)
      overflow: hidden
      text-overflow: ellipsis
      transition: transform 200ms ease

      &.right
        text-align: right

    .editor-wrapper .ql-editor
      &.ql-blank::before
        color: $text-secondary

    .autogrow-area
      position: relative
      width: 100%

      pre,
      textarea
        vertical-align: top
        margin: 0
        padding: 0
        outline: 0
        border: 0
        font-family: inherit
        font-size: inherit
        font-weight: inherit
        letter-spacing: inherit
        color: inherit
        background-color: transparent
        resize: none
        white-space: pre-wrap
        word-wrap: break-word
        line-height: inherit
        overflow: hidden
        text-align: inherit

      textarea
        width: 100%
        height: 100%
        resize: none

        &::placeholder
          color: $text-secondary
          opacity: 1
          user-select: none

      pre
        position: absolute
        top: 0px
        left: @top
        right: @top
        visibility: hidden
</style>
