<template lang="html">
  <button class="color-picker" :class="{ dark }" @click="activate">
    <div class="color-swatch">
      <div class="old-color" :style="{ backgroundColor: modelValue }" />
      <transition @after-leave="updateModel">
        <div v-show="popover.show && newColor && newColor !== modelValue" class="new-color" :style="{ backgroundColor: newColor }" />
      </transition>
    </div>
    <span>{{modelValue}}</span>
    <MbPopover center-x class="color-popover" :dark="dark" no-content-padding :style="{ minWidth: `${popover.minWidth}px`}" :visible="popover.show" :x="popover.x" :y="popover.y" @close="deactivate" @focusout="handleFocusout">
      <div class="padder">
        <div class="saturation-picker" ref="saturationPicker" :style="{backgroundColor: saturationPickerBG}" @pointerdown="activateSaturationPicker" @touchstart.stop>
          <div class="saturation-white" />
          <div class="saturation-black" />
          <div class="picker" :style="{top: saturationTop, left: saturationLeft}" />
        </div>
        <div class="hue-picker" ref="huePicker" @pointerdown="activateHuePicker" @touchstart.stop>
          <div class="hue" />
          <div class="picker" :style="{left: hueLeft}" />
        </div>
      </div>
    </MbPopover>
  </button>
</template>

<script>
import { throttle } from 'lodash-es';
import tinycolor from 'tinycolor2';

