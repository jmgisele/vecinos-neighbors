<template lang="html">
  <div class="tag-input" :class="{dark, error: error || (max && modelValue.length > max), }" @click="$refs.input.focus()" @focusin="handleFocusIn" @focusout="handleFocusOut">
    <span v-if="displayLabel" class="label" :class="{ right: !label && max }">{{displayLabel}}</span>
    <transition-group class="tags-wrapper" tag="div" @before-leave="setGridPosition">
      <div v-for="(tag, index) in modelValue" class="tag" :class="{ overflow: max && index + 1 > max }" :key="tag[autocompleteProperty] || tag">
        <MbIcon icon="drag-handle" />
        <span>{{tag[autocompleteProperty] || tag}}</span>
        <MbButton :dark="dark" icon="cross" @click="removeTag(index)" />
      </div>
      <div class="autogrow-input" key="autogrowInput">
        <span v-show="topSuggestion" class="top-suggestion">{{topSuggestion}}</span>
        <input autocapitalize="off" autocomplete="off" :placeholder="placeholder" ref="input" type="text" :value="newTag" @input="handleInput" @keydown="handleAcceptOrDelete" @keyup="handleMobileComma" @paste="handlePaste">
        <span class="spacer" ref="spacer">{{placeholder}}</span>
      </div>
    </transition-group>
  </div>
</template>

