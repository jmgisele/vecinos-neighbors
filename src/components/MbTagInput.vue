<template lang="html">
  <div class="tag-input" :class="{dark, error: error || (max && modelValue.length > max), }" @click="$refs.input.focus()" @focusin="handleFocusIn" @focusout="handleFocusOut">
    <span v-if="displayLabel" class="label" :class="{ right: !label && max }">{{displayLabel}}</span>
    <transition-group class="tags-wrapper" tag="div" @before-leave="setGridPosition">
      <div v-for="(tag, index) in modelValue" class="tag" :class="{ overflow: max && index + 1 > max, dark, 'drag-active': index === draggedIndex }" :data-area="areaId" :data-index="index" :key="tag[autocompleteProperty] || tag" @pointerdown="startDrag($event, index)">
        <MbIcon icon="drag-handle" />
        <span>{{tag[autocompleteProperty] || tag}}</span>
        <MbButton :dark="dark" :disabled="index === draggedIndex" icon="cross" @click="removeTag(index)" />
      </div>
      <div class="autogrow-input" key="autogrowInput">
        <span v-show="topSuggestion && newTag" class="top-suggestion">{{topSuggestion}}</span>
        <input autocapitalize="off" autocomplete="off" :placeholder="placeholder" ref="input" type="text" :value="newTag" @contextmenu.prevent="fetchSuggestions" @input="handleInput" @keydown="handleAcceptOrDelete" @keyup.arrow-down="focusMenu" @keyup="handleMobileComma" @paste="handlePaste">
        <span class="spacer" ref="spacer">{{placeholder}}</span>
      </div>
    </transition-group>
    <MbContextMenu :dark="dark" :options="contextActions.length > 0 ? contextActions : contextActionsCache" ref="menu" :show="contextActions.length > 0" :steal-focus="false" :target="$refs.input" :x="popover.x" :y="popover.y" @close="hideSuggestions" />
  </div>
</template>