export default {
  beforeUnmount() {
    window.removeEventListener('scroll', this.deactivate, { capture: true, passive: true });
  },
  computed: {
    hueLeft() {
      return `${(this.workingColor.h / 360) * 100}%`;
    },
    newColor() {
      if (!this.workingColor) return null;
      if (this.format === 'hex') return tinycolor(this.workingColor).toHexString();
      if (this.format === 'rgb') return tinycolor(this.workingColor).setAlpha(1);
      return tinycolor(this.workingColor).toRgbString();
    },
    isColorInvalid() {
      return tinycolor(this.colorInput).isValid() ? '' : 'Invalid color';
    },
    saturationLeft() {
      return `${this.workingColor.s * 100}%`;
    },
    saturationPickerBG() {
      return `hsl(${this.workingColor.h}, 100%, 50%)`;
    },
    saturationTop() {
      return `${-this.workingColor.v * 100 + 100}%`;
    },
  },
  data() {
    return {
      colorInput: this.modelValue,
      currentColor: null,
      popover: {
        minWidth: 0,
        show: false,
        x: 0,
        y: 0,
      },
      workingColor: tinycolor(this.modelValue).toHsv(),
    };
  },
  methods: {
    activate() {
      const rect = this.$el.getBoundingClientRect();
      const remBase = Number.parseInt(window.getComputedStyle(document.documentElement).fontSize, 10);
      this.popover.x = rect.left + rect.width / 2;
      this.popover.y = rect.bottom + 0.5 * remBase;
      this.popover.minWidth = Math.min(rect.width, window.innerWidth - remBase);
      window.addEventListener('scroll', this.deactivate, { capture: true, passive: true });

      this.workingColor = tinycolor(this.value).toHsv(); // don’t update using the watcher but upon activation to avoid issues with the hue on desaturated colors

      this.popover.show = true;
    },
    activateHuePicker() {
      if (window.PointerEvent) {
        window.addEventListener('pointermove', this.handleHueInput, { passive: true });
        window.addEventListener('pointerup', this.deactivateHuePicker);
      } else {
        window.addEventListener('mousemove', this.handleHueInput, { passive: true });
        window.addEventListener('mouseup', this.deactivateHuePicker);
      }
    },
    activateSaturationPicker() {
      if (window.PointerEvent) {
        window.addEventListener('pointermove', this.handleSaturationInput, { passive: true });
        window.addEventListener('pointerup', this.deactivateSaturationPicker);
      } else {
        window.addEventListener('mousemove', this.handleSaturationInput, { passive: true });
        window.addEventListener('mouseup', this.deactivateSaturationPicker);
      }
    },
    clamp(value, min, max) {
      if (min < max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
      }
      if (value < max) return max;
      if (value > min) return min;
      return value;
    },
    deactivate() {
      window.removeEventListener('scroll', this.deactivate, { capture: true, passive: true });
      this.popover.show = false;
      this.$el.focus();
    },
    deactivateHuePicker(e) {
      this.handleHueInput(e);
      if (window.PointerEvent) {
        window.removeEventListener('pointermove', this.handleHueInput);
        window.removeEventListener('pointerup', this.deactivateHuePicker);
      } else {
        window.removeEventListener('mousemove', this.handleHueInput);
        window.removeEventListener('mouseup', this.deactivateHuePicker);
      }
    },
    deactivateSaturationPicker(e) {
      this.handleSaturationInput(e);
      if (window.PointerEvent) {
        window.removeEventListener('pointermove', this.handleSaturationInput);
        window.removeEventListener('pointerup', this.deactivateSaturationPicker);
      } else {
        window.removeEventListener('mousemove', this.handleSaturationInput);
        window.removeEventListener('mouseup', this.deactivateSaturationPicker);
      }
    },
    handleFocusout(e) {
      if (!this.$el.contains(e.relatedTarget)) this.deactivate();
    },
    handleHueInput: throttle(function (e) { // eslint-disable-line func-names
      const container = this.$refs.huePicker;
      const containerRect = container.getBoundingClientRect();

      const left = this.clamp(e.clientX - containerRect.left, 0, containerRect.width);
      const h = 360 * this.clamp(left / containerRect.width, 0, 360);
      const { s, v } = this.workingColor;

      const hexString = tinycolor({ h, s, v }).toHexString();

      this.workingColor.h = h;
      this.$emit('input', hexString);
    }, 20),
    handleSaturationInput: throttle(function (e) { // eslint-disable-line func-names
      const container = this.$refs.saturationPicker;
      const containerRect = container.getBoundingClientRect();

      const left = this.clamp(e.clientX - containerRect.left, 0, containerRect.width);
      const top = this.clamp(e.clientY - containerRect.top, 0, containerRect.height);

      const { h } = this.workingColor;
      const s = left / containerRect.width;
      const v = this.clamp(-(top / containerRect.height) + 1, 0, 1);
      const hexString = tinycolor({ h, s, v }).toHexString();

      this.workingColor.s = s;
      this.workingColor.v = v;
      this.$emit('input', hexString);
    }, 20),
    updateModel() {
      this.$emit('update:modelValue', this.newColor);
    },
  },
  props: {
    dark: Boolean,
    format: {
      type: String,
      default: 'hex',
      validator: (v) => ['hex', 'rgb', 'rgba'].includes(v),
    },
    modelValue: String,
    palette: Array,
    paletteOnly: Boolean,
    removable: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.color-picker
  position: relative
  border: none
  background-color: $bg-secondary
  color: inherit
  border-radius: $radius-m
  padding: 0.5rem
  padding-right: 1.5rem
  display: inline-flex
  align-items: center
  cursor: pointer
  transition: background-color 200ms ease

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

  .color-swatch
    border-radius: $radius-s
    width: 2.625rem
    height: @width
    margin-right: 1rem
    background-image: linear-gradient(45deg, $text-tertiary 25%, transparent 25%), linear-gradient(-45deg, $text-tertiary 25%, transparent 25%), linear-gradient(45deg, transparent 75%, $text-tertiary 75%), linear-gradient(-45deg, transparent 75%, $text-tertiary 75%);
    background-size: 1rem 1rem;
    background-position: 0 0, 0 0.5rem, 0.5rem -0.5rem, -0.5rem 0;
    position: relative
    overflow: hidden

    .old-color,
    .new-color
      position: absolute
      top: 0
      left: 0
      width: 100%
      height: 100%

    .new-color
      left: auto
      right: 0
      width: 50%
      transform-origin: right

      &.v-enter-active,
      &.v-leave-active
        transition: transform 150ms ease

        &.v-enter-from
          transform: scaleX(0)

        &.v-leave-to
          transform: scaleX(2)

.color-popover
  .padder
    padding: 0.5rem

    .saturation-picker
      position: relative
      height: 8rem
      margin-bottom: 0.375rem
      border-radius: 0.375rem
      touch-action: none

      .saturation-white,
      .saturation-black
        position: absolute
        top: 0
        left: @top
        right: @top
        bottom: @top
        border-radius: 0.375rem
        pointer-events: none

      .saturation-white
        background-image: linear-gradient(to right, #fff, rgba(255,255,255,0));

      .saturation-black
        background-image: linear-gradient(to top, #000, rgba(0,0,0,0));

    .hue-picker
      position: relative
      height: 1.5rem
      margin-bottom: 0.375rem
      touch-action: none

      .hue
        height: 100%
        border-radius: 0.375rem
        background-image: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
        pointer-events: none

    .picker
      border: 0.125rem solid white
      width: 1rem
      height: @width
      border-radius: 0.5rem
      position: absolute
      left: 0
      top: 50%
      transform: translate(-50%, -50%)
      box-shadow: 0 0 0 0.0625rem alpha(black, 0.5)
</style>
