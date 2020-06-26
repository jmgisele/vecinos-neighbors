<template lang="html">
  <div class="tabs">
    <transition-group ref="tabs" tag="ul" @after-leave="resetActiveTab">
      <li v-for="(tab, index) in tabs" :data-index="index" :key="tab.value || tab" tabindex="0" @click.left="activateTab($event, index)" @keyup.enter="activateTab($event, index)" @keyup.space="activateTab($event, index)">{{tab.label || tab}}</li>
      <li v-if="showAddOption" key="mbTabsAddOption" tabindex="0" @click="addTab" @keyup.space="addTab" @keyup.enter="addTab">+</li>
    </transition-group>
    <div class="active-indicator" :style="{ transform: indicatorTransform }"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      mounted: false,
    };
  },
  computed: {
    indicatorTransform() {
      if (!this.mounted || !this.$refs.tabs) return 'translateX(0) scaleX(0)';

      const tabElement = this.$refs.tabs.$el.children[this.value];
      if (!tabElement) return 'translateX(0) scaleX(0)';

      const translate = tabElement.offsetLeft;
      const scale = tabElement.offsetWidth / 10; // 10 is the initial width of the active-indicator element in px
      return `translateX(${translate}px) scaleX(${scale})`;
    },
  },
  methods: {
    activateTab(e, index) {
      this.$emit('input', index);
      this.scrollTabIntoView(e.currentTarget);
    },
    addTab() {
      this.$emit('add-tab');
      this.$nextTick(() => this.scrollTabIntoView(this.$refs.tabs.$el.lastChild));
    },
    resetActiveTab(el) {
      const activeTabBackup = this.value;
      if (el.dataset.index > activeTabBackup) this.$emit('input', activeTabBackup);
      else this.$emit('input', Math.max(0, activeTabBackup - 1));
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
    showAddOption: Boolean,
    tabs: Array,
    value: Number,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'

.tabs
  position: relative
  box-shadow: inset 0 -2px 0 0 $bg-secondary
  white-space: nowrap
  max-width: 100%
  overflow-x: auto
  overflow-y: hidden
  scrollbar-width: none
  -ms-overflow-style: none
  user-select: none

  &::-webkit-scrollbar
    display: none

  > ul
    margin: 0
    width: 100%
    border-bottom: none
    list-style: none
    padding: 0

    li
      display: inline-block
      padding: 1rem 1.5rem
      cursor: pointer
      border-top-left-radius: 0.375rem
      border-top-right-radius: @border-top-left-radius
      position: relative
      transition: background-color 200ms ease

      &:hover,
      &:focus
        background-color: $bg-secondary

      &:focus
        outline: none

      &.v-enter-active,
      &.v-leave-active
        transition: transform 200ms ease, opacity 200ms ease

        &.v-enter,
        &.v-leave-to
          transform: translateY(1rem)
          opacity: 0

  .active-indicator
    position: absolute
    width: 10px
    height: 2px
    background-color: $accent
    bottom: 0
    left: 0
    transform-origin: left
    transition: transform 200ms ease
</style>
