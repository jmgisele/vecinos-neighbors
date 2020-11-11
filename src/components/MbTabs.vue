<template lang="html">
  <MbScroller class="tabs" :class="{ dark }" ref="scroller">
    <div class="scroll-wrapper">
      <transition-group ref="tabs" tag="ul" @after-leave="resetActiveTab">
        <li v-for="(tab, index) in tabs" :data-index="index" :key="tab.value || tab" tabindex="0" @click.left="activateTab($event, index)" @keyup.enter="activateTab($event, index)" @keyup.space="activateTab($event, index)">{{tab.label || tab}}</li>
        <li v-if="showAddOption" class="add-option" key="mbTabsAddOption" tabindex="0" @click="addTab" @keyup.space="addTab" @keyup.enter="addTab" @mouseenter="handleTooltip" @focus="handleTooltip"><MbIcon icon="plus" /></li>
      </transition-group>
      <div class="active-indicator" :style="{ transform: indicatorTransform }"></div>
    </div>
  </MbScroller>
</template>

<script>
export default {
  computed: {
    indicatorTransform() {
      if (!this.mounted || !this.$refs.tabs) return 'translateX(0) scaleX(0)';

      const tabElement = this.$refs.tabs.$el.children[this.modelValue];
      if (!tabElement) return 'translateX(0) scaleX(0)';

      const translate = tabElement.offsetLeft;
      const scale = tabElement.offsetWidth / 100; // 100 is the initial width of the active-indicator element in px
      return `translateX(${translate}px) scaleX(${scale})`;
    },
  },
  data() {
    return {
      mounted: false,
    };
  },
  emits: ['add-tab', 'update:modelValue'],
  methods: {
    activateTab(e, index) {
      this.$emit('update:modelValue', index);
      this.scrollTabIntoView(e.currentTarget);
    },
    addTab() {
      this.$emit('add-tab');
      this.$nextTick(() => this.scrollTabIntoView(this.$refs.tabs.$el.lastChild));
    },
    handleTooltip(e) {
      this.$store.commit('setTooltip', { message: 'Add new tab', target: e.currentTarget });
    },
    resetActiveTab(el) {
      const activeTabBackup = this.modelValue;
      if (el.dataset.index > activeTabBackup) this.$emit('update:modelValue', activeTabBackup);
      else this.$emit('update:modelValue', Math.max(0, activeTabBackup - 1));

      // the size of the wrapper changed so we should recalculate the shadows
      this.$refs.scroller.toggleScrollShadows();
    },
    scrollTabIntoView(el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    },
  },
  mounted() {
    // needed so the active indicator can update its position
    this.mounted = true;
  },
  props: {
    dark: Boolean,
    showAddOption: Boolean,
    tabs: {
      type: Array,
      default: () => [],
    },
    modelValue: Number,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'
@require '../assets/styles/corners'

.tabs
  position: relative
  color: $text
  background-color: $bg
  box-shadow: inset 0 -2px 0 0 $bg-secondary
  white-space: nowrap
  max-width: 100%
  user-select: none

  &.dark
    color: $text-dark
    background-color: $bg-dark
    box-shadow: inset 0 -2px 0 0 $bg-secondary-dark

    .scroll-wrapper > ul li
      &:hover,
      &:focus
        background-color: $bg-secondary-dark

  .scroll-wrapper
    position: relative

    > ul
      margin: 0
      width: 100%
      list-style: none
      padding: 0

      li
        display: inline-block
        padding: 1rem 1.5rem
        cursor: pointer
        border-top-left-radius: $radius-m
        border-top-right-radius: @border-top-left-radius
        position: relative
        transition: background-color 200ms ease

        &.add-option
          line-height: 0

        &:hover,
        &:focus
          background-color: $bg-secondary

        &:focus
          outline: none

        &.v-enter-active,
        &.v-leave-active
          transition: transform 200ms ease, opacity 200ms ease

          &.v-enter-from,
          &.v-leave-to
            transform: translateY(1rem)
            opacity: 0

    .active-indicator
      position: absolute
      width: 100px
      height: 2px
      background-color: $accent
      bottom: 0
      left: 0
      transform-origin: left
      transition: transform 200ms ease

  ::v-deep(.shadow)
    bottom: 2px
</style>