<script>
export default {
  beforeUnmount() {
    window.removeEventListener('pointerup', this.stopDrag);
    window.removeEventListener('pointermove', this.handlePointerMove, { passive: true });
  },
  computed: {
    contextActions() {
      if (this.filteredSuggestions.length < 1 || (this.filteredSuggestions.length === 1 && this.topSuggestion)) return [];
      return this.filteredSuggestions.slice(0, 5).map((suggestion) => ({
        action: () => this.addTag(suggestion),
        label: this.autocompleteProperty && typeof suggestion !== 'string' ? suggestion[this.autocompleteProperty] : suggestion,
      }));
    },
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
      if (
        this.autocompleteModel
        && !this.autocompleteProperty
        && this.filteredSuggestions.length > 0
        && typeof this.filteredSuggestions[0] === 'string'
        && this.filteredSuggestions[0].startsWith(this.newTag)
      ) return this.filteredSuggestions[0];
      return null;
    },
  },
  data() {
    return {
      areaId: Math.random().toString(36).slice(2, 9),
      cloneClickDelta: null,
      contextActionsCache: [],
      dragging: false,
      draggingClone: null,
      draggedIndex: -1,
      error: '',
      newTag: '',
      popover: { x: 0, y: 0 },
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
      if (!this.autocompleteModel) return;

      const seen = []; // to deduplicate
      this.suggestions = this.autocompleteModel.filter((el) => {
        if (this.autocompleteProperty) {
          const prop = el[this.autocompleteProperty];
          if (!prop || seen.includes(prop)) return false;
          seen.push(prop);
          return prop.toLowerCase().includes(this.newTag.toLowerCase());
        }
        return el.toLowerCase().includes(this.newTag.toLowerCase());
      });
    },
    focusMenu() {
      if (this.contextActions.length > 0) {
        this.$refs.menu.focus(0);
      }
    },
    handleAcceptOrDelete(e) {
      if (e.key === ',') e.preventDefault();
      if (this.newTag.length > 0) {
        if (e.key === 'Enter' || e.key === ',') {
          let tag;
          if (this.filteredSuggestions.length > 0) [tag] = this.filteredSuggestions;
          else if (!this.autocompleteModel || this.allowUnsuggested) tag = this.newTag;

          if (tag) this.addTag(tag);
          else this.error = `‘${this.newTag}’ is not an allowed value`;
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        this.ownTags.pop();
        this.$emit('update:modelValue', this.ownTags);
      }
    },
    handleFocusIn() {
      this.$emit('focus');
    },
    handleFocusOut(e) {
      if (!e.relatedTarget || !this.$el.contains(e.relatedTarget)) {
        this.validate();
        this.$emit('blur');
      }
    },
    handleInput(e) {
      this.newTag = e.target.value;
      this.error = '';
      if (this.$refs.input.value) this.$refs.spacer.innerText = this.$refs.input.value; // to fix the jitter I can’t use {{newTag}} in the <span>
      else this.$refs.spacer.innerText = this.placeholder;

      if (this.newTag.length > 3 || (this.autocompleteModel && !this.allowUnsuggested)) {
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
            this.error = `‘${this.newTag}’ is not an allowed value`;
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
    handlePointerEnter(i) {
      if (!this.dragging) return;
      this.ownTags.splice(i, 0, this.ownTags.splice(this.draggedIndex, 1)[0]);
      this.draggedIndex = i;
      this.$emit('update:modelValue', this.ownTags);
    },
    handlePointerMove(e) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      this.draggingClone.style.left = `${e.clientX - this.cloneClickDelta.x}px`;
      this.draggingClone.style.top = `${e.clientY - this.cloneClickDelta.y}px`;
      if (!el || !el.dataset.index || !el.classList.contains('tag') || el.dataset.area !== this.areaId) return;
      this.handlePointerEnter(Number.parseInt(el.dataset.index, 10)); // TODO: Distinguish between left and right half of element and set index accordingly?
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
    setPopoverPosition() {
      if (this.contextActions.length < 1) return;
      const rect = this.$refs.input.getBoundingClientRect();
      const remBase = Number.parseInt(window.getComputedStyle(document.documentElement).fontSize, 10);
      this.popover.x = rect.left - 1.5 * remBase;
      this.popover.y = rect.bottom + 0.5 * remBase;
    },
    startDrag(e, index) {
      if (e.target.tagName.toLowerCase() === 'button' || e.button !== 0) return;
      if (this.draggingClone) this.destroyClone();
      this.dragging = e.currentTarget;
      this.draggedIndex = index;
      const rect = e.currentTarget.getBoundingClientRect();
      const clone = e.currentTarget.cloneNode(true);
      this.cloneClickDelta = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      clone.style.position = 'fixed';
      clone.style.left = `${e.clientX - this.cloneClickDelta.x}px`;
      clone.style.top = `${e.clientY - this.cloneClickDelta.y}px`;
      clone.style.pointerEvents = 'none';
      clone.style.zIndex = 999;
      clone.style.margin = 0;
      document.body.append(clone);
      this.draggingClone = clone;
      window.addEventListener('pointerup', this.stopDrag);
      window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    },
    destroyClone() {
      this.draggingClone.remove();
      this.draggingClone = null;
      this.dragging = false;
      this.draggedIndex = -1;
      this.cloneClickDelta = null;
    },
    stopDrag() {
      window.removeEventListener('pointerup', this.stopDrag);
      window.removeEventListener('pointermove', this.handlePointerMove, { passive: true });
      const targetRect = this.dragging.getBoundingClientRect();
      const { left: currentLeft, top: currentTop } = this.draggingClone.style;
      if (Number.parseInt(currentLeft, 10) === Math.floor(targetRect.left) && Number.parseInt(currentTop, 10) === Math.floor(targetRect.top)) {
        this.destroyClone();
        return;
      }
      this.draggingClone.style.transition = 'left 200ms ease, top 200ms ease';
      this.draggingClone.style.left = `${targetRect.left}px`;
      this.draggingClone.style.top = `${targetRect.top}px`;
      this.draggingClone.addEventListener('transitionend', this.destroyClone, { once: true });
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
  watch: {
    contextActions(nv, ov) {
      if (nv.length === 0) this.contextActionsCache = ov;
      else this.setPopoverPosition();
    },
    modelValue() {
      if (this.suggestions.length > 0) this.hideSuggestions();
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
  cursor: text
  margin-top: 1.5rem
  user-select: none
  display: flex
  transition: box-shadow 200ms ease

  &.dark
    background-color: $bg-secondary-dark

    .label
      color: $text-secondary-dark

    .tags-wrapper
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
    max-width: 100%
    display: flex
    flex-wrap: wrap
    align-items: center

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
        padding-right: 0.0625rem // so it doesn’t cause a scroll / jitter

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

    .v-move
      pointer-events: none

// needs to be unnested so the tag clone has the same styles
.tag
  padding: 0.25rem
  background-color: $bg
  border-radius: $radius-m
  margin: 0.25rem
  display: inline-flex
  align-items: center
  white-space: nowrap
  max-width: 100%
  touch-action: none
  cursor: default
  box-shadow: inset 0 0 0 0.0625rem $text-tertiary

  &.dark
    background-color: $bg-dark
    box-shadow: none

  &.overflow
    color: $negative-saturated

  &.drag-active
    box-shadow: inset 0 0 0 2px alpha($accent, 0.5)
    background-color: transparent

    > *
      opacity: 0

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

  .button.icon
    padding: 0.5rem
    margin-left: 0.25rem
    border-radius: $radius-s

    &::v-deep(.icon)
      width: 1rem
      height: @width
</style>
