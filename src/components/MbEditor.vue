<template lang="html">
  <div class="editor" :class="{ dark, disabled }">
    <div v-if="outputFormat !== 'text'" class="toolbar" :class="{ dark }">
      <MbToggle v-model="raw" :dark="dark">Show Raw</MbToggle>
    </div>
    <label class="content-wrapper" :class="{ dark, disabled, dirty: error || value || placeholder, error: error || maxLen && overlength, raw }">
      <span v-if="displayLabel" class="label" :class="{ right: !label && maxLen }">{{displayLabel}}</span>
      <div v-if="outputFormat === 'text' || raw" class="autogrow-area" ref="autogrow">
        <pre ref="pre"></pre>
        <textarea autocomplete="off" :disabled="disabled" :placeholder="placeholder" ref="textarea" :value="value" @input="$emit('input', $event.target.value)"></textarea>
      </div>
      <div v-show="!raw && outputFormat !== 'text'" class="editor-wrapper" @focusin="focussed = true" @focusout="focussed = false" />
    </label>
  </div>
</template>

<script>
import Quill from 'quill';

import htmlToMarkdown from '@/mixins/htmlToMarkdown';
import markdownToHtml from '@/mixins/markdownToHtml';

export default {
  computed: {
    displayLabel() {
      if (this.error) return this.error;
      if (this.maxLen && (this.error || this.value || this.placeholder)) {
        if (this.label) return `${this.label} (${this.outputFormat === 'text' ? this.value.length : this.contentLength}/${this.maxLen})`;
        return `(${this.outputFormat === 'text' ? this.value.length : this.contentLength}/${this.maxLen})`;
      }
      if (this.label) return this.label;
      return false;
    },
    overlength() {
      if (this.outputFormat === 'text') return this.value.length > this.maxLen;
      return this.contentLength > this.maxLen;
    },
  },
  data() {
    return {
      contentLength: 0,
      focussed: false,
      quill: null,
      raw: false,
    };
  },
  methods: {
    htmlToDelta(html) {
      // turn br into custom linebreak, remove paragraphs around images (inserted by markdown it)
      const cleanHtml = html.replace(/<br>/g, '</p><p class="linebreak-true">').replace(/<p>\s*(<img .*>)\s*<\/p>/g, '$1').replace(/\n/g, '');

      const delta = this.quill.clipboard.convert(cleanHtml);

      return delta;
    },
    markdownToDelta(md) {
      // turn br into custom linebreak, remove paragraphs around images (inserted by markdown it)
      const html = markdownToHtml(md).replace(/<br>/g, '</p><p class="linebreak-true">').replace(/<p>\s*(<img .*>)\s*<\/p>/g, '$1').replace(/\n/g, '');

      const delta = this.quill.clipboard.convert(html);

      return delta;
    },
    onTextChange() {
      const htmlContent = this.quill.root.innerHTML.replace(/<p><br><\/p>/g, '<p></p>');
      this.contentLength = this.quill.getText().length;

      if (this.outputFormat === 'markdown') {
        const md = htmlToMarkdown(htmlContent);
        console.log(md);
        this.$emit('input', md);
      } else if (this.outputFormat === 'html') {
        this.$emit('input', markdownToHtml(htmlToMarkdown(htmlContent)));
        // this.$emit('input', htmlContent); // simple no cleanup, better performance
      }
    },
    recalculateHeight(value) {
      this.$refs.pre.innerText = value;
      this.$refs.pre.appendChild(document.createElement('BR'));
      this.$refs.autogrow.style.height = `${this.$refs.pre.offsetHeight}px`;
    },
    setUpQuill() {
      const editorElement = this.$el.querySelector('.editor-wrapper');
      const scrollingContainer = this.scrollingContainer ? document.querySelector(this.scrollingContainer) || this.$el : this.$el;

      this.quill = new Quill(editorElement, {
        formats: this.formats,
        modules: {
          clipboard: {
            matchVisual: false,
            // matchers: [
            //   ['h3', this.handleHeadingPaste],
            //   ['h4', this.handleHeadingPaste],
            //   ['h5', this.handleHeadingPaste],
            //   ['h6', this.handleHeadingPaste],
            //   ['p', this.handleParagraphPaste],
            //   ['.changed-true', this.handleChangePaste],
            //   ['.deleted-true', this.handleChangePaste],
            //   ['.inserted-true', this.handleChangePaste],
            //   [Node.TEXT_NODE, this.handleTextPaste],
            // ],
          },
          history: {
            userOnly: true,
          },
          keyboard: {
            // bindings: this.keybindings,
          },
        },
        placeholder: this.placeholder,
        readOnly: this.disabled,
        scrollingContainer,
      });

      this.quill.on('text-change', this.onTextChange);
    },
  },
  mounted() {
    if (this.outputFormat === 'text') this.recalculateHeight(this.value);
    else {
      this.$nextTick();
      this.setUpQuill();
      if (this.value) {
        // if (this.outputFormat === 'markdown') this.quill.setContents(this.markdownToDelta(this.value));
        this.quill.setContents(this.htmlToDelta(this.value));
      }
    }
  },
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
    maxLen: Number,
    outputFormat: {
      type: String,
      default: 'text',
      validator: (v) => ['text', 'markdown', 'html'].includes(v),
    },
    placeholder: String,
    scrollingContainer: String,
    value: String,
  },
  watch: {
    raw(nv) {
      if (nv) this.$nextTick(() => this.recalculateHeight(this.value));
    },
    value(newValue) {
      if (this.outputFormat === 'text' || this.raw) this.recalculateHeight(newValue);
      if (this.outputFormat === 'html' && !this.focussed) {
        this.quill.setContents(this.htmlToDelta(newValue), 'silent');
        this.contentLength = this.quill.getText().length;
      }
      if (this.outputFormat === 'markdown' && !this.focussed) {
        this.quill.setContents(this.markdownToDelta(newValue), 'silent');
        this.contentLength = this.quill.getText().length;
      }
    },
  },
};
</script>

<style lang="stylus">
@require '../assets/styles/colors'
@require '../assets/styles/corners'
@require '../assets/styles/quill-core'

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
