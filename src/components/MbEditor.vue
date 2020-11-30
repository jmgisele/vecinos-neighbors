<template lang="html">
  <div class="editor" :class="{ dark, disabled }">
    <div v-if="outputFormat !== 'text'" class="toolbar" :class="{ dark }">
      <MbScroller>
        <div class="scroll-wrapper">
          <MbButton v-if="formats.block" class="paragraph-type" :dark="dark" :disabled="disabled || raw" icon="chevron-down" :icon-first="false" :tooltip="{ message: 'Todo: Paragraph type', position: 'top'}">{{activeParagraphType}}</MbButton>
          <MbButton v-for="action in toolbarActions" :dark="dark" :disabled="disabled || raw" :icon="action.icon" :key="action.name" :type="activeMarks.includes(action.name) ? 'primary' : null" :tooltip="{ message: action.tooltip, position: 'top' }" @click="action.action" />
          <MbButton v-show="raw" :dark="dark" :disabled="disabled && raw" icon="text" :tooltip="{ message: 'Clean up code', position: 'top' }" @click="prettifyCode" />
          <MbToggle v-if="allowRaw" v-model="raw" :dark="dark" :disabled="disabled" :icons="['text-alt', 'code']" tooltip="Toggle raw editing mode" />
        </div>
      </MbScroller>
    </div>
    <label class="content-wrapper" :class="{ dark, disabled, dirty: error || modelValue || placeholder, error: error || maxLen && overlength, raw, rich: outputFormat !== 'text' }" @click="outputFormat !== 'text' && !raw && !editorView.hasFocus() ? editorView.focus() : null">
      <span v-if="displayLabel" class="label" :class="{ right: !label && maxLen }">{{displayLabel}}</span>
      <div v-if="outputFormat === 'text' || raw" class="autogrow-area" ref="autogrow">
        <pre ref="pre"></pre>
        <textarea autocomplete="off" :disabled="disabled" :placeholder="placeholder" ref="textarea" :value="cleanValue" @input="handleTextareaInput" @[preventEnter].enter.prevent></textarea>
      </div>
      <template v-else>
        <div class="editor-wrapper" ref="editor" />
        <div v-if="placeholder && showPlaceholder" class="placeholder" :class="[ placeholderFormatting ]">{{placeholder}}</div>
        <div v-show="caretVisible" class="fake-caret" :style="{ height: caretHeight, transform: caretTransform }" />
      </template>
    </label>
  </div>
</template>

<script>
import { baseKeymap, toggleMark } from 'prosemirror-commands';
import { DOMParser, DOMSerializer } from 'prosemirror-model';
import { dropCursor } from 'prosemirror-dropcursor';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { gapCursor } from 'prosemirror-gapcursor';
import { history } from 'prosemirror-history';
import { inputRules } from 'prosemirror-inputrules';
import { isEqual, debounce } from 'lodash-es';
import { keymap } from 'prosemirror-keymap';

import generateInputRules from '../assets/js/generateInputRules';
import generateKeymap from '../assets/js/generateKeymap';
import generateSchema from '../assets/js/generateSchema';
import formatHTML from '../assets/js/formatHTML';

