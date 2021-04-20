<template lang="html">
  <transition-group class="sortable-list" :class="{ dragging }" tag="div">
    <div v-for="(item, index) in items" class="drag-item" :data-area="areaId" :data-index="index" :key="item[keyName] || item" @click="handleClick(index)" @pointerdown.left="startDrag($event, index)">
      <slot :active-item="activeItem" :index="index" :item="item" />
    </div>
  </transition-group>
</template>

<script>
export default {
  beforeUnmount() {
    window.removeEventListener('pointerup', this.stopDrag);
    window.removeEventListener('pointermove', this.handlePointerMove, { passive: true });
  },
  data() {
    return {
      activeItem: null,
      areaId: Math.random().toString(36).slice(2, 9),
      beingDragged: false,
      cloneClickDelta: null,
      dragging: false,
      draggingClone: null,
      lastEl: null,
      wasBottomHalf: null,
    };
  },
  emits: ['itemclick', 'itemmove'],
  methods: {
    handleClick(index) {
      if (!this.beingDragged) this.$emit('itemclick', index);
    },
    handlePointerMove(e) {
      this.beingDragged = true; // we moved the cursor
      this.draggingClone.style.left = `${e.clientX - this.cloneClickDelta.x}px`;
      this.draggingClone.style.top = `${e.clientY - this.cloneClickDelta.y}px`;

      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || !el.dataset.index || el.dataset.area !== this.areaId || el === this.dragging) return;
      const index = Number.parseInt(el.dataset.index, 10);

      const elRect = el.getBoundingClientRect();
      const isBottomHalf = (e.clientY - elRect.top) > elRect.height / 2;

      if (el === this.lastEl && isBottomHalf === this.wasBottomHalf) return;

      this.$emit('itemmove', { activeItem: this.activeItem, index, isBottomHalf });
      this.wasBottomHalf = isBottomHalf;
      this.lastEl = el;
    },
    startDrag(e, index) {
      const closestDragHandle = e.target.closest('[data-drag-handle]');
      const closestIgnoreZone = e.target.closest('[data-ignore-drag]');
      if (!closestDragHandle || !this.$el.contains(closestDragHandle) || (closestIgnoreZone && this.$el.contains(closestIgnoreZone))) return;
      if (this.draggingClone) this.destroyClone();
      this.dragging = e.currentTarget;
      this.activeItem = this.items[index];
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
      style.id = `${this.areaId}-grabbingStyle`;
      document.querySelector('head').append(style);
      window.addEventListener('pointerup', this.stopDrag);
      window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    },
    destroyClone() {
      this.draggingClone.remove();
      this.draggingClone = null;
      this.dragging = false;
      this.cloneClickDelta = null;
      this.beingDragged = false;
      this.lastEl = null;
      this.wasBottomHalf = null;
      this.activeItem = null;
    },
    stopDrag() {
      window.removeEventListener('pointerup', this.stopDrag);
      window.removeEventListener('pointermove', this.handlePointerMove, { passive: true });
      document.getElementById(`${this.areaId}-grabbingStyle`).remove();
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
  },
  props: {
    items: Array,
    keyName: String,
  },
};
</script>

<style lang="stylus">
.sortable-list
  &.dragging
    > .drag-item > *
      pointer-events: none

  > .drag-item
      &.v-move
        transition: transform 200ms ease

      [data-drag-handle]
        touch-action: none
</style>
