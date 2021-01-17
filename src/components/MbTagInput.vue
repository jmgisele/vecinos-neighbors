<template lang="html">
  <div class="tag-input" :class="{dark, dirty: error || modelValue.length > 0 || newTag || placeholder, error: error || (max && modelValue.length > max), }" @click="$refs.input.focus()" @focusin="handleFocusIn" @focusout="handleFocusOut">
    <span v-if="displayLabel" :class="{ right: !label && max }">{{displayLabel}}</span>
    <transition-group class="tags-wrapper" tag="div">
      <div v-for="(tag, index) in modelValue" class="tag" :key="tag[autocompleteProperty] || tag">
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
      focussed: false,
      newTag: '',
      suggestions: [],
    };
  },
  emits: ['blur', 'focus', 'update:modelValue'],
  methods: {
    addTag(tag) {
      const elementExists = this.ownTags.findIndex((element) => {
        if (this.autocompleteProperty && element[this.autocompleteProperty]) return element[this.autocompleteProperty] === tag[this.autocompleteProperty];
        return element === tag;
      }) >= 0;

      if (!elementExists) {
        this.ownTags.push(tag);
        this.$emit('update:modelValue', this.ownTags);
        this.$refs.input.focus();
      }
      this.newTag = '';
      this.$refs.spacer.innerText = this.placeholder;
      if (this.suggestions.length > 0) this.suggestions = [];
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
          else if (!this.autocompleteModel || this.allowUnsuggested) tag = this.newTag.trim().toLowerCase();

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
      this.focussed = true;
      this.$emit('focus');
    },
    handleFocusOut(e) {
      if (!e.relatedTarget || !this.$el.contains(e.relatedTarget)) {
        this.focussed = false;
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
          else if (!this.autocompleteModel || this.allowUnsuggested) tag = newTag.trim().toLowerCase();

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
        items.forEach((item) => {
          const trimmed = item.trim();
          if (trimmed) this.addTag(trimmed);
        });
      }
    },
    hideSuggestions() {
      this.suggestions = [];
    },
    removeTag(index) {
      this.ownTags.splice(index, 1);
      this.$emit('update:modelValue', this.ownTags);
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

  &.dark
    background-color: $bg-secondary-dark

    .tags-wrapper
      .tag
        background-color: $bg-dark
        box-shadow: none

      .autogrow-input
        .top-suggestion
          color: $text-secondary-dark

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
</style>