export default {
  beforeUnmount() {
    if (this.outputFormat !== 'text' && !this.raw) this.destroyProseMirror();
  },
  computed: {
    cleanValue() {
      if (this.allowNewLines) return this.modelValue;
      return this.modelValue.replace(/\n+/g, ' ');
    },
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
    placeholderFormatting() {
      if (this.activeParagraphType.startsWith('heading')) {
        const level = this.activeParagraphType.slice(-1);
        return `h${level}`;
      }
      if (this.activeParagraphType === 'codeBlock') return 'code';
      return '';
    },
    preventEnter() {
      if (this.allowNewLines) return null;
      return 'keydown';
    },
  },
  data() {
    return {
      activeMarks: [],
      activeParagraphType: 'Paragraph',
      caretHeight: '',
      caretTransform: '',
      caretVisible: false,
      contentLength: 0,
      focussed: false,
      raw: false,
      renderDiv: null,
      showPlaceholder: true,
      toolbarActions: [],
    };
  },
  emits: ['update:modelValue'],
  methods: {
    destroyProseMirror() {
      this.editorView.destroy();
      this.editorView = null;
      this.editorState = null;
    },
    generateActions(schema) {
      if (this.outputFormat === 'text') return [];
      const actions = [];
      const mac = typeof navigator !== 'undefined' ? /Mac/.test(navigator.platform) : false;
      let type;

      /* eslint-disable no-cond-assign */
      // Reason: it’s very convenient to check if a type exists in a schema this way
      if (type = schema.marks.strong) {
        const strong = type;
        actions.push({
          action: () => this.setMark(strong),
          name: 'strong',
          icon: 'bold',
          tooltip: `Toggle bold <kbd>${mac ? '⌘' : 'Ctrl'}</kbd>+<kbd>B</kbd>`,
        });
      }
      if (type = schema.marks.em) {
        const em = type;
        actions.push({
          action: () => this.setMark(em),
          name: 'em',
          icon: 'italic',
          tooltip: `Toggle italics <kbd>${mac ? '⌘' : 'Ctrl'}</kbd>+<kbd>I</kbd>`,
        });
      }
      if (type = schema.marks.strike) {
        const strike = type;
        actions.push({
          action: () => this.setMark(strike),
          name: 'strike',
          icon: 'strikethrough',
          tooltip: `Toggle strikethrough <kbd>${mac ? '⌘' : 'Ctrl'}</kbd>+<kbd>S</kbd>`,
        });
      }
      if (type = schema.marks.code) {
        const code = type;
        actions.push({
          action: () => this.setMark(code),
          name: 'code',
          icon: 'inline-code',
          tooltip: `Toggle code font <kbd>${mac ? '⌘' : 'Ctrl'}</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd>`,
        });
      }
      if (type = schema.marks.link) {
        // const link = type;
        actions.push({
          action: this.openLinkModal,
          name: 'link',
          icon: 'link',
          tooltip: `Insert link <kbd>${mac ? '⌘' : 'Ctrl'}</kbd>+<kbd>K</kbd>`,
        });
      }
      /* eslint-enable no-cond-assign */

      return actions.filter((action) => action);
    },
    getContentString() {
      if (this.outputFormat === 'html') {
        if (!this.renderDiv) this.renderDiv = document.createElement('div');
        const htmlFragment = DOMSerializer.fromSchema(this.editorView.state.schema).serializeFragment(this.editorState.doc);
        this.renderDiv.appendChild(htmlFragment);
        const result = this.renderDiv.innerHTML;
        this.renderDiv.innerHTML = ''; // clean up the render div since it’s being reused
        // this.contentLength = this.editorState.doc.textContent.length; // less accurate, but probably more performant
        this.contentLength = this.editorState.doc.textBetween(0, this.editorState.doc.content.size, '\n').length;
        return result;
      }
      return this.modelValue; // if it’s text
    },
    handleSelectionChange(newSelection) {
      // Update fake caret
      if (newSelection.empty) {
        const selectionRect = this.editorView.coordsAtPos(newSelection.from, 1);
        const editorRect = this.$refs.editor.getBoundingClientRect();
        const caretHeight = selectionRect.bottom - selectionRect.top;

        this.caretVisible = true;
        if (caretHeight !== this.caretHeight) this.caretHeight = `${caretHeight}px`;
        this.caretTransform = `translate(${selectionRect.left - editorRect.left}px, ${selectionRect.top - editorRect.top}px)`;
      } else this.caretVisible = false;
      // Update active Marks
      if (newSelection.empty) {
        this.activeMarks = Object.keys(this.editorState.schema.marks).reduce((marks, name) => {
          const currentMark = this.editorState.schema.marks[name];
          if (currentMark.isInSet(this.editorState.storedMarks || newSelection.$from.marks())) marks.push(name);
          return marks;
        }, []);
      } else {
        this.activeMarks = Object.keys(this.editorState.schema.marks).reduce((marks, name) => {
          if (this.editorState.doc.rangeHasMark(newSelection.from, newSelection.to, this.editorState.schema.marks[name])) {
            marks.push(name);
          }
          return marks;
        }, []);
      }
      // Update active node type
      this.activeParagraphType = newSelection.node ? newSelection.node.type.name : newSelection.$from.parent.type.name;
    },
    handleTextareaInput(e) {
      let newValue = e.target.value;

      if (!this.allowNewLines) newValue = newValue.replace(/\n+/g, ' ');

      this.$emit('update:modelValue', newValue);
    },
    openLinkModal() {
      console.log('todo: add link modal');
      return true; // mark the event as handled
    },
    prettifyCode() {
      if (this.outputFormat !== 'html') return;
      this.$emit('update:modelValue', formatHTML(this.modelValue));
    },
    recalculateHeight(modelValue) {
      this.$refs.pre.innerText = modelValue;
      this.$refs.pre.appendChild(document.createElement('BR'));
      this.$refs.autogrow.style.height = `${this.$refs.pre.offsetHeight}px`;
    },
    reInitializeProseMirror() {
      let initialContent;
      const schema = generateSchema(this.formats, this.formatOptions);
      this.toolbarActions = this.generateActions(schema);
      if (this.outputFormat === 'html') {
        if (!this.renderDiv) this.renderDiv = document.createElement('div');
        if (this.formats.block) this.renderDiv.innerHTML = this.modelValue;
        else this.renderDiv.innerHTML = this.modelValue.replace(/<\/[^>]*>\s*<[^>]*>/g, ' ');
        initialContent = DOMParser.fromSchema(schema).parse(this.renderDiv);
        this.renderDiv.innerHTML = ''; // clean up the render div since it’s being reused
      }
      if (initialContent && initialContent.childCount > 0 && (initialContent.firstChild.content.size > 0 || !initialContent.firstChild.isTextblock)) this.showPlaceholder = false;
      const vm = this; // so we have a reference to the view-model
      vm.editorState = EditorState.create({ // doesn’t need to be reactive, is immutable
        doc: initialContent,
        plugins: [
          inputRules({ rules: generateInputRules(schema, vm.inputRuleOptions) }),
          dropCursor({ class: 'dropcursor', width: 2 }),
          gapCursor(),
          history(),
          keymap(generateKeymap(schema, vm)),
          keymap(baseKeymap),
        ],
        schema,
      });
      vm.editorView = new EditorView({ mount: vm.$refs.editor }, { // doesn’t need to be reactive, is immutable
        dispatchTransaction(transaction) {
          vm.editorState = vm.editorView.state.apply(transaction);
          vm.editorView.updateState(vm.editorState);
          if (transaction.docChanged) {
            if (transaction.doc.childCount > 0 && vm.showPlaceholder) vm.showPlaceholder = false;
            if (transaction.doc.childCount === 1 && transaction.doc.firstChild.content.size === 0 && transaction.doc.firstChild.isTextblock && !vm.showPlaceholder) vm.showPlaceholder = true;
            vm.debouncedUpdate();
          }
          vm.handleSelectionChange(vm.editorState.selection);
        },
        handleDOMEvents: {
          blur: () => { vm.caretVisible = false; },
          focus: (view) => { vm.handleSelectionChange(view.state.selection); },
        },
        scrollMargin: 128,
        scrollThreshold: 64,
        state: vm.editorState,
        transformPastedHTML(html) {
          if (vm.formats.block) return html;
          return html.replace(/<\/[^>]*>\s*<[^>]*>/g, ' '); // replaces ending and starting tags with a space
        },
        transformPastedText(text) {
          if (vm.formats.block) return text;
          return text.replace(/\n+/g, ' ');
        },
      });
    },
    setMark(type, attrs) {
      toggleMark(type, attrs)(this.editorState, this.editorView.dispatch);
      this.editorView.focus();
    },
    debouncedUpdate: debounce(function update() {
      this.$emit('update:modelValue', this.getContentString());
    }, 500),
  },
  mounted() {
    if (this.outputFormat === 'text') this.recalculateHeight(this.cleanValue);
    else this.reInitializeProseMirror();
  },
  props: {
    allowNewLines: {
      type: Boolean,
      default: true,
    },
    allowRaw: Boolean,
    dark: Boolean,
    disabled: Boolean,
    error: String,
    formatOptions: Object,
    formats: {
      type: Object,
      default: () => ({ block: ['blockquote', 'codeBlock', 'heading', 'hr', 'orderedList', 'unorderedList'], inline: ['br', 'code', 'em', 'link', 'strike', 'strong'] }),
    },
    inputRuleOptions: Object,
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
      if (nv) {
        this.destroyProseMirror();
        this.$nextTick(() => this.recalculateHeight(this.cleanValue));
      } else this.$nextTick(this.reInitializeProseMirror);
    },
    formats(nv, ov) {
      if (isEqual(nv, ov)) return; // for some reason these watchers fire after every $emit('update:modelValue'), so we avoid reinitialising if nothing changed
      this.destroyProseMirror();
      this.reInitializeProseMirror();
    },
    formatOptions(nv, ov) {
      if (isEqual(nv, ov)) return; // for some reason these watchers fire after every $emit('update:modelValue'), so we avoid reinitialising if nothing changed
      this.destroyProseMirror();
      this.reInitializeProseMirror();
    },
    modelValue(newValue) {
      if (this.outputFormat === 'text' || this.raw) {
        if (this.allowNewLines) this.recalculateHeight(newValue);
        else this.recalculateHeight(newValue.replace(/\n+/g, ' '));
      } else if (this.outputFormat === 'html' && !this.editorView.hasFocus()) {
        if (!this.renderDiv) this.renderDiv = document.createElement('div');
        if (this.formats.blocks) this.renderDiv.innerHTML = newValue;
        else this.renderDiv.innerHTML = newValue.replace(/<\/[^>]*>\s*<[^>]*>/g, ' '); // replaces ending and starting tags with a space so we don’t get characters sticking together
        const newContent = DOMParser.fromSchema(this.editorView.state.schema).parse(this.renderDiv);
        this.renderDiv.innerHTML = ''; // clean up the render div since it’s being reused
        // Create a new EditorState based on the settings of the one initially created
        this.editorState = EditorState.create({
          doc: newContent,
          plugins: this.editorView.state.plugins,
          schema: this.editorView.state.schema,
        });
        this.editorView.updateState(this.editorState);
        if (newValue && this.showPlaceholder) this.showPlaceholder = false;
        if (!newValue && !this.showPlaceholder) this.showPlaceholder = true;
      }
    },
  },
};
</script>

