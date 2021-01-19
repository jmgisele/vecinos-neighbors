<template lang="html">
  <div class="date-picker" :class="{dark}" tabindex="0" @click="activate">
    <MbIcon :icon="modelValue ? 'calendar' : 'calendar-add'" />
    <span class="label" :class="{ placeholder: !formattedDate }">{{formattedDate || placeholder}}</span>
    <MbButton v-if="removable" :dark="dark" icon="cross" rounded tooltip="Clear date" @click="$emit('update:modelValue', null)" />
    <MbPopover center-x class="date-popover" :dark="dark" ref="popover" :style="{ minWidth: popover.minWidth }" :visible="popover.show" :x="popover.x" :y="popover.y" @close="deactivate">
      <MbSelect class="month-picker" :dark="dark" :model-value="months[currentMonth]" :options="months" rounded @update:model-value="setCurrentMonth" />
      <div class="calendar">

      </div>
      <template #footer>
        <MbButton :dark="dark" @click="deactivate">Cancel</MbButton>
        <MbButton :dark="dark" type="primary" @click="setDate">Set Date</MbButton>
      </template>
    </MbPopover>
  </div>
</template>

<script>
export default {
  computed: {
    formattedDate() {
      if (!this.modelValue) return null;
      return 'Todo: format date';
    },
    months() {
      return [
        'January 2021',
        'February 2021',
        'March 2021',
        'May 2021',
        'June 2021',
        'July 2021',
        'August 2021',
        'September 2021',
        'October 2021',
        'November 2021',
        'December 2021',
      ];
    },
  },
  data() {
    return {
      currentMonth: 0,
      date: null,
      popover: {
        minWidth: 0,
        show: false,
        x: 0,
        y: 0,
      },
    };
  },
  emits: ['update:modelValue'],
  methods: {
    activate() {
      if (this.popover.show) return;
      const rect = this.$el.getBoundingClientRect();
      const remBase = Number.parseInt(window.getComputedStyle(document.documentElement).fontSize, 10);
      this.popover.x = rect.left + rect.width / 2;
      this.popover.y = rect.bottom + 0.5 * remBase;
      this.popover.minWidth = Math.min(rect.width, window.innerWidth - remBase);
      window.addEventListener('scroll', this.deactivate, { capture: true, passive: true });

      this.popover.show = true;
    },
    deactivate(e) {
      if (e && e.type === 'scroll' && this.$refs.popover.$refs.el.contains(e.target)) return;
      window.removeEventListener('scroll', this.deactivate, { capture: true, passive: true });
      this.popover.show = false;
      this.$el.focus();
    },
    setCurrentMonth(month) {
      this.currentMonth = this.months.indexOf(month);
    },
    setDate() {
      this.$emit('update:modelValue', this.date);
      this.deactivate();
    },
  },
  props: {
    dark: Boolean,
    format: {
      type: String,
      validator: (v) => ['ms', 'iso'].includes(v),
      default: 'ms',
    },
    modelValue: [String, Number],
    placeholder: {
      type: String,
      default: 'Choose a date…',
    },
    removable: Boolean,
    showTime: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.date-picker
  position: relative
  border: none
  background-color: $bg-secondary
  color: inherit
  border-radius: $radius-m
  padding: 1rem
  padding-right: 1.5rem
  display: inline-flex
  align-items: center
  cursor: pointer
  transition: background-color 200ms ease
  user-select: none
  text-align: left
  white-space: nowrap
  max-width: 100%

  &:hover
    background-color: $bg-tertiary

  &:focus
    background-color: $bg

    &::before
      opacity: 1

  &:active
    transform: translateY(2px)

  &.dark
    background-color: $bg-secondary-dark

    &:hover
      background-color: $bg-tertiary-dark

    &:focus
      background-color: $bg-dark

    .label.placeholder
      color: $text-secondary-dark

  &::before
    content: ''
    position: absolute
    top: -1px
    left: @top
    right: @top
    bottom: @top
    box-shadow: inset 0 0 0 0.125rem $accent
    opacity: 0
    border-radius: @border-radius
    transition: opacity 200ms ease

  .label
    margin-left: 0.75rem

    &.placeholder
      color: $text-secondary

  .button.icon
    margin: -0.5rem
    margin-left: 0.5rem
    margin-right: -1rem
    padding: (8.5 / 16)rem

.date-popover
  .month-picker
    border: none
    min-width: auto

  .calendar
    background-color: red
    height: 1rem
</style>
