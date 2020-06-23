<template lang="html">
  <div class="tab-wrapper">
    <transition-group class="tabs" ref="tabs" tag="ul" @after-leave="resetActiveTab">
      <li v-for="(tab, index) in tabs" :key="tab" tabindex="0" @click.left="activateTab(index, $event)" @keyup.enter="activateTab(index, $event)" @keyup.space="activateTab(index, $event)" @click.right.prevent="removeTab(index)">{{tab}}</li>
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
    tabs: ['Frontmatter', 'Content', 'SEO', '+'],
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
    resetActiveTab(index) {
      if (this.activeTab === index) {
        this.activeTab = -1;
        this.activeTab = Math.max(0, index - 1);
      } else if (this.activeTab > this.tabs.length - 2) {
        this.activeTab = -1;
        this.activeTab = Math.max(0, this.tabs.length - 2);
      } else {
        const backup = this.activeTab;
        this.activeTab = -1;
        this.activeTab = backup;
      }
    },
    scrollTabIntoView(el) {
      el.scrollIntoView({ behavior: 'smooth' });
    },
  },
};
</script>

<style lang="stylus" scoped>
.tabs
  list-style: none
  border-bottom: 2px solid #f4f3ff
  padding: 0

  li
    /* background-color: #f4f3ff */
    display: inline-block
    padding: 1rem 1.5rem
    cursor: pointer
    border-radius: 6px
    position: relative

    &:hover,
    &:focus
      background-color: #f4f3ff

    &:focus
      outline: none

    &.origin-left::after
        transform-origin: left

    &.active::after
      transform: none

    &::after
      content: ''
      position: absolute
      width: 100%
      height: 2px
      bottom: -2px
      left: 0
      border-radius: 1px
      background-color: #6c5ce7
      transform-origin: right
      transition: transform 200ms ease
      transform: scaleX(0)

.tab-wrapper
  position: relative
  box-shadow: inset 0 -2px 0 0 #f4f3ff
  white-space: nowrap
  max-width: 100%
  overflow-x: auto
  scrollbar-width: none
  -ms-overflow-style: none

  &::-webkit-scrollbar
    display: none

  .tabs
    margin: 0
    width: 100%
    border-bottom: none

    .v-enter-active,
    .v-leave-active
      transition: transform 200ms ease, opacity 200ms ease

      &.v-enter,
      &.v-leave-to
        transform: translateY(1rem)
        opacity: 0

  .active-indicator
    position: absolute
    width: 10px
    height: 2px
    background-color: #6c5ce7
    bottom: 0
    left: 0
    transform-origin: left
    transition: transform 200ms ease
</style>
