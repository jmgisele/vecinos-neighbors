<template lang="html">
  <div class="date-picker" :class="{dark}" tabindex="0" @click="activate">
    <MbIcon :icon="modelValue ? 'calendar' : 'calendar-add'" />
    <span class="label" :class="{ placeholder: !formattedDate }">{{formattedDate || placeholder}}</span>
    <MbButton v-if="removable" :dark="dark" icon="cross" rounded tooltip="Clear date" @click="$emit('update:modelValue', null)" />
    <MbPopover center-x class="date-popover" :dark="dark" ref="popover" :visible="popover.show" :x="popover.x" :y="popover.y" @close="deactivate">
      <header>
        <MbButton v-show="!mobile" :dark="dark" icon="chevron-left" rounded tooltip="Previous month" @click="changeMonth(-1)" />
        <MbSelect v-model="currentMonth" class="month-picker" :dark="dark" :options="months" @click="monthSelectorOpen = true" />
        <MbButton v-show="!mobile" :dark="dark" icon="chevron-right" rounded tooltip="Next month" @click="changeMonth(1)" />
      </header>
      <div class="calendar" @touchend="handleTouchEnd" @touchstart="handleTouchStart">
        <header>
          <span class="label">Mon</span>
          <span class="label">Tue</span>
          <span class="label">Wed</span>
          <span class="label">Thu</span>
          <span class="label">Fri</span>
          <span class="label">Sat</span>
          <span class="label">Sun</span>
        </header>
        <transition mode="out-in" :name="calendarTransition">
          <div class="days" :key="currentMonth">
            <MbButton v-for="(day, index) in days" :class="{ 'other-month': day.month !== currentMonth }" :dark="dark" :key="index" rounded :type="day.active ? 'primary' : null" @click="setDay(day.day, day.month, day.year)">{{day.day}}</MbButton>
          </div>
        </transition>
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
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  formatISO,
  getDate,
  getMonth,
  getYear,
  isSameDay,
  setDate,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

export default {
  beforeUnmount() {
    window.removeEventListener('scroll', this.deactivate, { capture: true, passive: true });
  },
  computed: {
    currentMonth: {
      get() {
        return getMonth(this.date);
      },
      set(v) {
        this.date = setMonth(this.date, v);
      },
    },
    currentYear() {
      return getYear(this.date);
    },
    days() {
      const start = startOfWeek(startOfMonth(this.date), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(this.date), { weekStartsOn: 1 });
      const rawDays = eachDayOfInterval({ start, end });
      const cleanDays = [];
      rawDays.forEach((day) => {
        cleanDays.push({
          active: isSameDay(this.date, day),
          day: getDate(day),
          month: getMonth(day),
          year: getYear(day),
        });
      });
      return cleanDays;
    },
    formattedDate() {
      if (!this.modelValue) return null;
      return format(this.modelValue, 'MMMM do, yyyy');
    },
    mobile() {
      return this.$store.state.application.mobile;
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
      calendarTransition: 'forward',
      date: null,
      monthSelectorOpen: false,
      popover: {
        show: false,
        x: 0,
        y: 0,
      },
      touchStart: 0,
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
    handleTouchEnd(e) {
      const delta = this.touchStart - e.changedTouches[0].clientX;
      const threshold = 150;

      if (delta > threshold) this.changeMonth(1);
      if (delta < -threshold) this.changeMonth(-1);
    },
    handleTouchStart(e) {
      this.touchStart = e.changedTouches[0].clientX;
    },
    setDate() {
      if (this.format === 'ms') this.$emit('update:modelValue', this.date.valueOf());
      else if (this.format === 'iso' && this.showTime) this.$emit('update:modelValue', formatISO(this.date));
      else this.$emit('update:modelValue', formatISO(this.date, { representation: 'date' }));
      this.deactivate();
    },
    setDay(day, month, year) {
      let { date } = this;
      if (year !== this.currentYear) date = setYear(date, year);
      if (month !== this.currentMonth) date = setMonth(date, month);
      this.date = setDate(date, day);
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
  watch: {
    currentMonth(nv, ov) {
      if (ov > nv) this.calendarTransition = 'forwards';
      else this.calendarTransition = 'backwards';
    },
    currentYear(nv, ov) { // hacky but ensures that the right animation plays if the year gets smaller
      if (ov > nv) this.calendarTransition = 'forwards';
      else this.calendarTransition = 'backwards';
    },
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
@require '../assets/styles/breakpoints'
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
  &.dark
    .calendar
      header
        color: $text-secondary-dark

      .days
        .button.other-month
          color: $text-tertiary-dark
  *
    user-select: none

  header
    display: flex
    justify-content: space-between
    align-items: center
    margin-bottom: 1rem

    @media $mobile
      justify-content: center

    .button
      &:first-child
        margin-right: 0.5rem

      &:last-child
        margin-left: 0.5rem

  .calendar
    margin: 0 auto
    width: 100%
    max-width: (((7 * (40 + 6)) - 6) / 16)rem // 7 Buttons a 48px + 6px margin - negative margin of 6px

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

      &.forwards-enter-active,
      &.backwards-enter-active,
      &.forwards-leave-active,
      &.backwards-leave-active
        transition: transform 150ms ease-out, opacity 150ms ease-out

        &.forwards-enter-from,
        &.backwards-leave-to
          opacity: 0
          transform: translateX(-2rem)

        &.backwards-enter-from,
        &.forwards-leave-to
          opacity: 0
          transform: translateX(2rem)

      &.forwards-leave-active,
      &.backwards-leave-active
        transition-timing-function: ease-in

      .button
        margin: 0.1875rem
        padding: 0
        width: calc(100% / 7 - 0.375rem)
        height: (40 / 16)rem
        border: none

        &.other-month
          color: $text-secondary

</style>
