<template lang="html">
  <div class="tabs">
    <transition-group ref="tabs" tag="ul" @after-leave="resetActiveTab">
      <li v-for="(tab, index) in tabs" :data-index="index" :key="tab" tabindex="0" @click.left="activateTab(index, $event)" @keyup.enter="activateTab(index, $event)" @keyup.space="activateTab(index, $event)" @click.right.prevent="removeTab(index)">{{tab}}</li>
    </transition-group>
    <div class="active-indicator" :style="{ transform: indicatorTransform }"></div>
  </div>
</template>

<script>
export default {
  data: () => ({
    text: '',
    caretTransform: '',
    activeTab: 0,
    tabs: ['Content', 'Metadata', 'SEO', '+'],
    previousTab: 0,
    idCounter: 1,
  }),
  mounted() {
    const backup = this.activeTab;
    this.activeTab = -1;
    this.activeTab = backup;
  },
  computed: {
    indicatorTransform() {
      const { activeTab } = this;
      if (!this.$refs.tabs) return '';
      const translate = this.$refs.tabs.$el.children[activeTab].offsetLeft;
      const scale = this.$refs.tabs.$el.children[activeTab].offsetWidth / 10;
      return `translateX(${translate}px) scaleX(${scale})`;
    },
  },
  watch: {
    activeTab(nv, ov) {
      this.previousTab = ov;
    },
  },
  methods: {
    activateTab(index, e) {
      if (index === this.tabs.length - 1) {
        this.tabs.splice(this.tabs.length - 1, 0, `Untitled-${this.idCounter}`);
        this.idCounter += 1;
        this.$nextTick(() => {
          this.activeTab = -1;
          this.activeTab = index;
          this.scrollTabIntoView(e.target);
        });
      } else {
        this.activeTab = index;
        this.scrollTabIntoView(e.target);
      }
    },
    removeTab(index) {
      if (index === this.tabs.length - 1) return;
      this.tabs.splice(index, 1);
    },
    resetActiveTab(el) {
      const activeTabBackup = this.activeTab;
      this.activeTab = -1;
      if (el.dataset.index > activeTabBackup) this.activeTab = activeTabBackup;
      else this.activeTab = Math.max(0, activeTabBackup - 1);
    },
    scrollTabIntoView(el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    },
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
