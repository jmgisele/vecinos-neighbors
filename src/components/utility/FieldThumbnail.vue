<template lang="html">
  <div class="field-thumbnail">
    <div class="field" :class="{ dark, dragging }" @click="isMobile ? $emit('add-field') : null" @pointerdown="startDrag">
      <MbIcon icon="drag-handle" />
      <div class="field-icon">
        <MbIcon :icon="icon" />
      </div>
      <div class="field-info">
        <p>{{name}}</p>
        <p>{{description}}</p>
      </div>
    </div>
    <MbButton :dark="dark" icon="plus" rounded :tooltip="{ message: 'Add this field to the end of the schema', position: 'right' }" type="positive" @click="$emit('add-field')" />
  </div>
</template>

<script>
export default {
  beforeUnmount() {
    window.removeEventListener('pointerup', this.stopDrag);
    window.removeEventListener('pointermove', this.handlePointerMove, { passive: true });
  },
  computed: {
    isMobile() {
      return this.$store.state.application.mobile;
    },
  },
  data() {
    return {
      cloneClickDelta: null,
      dragging: false,
      draggingClone: null,
      droppable: false,
    };
  },
  emits: ['add-field', 'field-over'],
  methods: {
    handlePointerMove(e) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      this.draggingClone.style.left = `${e.clientX - this.cloneClickDelta.x}px`;
      this.draggingClone.style.top = `${e.clientY - this.cloneClickDelta.y}px`;
      this.droppable = false;
      if (!el || !el.dataset.index || !el.dataset.parent || el === this.dragging) return;
      const index = Number.parseInt(el.dataset.index, 10);
      const { parent } = el.dataset;
      const elRect = el.getBoundingClientRect();
      const isBottomHalf = (e.clientY - elRect.top) > elRect.height / 2;
      if (isBottomHalf) this.$emit('field-over', { parent, index: index + 1 });
      else this.$emit('field-over', { parent, index });
      this.droppable = true;
    },
    startDrag(e) {
      if (this.isMobile) return; // no drag-n-drop when modal is open
      if (this.draggingClone) this.destroyClone();
      this.dragging = e.currentTarget;
      const rect = e.currentTarget.getBoundingClientRect();
      const clone = e.currentTarget.cloneNode(true);
      this.cloneClickDelta = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      clone.style.position = 'fixed';
      clone.style.left = `${e.clientX - this.cloneClickDelta.x}px`;
      clone.style.top = `${e.clientY - this.cloneClickDelta.y}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.pointerEvents = 'none';
      clone.style.zIndex = 999;
      clone.style.margin = 0;
      document.body.append(clone);
      this.draggingClone = clone;
      const style = document.createElement('STYLE');
      style.innerText = '* { cursor: grabbing !important; }';
      style.id = 'fieldThumbnailGrabbingStyle';
      document.querySelector('head').append(style);
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
      document.getElementById('fieldThumbnailGrabbingStyle').remove();
      const targetRect = this.dragging.getBoundingClientRect();
      const { left: currentLeft, top: currentTop } = this.draggingClone.style;
      if (this.droppable && (Number.parseInt(currentLeft, 10) === Math.floor(targetRect.left) && Number.parseInt(currentTop, 10) === Math.floor(targetRect.top))) {
        this.destroyClone();
        return;
      }
      this.draggingClone.style.transition = 'left 200ms ease, top 200ms ease';
      this.draggingClone.style.left = `${targetRect.left}px`;
      this.draggingClone.style.top = `${targetRect.top}px`;
      this.draggingClone.addEventListener('transitionend', this.destroyClone, { once: true });
    },
  },
  props: {
    dark: Boolean,
    description: String,
    icon: String,
    name: String,
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.field-thumbnail
  display: flex
  align-items: center

  &:not(:last-child)
    margin-bottom: 0.5rem

  .button
    margin-left: 1rem
    flex-shrink: 0

    @media $mobile
      display: none

// needs to be toplevel so the drag-clone has the styling
.field
  display: flex
  align-items: center
  width: 100%
  border-radius: $radius-m
  padding: 1rem
  box-shadow: inset 0 0 0 0.0625rem $text-tertiary
  overflow: hidden
  background-color: $bg

  &.dragging
    opacity: 0.25

  &.dark
    box-shadow: inset 0 0 0 0.0625rem lighten($bg-tertiary-dark, 10)
    background-color: $bg-tertiary-dark

    .field-info p:last-child
      color: $text-secondary-dark

  > .icon:not(.button)
    margin-right: 1rem
    flex-shrink: 0
    cursor: move

    @media $mobile
      display: none

  .field-icon
    padding: 0.5rem
    background-color: $accent
    color: $text-dark
    border-radius: $radius-m
    margin-right: 1rem

    .icon
      display: block

  .field-info
    overflow: hidden

    p
      margin: 0
      text-overflow: ellipsis
      overflow: hidden

      &:last-child
        color: $text-secondary
        font-size: 0.875rem

        @media $tablet
          display: none
</style>
