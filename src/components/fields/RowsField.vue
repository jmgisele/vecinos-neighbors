<template lang="html">
  <section class="rows field">
    <div class="container" :class="{ dark, empty, error }">
      <p class="label">{{transformedLabel}}</p>
      <p v-show="empty" class="empty-state">This field is empty</p>
      <MbSortableList v-if="displayItems.length > 0" v-slot="{ activeItem, item, index }" enable-transitions :items="uniqueItemKeys" @itemclick="openDetails" @itemmove="handleItemMove">
        <div class="row-item" :class="{ active: active && indexBeingEdited === index, 'being-dragged': item === activeItem, compact: isCompact, dark, error: errorForIndex(index), 'in-split': inSplit }" tabindex="0" @[compactContextmenu].prevent="openContextMenu($event, index)" @[compactKeydown].space.prevent @[compactKeyup].space.enter="openDetails(index)">
          <template v-if="isCompact">
            <div class="drag-handle" data-drag-handle>
              <MbIcon icon="drag-handle" />
            </div>
            <div class="left">
              <p class="label" :class="{ unstyled: !displayItems[index].displayValue }">{{errorForIndex(index) || displayItems[index].label}}</p>
              <p v-if="displayItems[index].displayValue || errorForIndex(index)" class="content">{{displayItems[index].displayValue || displayItems[index].label}}</p>
            </div>
            <MbIcon v-if="isCompact" :icon="active && indexBeingEdited === index ? 'cross' : errorForIndex(index) ? 'error' : 'pencil'" />
          </template>
          <template v-else>
            <header data-drag-handle>
              <div class="drag-handle">
                <MbIcon icon="drag-handle" />
              </div>
              <p class="label">{{displayItems[index].label}}</p>
              <MbButton v-if="options.allowEditing && children.length > 1" :dark="dark" data-ignore-drag icon="replace-round" rounded :tooltip="`Change ${options.itemLabel || 'Row'} type`" @click="indexBeingEdited = index; showTypeChangeModal = true;" />
              <MbButton v-if="options.allowEditing" :dark="dark" data-ignore-drag icon="duplicate" rounded :tooltip="`Duplicate ${options.itemLabel || 'Row'}`" @click="duplicateItem(index)" />
              <MbButton v-if="options.allowEditing" :dark="dark" data-ignore-drag icon="trash" rounded :tooltip="`Delete ${options.itemLabel || 'Row'}`" type="negative" @click="deleteItem(index)" />
            </header>
            <MbFieldsEditor
              :class="{ 'in-split': inSplit }"
              compact
              :dark="dark"
              :error="errorMapForIndex(index)"
              :fields="fieldsForIndex(index)"
              :in-split="inSplit"
              :model-value="modelValueForIndex(index)"
              :languages="languages"
              @update:error="handleFieldError($event, index)"
              @update:model-value="updateField($event, index)"
            />
          </template>
        </div>
      </MbSortableList>
      <MbButton v-if="options.allowEditing && children.length > 0" class="add-button" :dark="dark" icon="plus" type="positive" @click="handleAddClick">Add {{options.itemLabel || 'Row'}}</MbButton>
    </div>
    <MbModal class="add-modal" :dark="dark" title="Add new…" :visible="showAddModal" @close="showAddModal = false">
      <ul>
        <li v-for="child in children" :key="child.key">
          <MbButton :dark="dark" :icon="child.icon" @click="addItem(child)">{{child.label}}</MbButton>
        </li>
      </ul>
      <template #actions>
        <MbButton :dark="dark" @click="showAddModal = false">Cancel</MbButton>
      </template>
    </MbModal>
    <MbModal class="item-details" :dark="dark" :title="fieldBeingEdited && fieldBeingEdited.label" :visible="showDetailsModal" @after-close="validateItemBeingEdited" @close="closeDetails" @keyup.ctrl.enter="closeDetails">
      <teleport v-if="!teleportTarget || active" :disabled="!teleportTarget" :to="teleportTarget">
        <h2 v-if="teleportTarget" class="h3 split-title">{{fieldBeingEdited && fieldBeingEdited.label}}</h2>
        <MbFieldsEditor
          v-if="modelValue && indexBeingEdited !== null && fieldBeingEdited"
          class="field-details-editor"
          :class="{ 'in-split': teleportTarget }"
          compact
          :dark="dark"
          :error="fieldBeingEditedErrors"
          :fields="fieldBeingEdited.type === 'group' ? fieldBeingEdited.value : [fieldBeingEdited]"
          :in-split="Boolean(teleportTarget)"
          :model-value="modelValueForIndex(indexBeingEdited)"
          :languages="languages"
          @update:error="handleFieldBeingEditedError"
          @update:model-value="updateFieldBeingEdited"
        />
        <MbButton v-if="options.allowEditing && teleportTarget" class="delete-button" :dark="dark" icon="trash" type="negative" @click="deleteItemBeingEdited">Delete {{options.itemLabel || 'Row'}}</MbButton>
      </teleport>
      <template #actions>
        <MbButton v-if="options.allowEditing" :dark="dark" icon="trash" type="negative" @click="deleteItemBeingEdited">Delete {{options.itemLabel || 'Row'}}</MbButton>
        <MbButton :dark="dark" type="primary" @click="closeDetails">Done</MbButton>
      </template>
    </MbModal>
    <MbModal class="change-type-modal" :dark="dark" :title="`Change ${options.itemLabel || 'Row'} Type`" :visible="showTypeChangeModal" @close="showTypeChangeModal = false">
      <template v-if="modelValue && modelValue[indexBeingEdited]">
        <h2 class="h4">Existing Values</h2>
        <ul class="existing-values">
          <li v-for="(value, key) in modelValue[indexBeingEdited]" :key="key">
            <code>{{key}}:</code>
            <span>{{value}}</span>
          </li>
        </ul>
      </template>
      <h2 class="h4">Available Types</h2>
      <ul>
        <li v-for="child in children" :key="child.key">
          <MbButton :dark="dark" :icon="child.icon" @click="changeItemType(indexBeingEdited, child)">{{child.label}}</MbButton>
        </li>
      </ul>
      <template #actions>
        <MbButton :dark="dark" @click="showTypeChangeModal = false">Cancel</MbButton>
      </template>
    </MbModal>
    <MbContextMenu v-if="isCompact" :dark="dark" :options="itemContextMenu.options" :show="itemContextMenu.show" :target="itemContextMenu.target" :x="itemContextMenu.x" :y="itemContextMenu.y" @close="resetRowContextMenu" />
  </section>
