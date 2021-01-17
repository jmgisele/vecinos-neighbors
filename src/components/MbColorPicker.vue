<template lang="html">
  <button class="color-picker" :class="{ dark }" @click="activate">
    <div class="color-swatch">
      <div v-show="Boolean(modelValue)" class="old-color" :style="{ backgroundImage: `linear-gradient(to right, ${currentColorNoAlpha} 50%, ${modelValue} 50%)` }" />
      <transition @after-leave="updateModel">
        <div v-show="popover.show && newColor && newColor !== modelValue" class="new-color" :class="{ cancelled: newColor === modelValue || (removable && !modelValue && workingColor.a === 0) }">
          <div v-show="colorCache || !removable || workingColor.a !== 0" class="color" :style="{ backgroundImage: `linear-gradient(to right, ${colorCache ? colorCache.colorNoAlpha : newColorNoAlpha} 50%, ${colorCache ? colorCache.color : newColor} 50%)` }" />
        </div>
      </transition>
    </div>
    <span>{{modelValue || 'No Color'}}</span>
    <MbPopover center-x class="color-popover" :dark="dark" no-content-padding ref="popover" :style="{ minWidth: `${popover.minWidth}px`}" :visible="popover.show" :x="popover.x" :y="popover.y" @close="deactivate" @focusout="handleFocusout">
      <div class="padder">
        <div class="saturation-picker" ref="saturationPicker" :style="{backgroundColor: saturationPickerBG}" @pointerdown="activateSaturationPicker" @touchstart.stop>
          <div class="saturation" />
          <div class="picker" :style="{top: saturationTop, left: saturationLeft}" />
        </div>
        <div class="hue-picker" ref="huePicker" @pointerdown="activateHuePicker" @touchstart.stop>
          <div class="hue" />
          <div class="picker" :style="{left: hueLeft}" />
        </div>
        <div v-if="format === 'rgba'" class="alpha-picker" ref="alphaPicker" @pointerdown="activateAlphaPicker" @touchstart.stop>
          <div class="alpha" :style="{ backgroundImage: `linear-gradient(to right, transparent, ${newColorNoAlpha})` }"/>
          <div class="picker" :style="{left: alphaLeft}" />
        </div>
        <div class="color-info" :class="[format, {removable}]">
          <div class="color-swatch">
            <div v-show="colorCache || !removable || workingColor.a !== 0" class="color" :style="{ backgroundImage: `linear-gradient(45deg, ${colorCache ? colorCache.colorNoAlpha : newColorNoAlpha} 50%, ${colorCache ? colorCache.color : newColor} 50%)` }" />
          </div>
          <MbInput v-model="colorInput" :dark="dark" :error="colorError" icon="hash" placeholder="Color" @blur="handleColorInput" @keyup.enter="handleColorInput" />
          <MbButton v-if="removable" :dark="dark" icon="cross" rounded :tooltip="{ message: 'Clear Color', position: 'right' }" @click="clearColor" />
        </div>
      </div>
      <template #footer>
        <MbButton :dark="dark" @click="deactivate(false)">Cancel</MbButton>
        <MbButton :dark="dark" type="primary" @click="deactivate(true)">Set Color</MbButton>
      </template>
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
    alphaLeft() {
      return `${this.workingColor.a * 100}%`;
    },
    currentColorNoAlpha() {
      return tinycolor(this.modelValue).toHexString();
    },
    newColorNoAlpha() {
      return tinycolor(this.workingColor).toHexString();
    },
    hueLeft() {
      return `${(this.workingColor.h / 360) * 100}%`;
    },
    newColor() {
      if (!this.workingColor) return null;
      if (this.format === 'hex') return tinycolor(this.workingColor).toHexString();
      if (this.format === 'rgb') return tinycolor(this.workingColor).setAlpha(1).toRgbString();
      return tinycolor(this.workingColor).toRgbString();
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
      colorCache: null,
      colorError: '',
      colorInput: this.modelValue,
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
      if (this.popover.show) return;
      const rect = this.$el.getBoundingClientRect();
      const remBase = Number.parseInt(window.getComputedStyle(document.documentElement).fontSize, 10);
      this.popover.x = rect.left + rect.width / 2;
      this.popover.y = rect.bottom + 0.5 * remBase;
      this.popover.minWidth = Math.min(rect.width, window.innerWidth - remBase);
      window.addEventListener('scroll', this.deactivate, { capture: true, passive: true });

      this.workingColor = tinycolor(this.modelValue).toHsv(); // don’t update using the watcher but upon activation to avoid issues with the hue on desaturated colors

      this.popover.show = true;
    },
    activateHuePicker() {
      window.addEventListener('pointermove', this.handleHueInput, { passive: true });
      window.addEventListener('pointerup', this.deactivateHuePicker);
      window.addEventListener('click', this.preventPopoverClose, { capture: true });
      window.addEventListener('touchend', this.preventPopoverClose, { capture: true }); // needed because on touchscreens it doesn’t actually fire a click event on window when the touch is released
    },
    activateAlphaPicker() {
      window.addEventListener('pointermove', this.handleAlphaInput, { passive: true });
      window.addEventListener('pointerup', this.deactivateAlphaPicker);
      window.addEventListener('click', this.preventPopoverClose, { capture: true });
      window.addEventListener('touchend', this.preventPopoverClose, { capture: true }); // needed because on touchscreens it doesn’t actually fire a click event on window when the touch is released
    },
    activateSaturationPicker() {
      window.addEventListener('pointermove', this.handleSaturationInput, { passive: true });
      window.addEventListener('pointerup', this.deactivateSaturationPicker);
      window.addEventListener('click', this.preventPopoverClose, { capture: true });
      window.addEventListener('touchend', this.preventPopoverClose, { capture: true }); // needed because on touchscreens it doesn’t actually fire a click event on window when the touch is released
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
    clearColor() {
      this.workingColor = { h: 0, s: 0, v: 100, a: 0 }; // eslint-disable-line object-curly-newline
      this.$nextTick(() => { this.colorInput = ''; }); // wait a tick so it doesn’t get overwritten by the watcher
    },
    deactivate(confirm) {
      window.removeEventListener('scroll', this.deactivate, { capture: true, passive: true });
      this.popover.show = false;
      if (!confirm) {
        this.colorCache = {
          color: this.newColor,
          colorNoAlpha: this.newColorNoAlpha,
        };
        this.workingColor = this.modelValue ? tinycolor(this.modelValue).toHsv() : { h: 0, s: 0, v: 100, a: 0 }; // eslint-disable-line object-curly-newline
      }
      this.$el.focus();
    },
    deactivateAlphaPicker(e) {
      this.handleAlphaInput(e);
      window.removeEventListener('pointermove', this.handleAlphaInput);
      window.removeEventListener('pointerup', this.deactivateAlphaPicker);
    },
    deactivateHuePicker(e) {
      this.handleHueInput(e);
      window.removeEventListener('pointermove', this.handleHueInput);
      window.removeEventListener('pointerup', this.deactivateHuePicker);
    },
    deactivateSaturationPicker(e) {
      this.handleSaturationInput(e);
      window.removeEventListener('pointermove', this.handleSaturationInput);
      window.removeEventListener('pointerup', this.deactivateSaturationPicker);
    },
    handleFocusout(e) {
      if (e.relatedTarget !== this.$el && !this.$refs.popover.$refs.el.contains(e.relatedTarget)) this.deactivate();
    },
    handleAlphaInput: throttle(function (e) { // eslint-disable-line func-names
      const container = this.$refs.alphaPicker;
      const containerRect = container.getBoundingClientRect();

      const left = this.clamp(e.clientX - containerRect.left, 0, containerRect.width);
      const a = this.clamp(left / containerRect.width, 0, 1);
      this.workingColor.a = a;
    }, 20),
    handleColorInput() {
      const color = tinycolor(this.colorInput);
      this.colorError = '';

      if (color.isValid()) this.workingColor = color.toHsv();
      else this.colorError = 'Invalid Color';
    },
    handleHueInput: throttle(function (e) { // eslint-disable-line func-names
      const container = this.$refs.huePicker;
      const containerRect = container.getBoundingClientRect();

      const left = this.clamp(e.clientX - containerRect.left, 0, containerRect.width);
      const h = 360 * this.clamp(left / containerRect.width, 0, 360);
      this.workingColor.h = h;
    }, 20),
    handleSaturationInput: throttle(function (e) { // eslint-disable-line func-names
      const container = this.$refs.saturationPicker;
      const containerRect = container.getBoundingClientRect();

      const left = this.clamp(e.clientX - containerRect.left, 0, containerRect.width);
      const top = this.clamp(e.clientY - containerRect.top, 0, containerRect.height);

      const s = left / containerRect.width;
      const v = this.clamp(-(top / containerRect.height) + 1, 0, 1);

      this.workingColor.s = s;
      this.workingColor.v = v;
    }, 20),
    preventPopoverClose(e) {
      e.stopPropagation();
      window.removeEventListener('click', this.preventPopoverClose, { capture: true });
      window.removeEventListener('touchend', this.preventPopoverClose, { capture: true });
    },
    updateModel() {
      if (this.removable && this.workingColor.a === 0) this.$emit('update:modelValue', null);
      else this.$emit('update:modelValue', this.newColor); // newColor already has the appropriate format
      this.colorCache = null;
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
  watch: {
    newColor(nv) {
      if (this.colorError) this.colorError = '';
      this.colorInput = nv;
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

$checkerboardBG(color, size = 1rem)
  background-image: linear-gradient(to right, color, color), linear-gradient(to right, black 50%, white 50%), linear-gradient(to bottom, black 50%, white 50%)
  background-size: size size
  background-blend-mode: normal, difference

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
    $checkerboardBG(alpha(white, 0.75), @width / 2)
    position: relative
    overflow: hidden
    flex-shrink: 0
    padding: 0.0625rem
    background-clip: content-box

    .old-color,
    .new-color
      position: absolute
      top: 0
      left: 0
      width: 100%
      height: 100%

    .new-color
      top: auto
      bottom: 0
      $checkerboardBG(alpha(white, 0.75), @width / 2)
      transform: translateY(50%)
      padding: 0 0.0625rem
      background-clip: content-box

      &.v-enter-active,
      &.v-leave-active
        transition: transform 150ms ease

        &.v-enter-from
          transform: translateY(100%)

        &.v-leave-to
          transform: translateY(0)

          &.cancelled
            transform: translateY(100%)

      .color
        position: absolute
        top: 0
        left: 0
        width: 100%
        height: 100%

  span
    overflow: hidden
    width: 100%
    text-overflow: ellipsis

.color-popover
  .padder
    padding: 0.5rem

    .saturation-picker
      position: relative
      height: 8rem
      margin-bottom: 0.5rem
      border-radius: $radius-m
      touch-action: none

      .saturation
        position: absolute
        top: 0
        left: @top
        right: @top
        bottom: @top
        border-radius: $radius-m
        pointer-events: none

      .saturation
        background-image: linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0))

    .hue-picker,
    .alpha-picker
      position: relative
      height: 1.5rem
      margin-bottom: 0.5rem
      touch-action: none

      .hue,
      .alpha
        height: 100%
        border-radius: $radius-m
        background-image: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
        pointer-events: none

    .alpha-picker
      $checkerboardBG(alpha(white, 0.75), 0.75rem)
      border-radius: $radius-m
      padding: 0.0625rem
      background-clip: content-box

      .alpha
        position: absolute
        top: 0
        bottom: 0
        left: 0
        right: 0

    .picker
      border: 0.125rem solid white
      width: 0.75rem
      height: @width
      border-radius: 0.5rem
      position: absolute
      left: 0
      top: 50%
      transform: translate(-50%, -50%)
      box-shadow: 0 0 0 0.0625rem alpha(black, 0.5)

    .color-info
      display: flex
      align-items: center
      max-width: 16rem

      &.rgb
        &.removable
          max-width: 19rem

      &.rgba
        max-width: 19rem

        &.removable
          max-width: 22rem

      .color-swatch
        box-shadow: 0 0 0 0.0625rem $text-secondary
        flex-shrink: 0
        width: (40 / 16)rem // height of the smaller input minus shadow
        height: @width
        border-radius: 50%
        margin-right: 0.5rem
        overflow: hidden
        $checkerboardBG(alpha(white, 0.75), 0.75rem)
        padding: 0.0625rem
        background-clip: content-box
        position: relative

        .color
          position: absolute
          top: 0
          left: 0
          width: 100%
          height: @width

      .input
        flex-shrink: 1
        padding: 0.5rem
        margin-top: 0
        transition: margin 150ms ease
        width: 100%

        &.dark
          background-color: $bg-tertiary-dark

        &.error
          margin-top: 1rem

          &::v-deep(span)
            transform: translate((-3rem + $radius-m), calc(-100% - 0.5rem)) scale(0.75)

      .button
        margin-left: 0.5rem
</style>