<style lang="stylus">
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.editor

  .toolbar
    background-color: $bg-tertiary
    border-radius: $radius-m
    border-bottom-left-radius: 0
    border-bottom-right-radius: 0
    margin-top: 1.5rem
    position: sticky
    top: 0.5rem
    overflow: hidden
    z-index: 1

    &.dark
      background-color: $bg-tertiary-dark

    .scroll-wrapper
      padding: 0.5rem
      display: flex

      &::after /* so the last item isn’t glued to the right */
        content: ''
        display: block
        width: 0.5rem
        flex-shrink: 0

      .button.paragraph-type
        border: none

      .button.icon
        padding: ((16 - 3) / 16)rem
        margin-right: 0.5rem

        &:not(.primary):hover
          background-color: $bg-secondary

          &.dark
            background-color: $bg-secondary-dark

      .toggle
        margin-left: auto

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

    &.rich
      border-top-left-radius: 0
      border-top-right-radius: 0
      margin-top: 0

    &.dark
      background-color: $bg-secondary-dark

      .label
        color: $text-secondary-dark

      .editor-wrapper.ProseMirror
        pre,
        code
          background-color: $bg-tertiary-dark

      .placeholder
        color: $text-secondary-dark

      .fake-caret
        background-color: currentColor

      .autogrow-area textarea
        caret-color: currentColor

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

      &.rich .label
        transform: translate((-1rem + $radius-m), calc(-6.5rem)) scale(0.75)

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

    .dropcursor
      background-color: $accent !important // to override the style-attribute
      border-radius: 1px

    .editor-wrapper.ProseMirror // adapted from prosemirror-view/style/prosemirror.css
      position: relative
      word-wrap: break-word
      white-space: pre-wrap
      white-space: break-spaces
      // font-variant-ligatures: none // ligatures were disabled because Chrome couldn’t select inbetween them, but it seems fixed now
      // font-feature-settings: "liga" 0; /* the above doesn't seem to work in Edge */
      caret-color: transparent

      &.ProseMirror-focused
        .ProseMirror-gapcursor
          display: block

      &.ProseMirror-hideselection
        caret-color: transparent

        *::selection
          background-color: transparent

      > :first-child,
      > :first-child :first-child
        margin-top: 0

      > :last-child,
      > :last-child > :last-child
        margin-bottom: 0

      .ProseMirror-gapcursor // adapted from prosemirror-gapcursor/style/gapcursor.css
        display: none
        pointer-events: none
        position: absolute

        &::after
          content: ""
          display: block
          position: absolute
          top: -0.125rem
          width: 1.5rem
          height: 0.125rem
          background-color: $accent
          border-radius: (1 / 16)rem
          animation: blink 1s ease infinite

      pre
        white-space: pre-wrap

        code
          background-color: transparent

      hr
        cursor: pointer
        background-color: $accent-secondary
        width: 30%

      code
        background-color: $bg

      li
        position: relative

        &.ProseMirror-selectednode
          outline: none

          &::after
            content: ''
            position: absolute
            left: -32px
            right: -2px; top: -2px; bottom: -2px
            border: 2px solid $accent
            pointer-events: none

      .ProseMirror-selectednode
        outline: 0.125rem solid $accent
        outline-offset: 0.25rem

        &::selection,
        ::selection
          color: inherit

    .editor-wrapper.ProseMirror-hideselection + .fake-caret
      display: none

    .placeholder
      color: $text-secondary
      pointer-events: none
      margin: 0
      position: absolute
      top: 1rem
      left: 1rem

      &.h1, &.h2, &.h3, &.h4, &.h5, &.h6
        font-weight: bold

      &.code
        font-family: monospace
        color: $text-secondary-dark
        top: 2rem
        left: 2rem

    .fake-caret
      width: 0.125rem
      min-height: 1em
      border-radius: (1 / 16)rem
      background-color: $accent
      position: absolute
      top: 1rem
      left: 1rem
      pointer-events: none
      transition: transform 100ms ease-out
      animation: blink 1s ease infinite

      @keyframes blink
        0%
          opacity: 0
        50%
          opacity: 1
        100%
          opacity: 0

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
        caret-color: $accent

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
