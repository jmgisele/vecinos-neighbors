<template lang="html">
  <div class="date-picker" :class="{dark}" tabindex="0" @click="activate">
    <MbIcon :icon="modelValue ? 'calendar' : 'calendar-add'" />
    <span class="label" :class="{ placeholder: !formattedDate }">{{formattedDate || placeholder}}</span>
    <MbButton v-if="removable" :dark="dark" icon="cross" rounded tooltip="Clear date" @click="$emit('update:modelValue', null)" />
    <MbPopover center-x class="date-popover" :dark="dark" ref="popover" :style="{ minWidth: popover.minWidth }" :visible="popover.show" :x="popover.x" :y="popover.y" @close="deactivate">
      <header>
        <MbButton :dark="dark" icon="chevron-left" rounded tooltip="Previous month" @click="changeMonth(-1)" />
        <MbSelect v-model="currentMonth" class="month-picker" :dark="dark" :options="months" @click="monthSelectorOpen = true" />
        <MbButton :dark="dark" icon="chevron-right" rounded tooltip="Next month" @click="changeMonth(1)" />
      </header>
      <div class="calendar">
        <header>
          <span class="label">Mon</span>
          <span class="label">Tue</span>
          <span class="label">Wed</span>
          <span class="label">Thu</span>
          <span class="label">Fri</span>
          <span class="label">Sat</span>
          <span class="label">Sun</span>
        </header>
        <div class="days">

        </div>
      </div>
      <template #footer>
        <MbButton :dark="dark" @click="deactivate">Cancel</MbButton>
        <MbButton :dark="dark" type="primary" @click="setDate">Set Date</MbButton>
      </template>
    </MbPopover>
  </div>
</template>

<script>
import {
  addMonths,
  eachMonthOfInterval,
  endOfYear,
  format,
  getMonth,
  setMonth,
  startOfYear,
} from 'date-fns';

export default {
  computed: {
    currentMonth: {
      get() {
        return getMonth(this.date);
      },
      set(v) {
        this.date = setMonth(this.date, v);
      },
    },
    formattedDate() {
      if (!this.modelValue) return null;
      return format(this.date, 'MMM do yyyy');
    },
    months() {
      return eachMonthOfInterval({ start: startOfYear(this.date), end: endOfYear(this.date) })
        .map((month, index) => ({
          label: format(month, 'MMMM yyyy'),
          value: index,
        }));
    },
  },
  created() {
    if (this.modelValue) this.date = new Date(this.modelValue);
    else this.date = new Date();
  },
  data() {
    return {
      date: null,
      monthSelectorOpen: false,
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
    changeMonth(amount) {
      this.date = addMonths(this.date, amount);
    },
    deactivate(e) {
      if (this.monthSelectorOpen) {
        this.monthSelectorOpen = false;
        return;
      }
      if (e && e.type === 'scroll' && this.$refs.popover.$refs.el.contains(e.target)) return;
      window.removeEventListener('scroll', this.deactivate, { capture: true, passive: true });
      this.popover.show = false;
      this.$el.focus();
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

<style lang="stylus">
.date-popover // needs to be unscoped for the select to pick up the styles
  .month-picker.select.button
    border: none
    min-width: auto

    &:focus
      border: none
</style>

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
  *
    user-select: none

  header
    display: flex
    align-items: center
    margin-bottom: 0.5rem

    .button
      &:first-child
        margin-right: 0.5rem

      &:last-child
        margin-left: 0.5rem

  .calendar
    header
      display: flex
      justify-content: space-around
      color: $text-secondary
      margin-bottom: 0.75rem

      .label
        margin: 0 0.375rem
        width: 100%
        text-align: center
        font-size: 0.75rem

        &:first-child
          margin-left: 0

        &:last-child
          margin-right: 0

    .days
      display: flex
      flex-wrap: wrap
      margin: 0 -0.1875rem

      .button
        margin: 0.1875rem 0.1875rem
        width: calc(100% / 7 - 0.375rem)
        padding: 0.125rem

</style>