<script>
export default {
  beforeUnmount() {
    window.removeEventListener('scroll', this.hideSuggestions, { passive: true, capture: true });
  },
  computed: {
    displayLabel() {
      if (this.error) return this.error;
      if (this.max && (this.error || this.modelValue.length > 0 || this.placeholder)) {
        if (this.label) return `${this.label} (${this.modelValue.length}/${this.max})`;
        return `(${this.modelValue.length}/${this.max})`;
      }
      if (this.label) return this.label;
      return false;
    },
    filteredSuggestions() {
      return this.suggestions.filter((suggestion) => !this.modelValue.find((existingSuggestion) => {
        if (this.autocompleteProperty) return existingSuggestion[this.autocompleteProperty] === suggestion[this.autocompleteProperty];
        return existingSuggestion === suggestion;
      }));
    },
    ownTags() {
      return this.modelValue && this.modelValue.slice(0);
    },
    topSuggestion() {
      if (
        this.autocompleteModel
        && this.autocompleteProperty
        && this.filteredSuggestions.length > 0
        && this.filteredSuggestions[0][this.autocompleteProperty].startsWith(this.newTag)
      ) return this.filteredSuggestions[0][this.autocompleteProperty];
      return null;
    },
  },
  data() {
    return {
      error: '',
      newTag: '',
      suggestions: [],
    };
  },
  emits: ['blur', 'focus', 'update:modelValue'],
  methods: {
    addTag(tag) {
      const cleanTag = typeof tag === 'string' ? tag.trim() : tag;
      const elementExists = this.ownTags.findIndex((element) => {
        if (this.autocompleteProperty && element[this.autocompleteProperty]) return element[this.autocompleteProperty] === cleanTag[this.autocompleteProperty];
        return element === cleanTag;
      }) >= 0;

      if (cleanTag && !elementExists) {
        this.ownTags.push(cleanTag);
        this.$emit('update:modelValue', this.ownTags);
        this.$refs.input.focus();
      }
      this.newTag = '';
      this.$refs.spacer.innerText = this.placeholder;
      if (this.suggestions.length > 0) this.hideSuggestions();
    },
    fetchSuggestions() {
      if (!this.autocompleteModel || !this.autocompleteProperty) return;

      const seen = []; // to deduplicate
      this.suggestions = this.autocompleteModel.filter((el) => {
        const prop = el[this.autocompleteProperty];
        if (!prop || seen.includes(prop)) return false;
        seen.push(prop);
        return prop.toLowerCase().includes(this.newTag.toLowerCase());
      });
    },
    handleAcceptOrDelete(e) {
      if (e.key === ',') e.preventDefault();
      if (this.newTag.length > 0) {
        if (e.key === 'Enter' || e.key === ',') {
          let tag;
          if (this.filteredSuggestions.length > 0) [tag] = this.filteredSuggestions;
          else if (!this.autocompleteModel || this.allowUnsuggested) tag = this.newTag;

          if (tag) this.addTag(tag);
          else this.error = `${this.newTag} is not an allowed value`;
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        this.ownTags.pop();
        this.$emit('update:modelValue', this.ownTags);
      }
    },
    handleFocusIn() {
      window.addEventListener('scroll', this.hideSuggestions, { passive: true, capture: true });
      this.$emit('focus');
    },
    handleFocusOut(e) {
      if (!e.relatedTarget || !this.$el.contains(e.relatedTarget)) {
        this.validate();
        window.removeEventListener('scroll', this.hideSuggestions, { passive: true, capture: true });
        this.$emit('blur');
      }
    },
    handleInput(e) {
      this.newTag = e.target.value;
      this.error = '';
      if (this.$refs.input.value) this.$refs.spacer.innerText = this.$refs.input.value; // to fix the jitter I can’t use {{newTag}} in the <span>
      else this.$refs.spacer.innerText = this.placeholder;

      if (this.newTag.length > 3) {
        this.fetchSuggestions();
      } else if (this.suggestions.length > 0) this.hideSuggestions();
    },
    handleMobileComma(e) { // e.key doesn’t work on android chrome, so we have to resort to drastic measures
      if (typeof e.key === 'undefined' || e.key === 'Unidentified') {
        const currentPosition = e.target.selectionStart;

        if (currentPosition > 0 && this.newTag.charAt(currentPosition - 1) === ',') {
          const [newTag, ...rest] = this.newTag.split(',');
          let tag;
          if (this.filteredSuggestions.length > 0) [tag] = this.filteredSuggestions;
          else if (!this.autocompleteModel || this.allowUnsuggested) tag = newTag;

          if (tag) {
            this.addTag(tag);
            this.newTag = rest.join('');
          } else {
            this.error = `${this.newTag} is not an allowed value`;
            this.newTag = `${newTag} ${rest.join(' ')}`;
          }

          if (this.newTag) this.$refs.spacer.innerText = this.newTag;
          else this.$refs.spacer.innerText = this.placeholder;
        }
      }
    },
    handlePaste(e) {
      if (this.autocompleteModel && !this.allowUnsuggested) return;
      const paste = (e.clipboardData || window.clipboardData).getData('text');

      if (paste.includes(',') || paste.includes('\n')) {
        e.preventDefault();
        const items = paste.split(/,|\n/);
        items.forEach((item) => this.addTag(item));
      }
    },
    hideSuggestions() {
      this.suggestions = [];
    },
    removeTag(index) {
      this.ownTags.splice(index, 1);
      this.$emit('update:modelValue', this.ownTags);
    },
    setGridPosition(el) {
      el.style.setProperty('top', `${el.offsetTop}px`);
      el.style.setProperty('left', `${el.offsetLeft}px`);
      el.style.setProperty('position', 'absolute');
    },
    validate() {
      let error = '';
      if (this.min && this.modelValue.length < this.min) error = `Must have at minimum ${this.min} entries`;
      if (this.max && this.modelValue.length > this.max) error = `Must have at maximum ${this.max} entries`;
      this.error = error;
    },
  },
  props: {
    allowUnsuggested: Boolean,
    autocompleteModel: Array,
    autocompleteProperty: String,
    dark: Boolean,
    label: String,
    max: Number,
    min: Number,
    modelValue: {
      type: Array,
      default: () => [],
    },
    placeholder: {
      type: String,
      default: 'New Tag…',
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.tag-input
  vertical-align: middle
  align-items: center
  background-color: $bg-secondary
  border-radius: $radius-m
  padding: 1rem
  position: relative
  min-width: 16rem
  max-width: 100%
  cursor: text
  margin-top: 1.5rem
  user-select: none
  display: inline-flex
  transition: box-shadow 200ms ease

  &.dark
    background-color: $bg-secondary-dark

    .label
      color: $text-secondary-dark

    .tags-wrapper
      .tag
        background-color: $bg-dark
        box-shadow: none

      .autogrow-input
        input
          caret-color: currentColor

        .top-suggestion,
        input::placeholder
          color: $text-secondary-dark

  &.error
    box-shadow: inset 0 0 0 2px $negative

    .label
      color: $negative-saturated

    .tags-wrapper
      .tag.overflow
        color: $negative-saturated

  &:focus-within
    box-shadow: inset 0 0 0 2px $accent

  .label
    flex-shrink: 0
    display: block
    cursor: text
    user-select: none
    color: $text-secondary
    transform-origin: bottom left
    position: absolute
    white-space: nowrap
    width: calc(100% - 0.75rem)
    overflow: hidden
    text-overflow: ellipsis
    pointer-events: none
    top: -1.25rem
    left: $radius-m
    font-size: 0.75rem

    &.right
      text-align: right

  .tags-wrapper
    margin: -0.25rem
    display: flex
    flex-wrap: wrap
    align-items: center

    .tag
      padding: 0.25rem
      background-color: $bg
      border-radius: $radius-m
      margin: 0.25rem
      display: inline-flex
      align-items: center
      white-space: nowrap
      max-width: 100%
      box-shadow: inset 0 0 0 0.0625rem $text-tertiary

      > .icon
        flex-shrink: 0

        &:not(.button)
          cursor: move
          width: 1rem
          height: @width

      span
        margin-left: 0.25rem
        max-width: 100%
        overflow: hidden
        text-overflow: ellipsis

      .button
        padding: 0.5rem
        margin-left: 0.25rem
        border-radius: $radius-s

        &::v-deep(.icon)
          width: 1rem
          height: @width

    .autogrow-input
      position: relative
      display: inline-block
      height: 1.5rem
      max-width: 100%
      vertical-align: top
      margin: 0.25rem

      .spacer,
      .top-suggestion,
      input
        height: 100%
        background-color: transparent
        border: none
        color: inherit
        font-family: inherit
        font-size: 1rem
        text-shadow: $text-shadow
        margin: 0
        padding: 0
        outline: none
        text-overflow: ellipsis
        min-width: 0
        white-space: pre
        appearance: none

      input
        position: absolute
        width: 100%
        left: 0
        top: 0
        right: 0
        bottom: 0
        user-select: text
        caret-color: $accent
        -moz-appearance: textfield

        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button,
        &::-webkit-search-decoration,
        &::-webkit-search-cancel-button,
        &::-webkit-search-results-button,
        &::-webkit-search-results-decoration
          appearance: none
          display: none
          margin: 0

        &::placeholder
          color: $text-secondary

      .spacer
        display: block
        overflow: hidden
        visibility: hidden

      .top-suggestion
        display: block
        overflow: hidden
        color: $text-secondary

    .v-enter-active,
    .v-leave-active,
    .v-move
      transition: transform 200ms ease, opacity 200ms ease

      &.v-enter-from,
      &.v-leave-to
        transform: scale(0.8)
        opacity: 0
</style>