</template>

<script>
import repeatingField from '../../mixins/repeatingField';

export default {
  computed: {
    compactContextmenu() {
      if (this.isCompact) return 'contextmenu';
      return null;
    },
    compactKeydown() {
      if (this.isCompact) return 'keydown';
      return null;
    },
    compactKeyup() {
      if (this.isCompact) return 'keyup';
      return null;
    },
    isCompact() {
      return this.compact && this.options.compact;
    },
  },
  mixins: [repeatingField],
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'
@require '../../assets/styles/fields'

.rows.field
  .container
    @media $mobile
      padding: 0.5rem

    &.empty
      .add-button
        margin-right: auto

    .add-button
      display: flex
      margin-left: auto

      @media $mobile
        width: 100%

.add-modal,
.change-type-modal
  ul
    list-style: none
    margin: 0
    padding: 0
    display: grid
    grid-template-columns: repeat(2, 1fr)
    grid-gap: 1rem

    @media $mobile
      display: block

    &:last-child
      margin-bottom: 0.125rem

    li
      .button
        width: 100%

.change-type-modal
  .existing-values

    li
      display: flex
      align-items: center
      overflow: hidden
      white-space: nowrap

      span
        overflow: hidden
        text-overflow: ellipsis

      code
        margin-right: 0.5rem

.row-item
  margin-bottom: 1rem

  &.being-dragged
    opacity: 0.5
    transform: none !important

    &::before
      opacity: 0

  &:not(.compact)
    border: 0.0625rem solid alpha($text, 0.12)
    border-radius: $radius-m
    padding: 1rem
    background-color: $bg
    position: relative

    @media $mobile
      padding: 0.5rem

    &.dark
      background-color: $bg-dark
      border-color: alpha($text-dark, 0.12)

      &.in-split
        background-color: $bg-secondary-dark

      .label
        color: $text-secondary-dark

    &.error
      &::before
        opacity: 1

      > header .label
        color $negative-saturated

    &::before
      content: ''
      position: absolute
      top: -0.0625rem // so the outer border gets overlapped
      left: @top
      right: @top
      bottom: @top
      border: 0.125rem solid $negative
      opacity: 0
      border-radius: inherit
      z-index: 1
      pointer-events: none
      transition: opacity 200ms ease

    header
      display: flex
      align-items: center
      margin-bottom: 1rem

      .label
        margin: 0
        color: $text-secondary
        margin-right: auto
        white-space: nowrap
        overflow: hidden
        text-overflow: ellipsis

      .button
        margin: -1rem 0
        margin-right: 0.25rem
        flex-shrink: 0

        &:last-child
          margin-right: -0.75rem

  .drag-handle
    padding: 1rem
    margin: -1rem
    margin-right: -0.25rem
    cursor: move

.field-details-editor.in-split
  margin-bottom: 2rem

.delete-button
  display: flex
  margin-left: auto
  margin-bottom: 0.125rem
</style>
