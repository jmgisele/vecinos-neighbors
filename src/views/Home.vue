<template>
  <div class="home">
    <h1>Components</h1>
    <MbTabs v-model="activeTab" :dark="dark" :tabs="tabTest" show-add-option @add-tab="addTab" />
    <transition mode="out-in">
      <section v-if="activeTabValue === 'design'" class="tab" key="design">
        <div class="swatches">
          <div v-for="swatch in swatches" :key="swatch" class="swatch-wrapper">
            <div class="swatch" :class="[swatch]">Aa</div>
            <span>{{swatch}}</span>
          </div>
        </div>
        <div class="typography">
          <h1>This is a H1</h1>
          <h2>Which will usually be followed by a H2</h2>
          <p>And then some normal text. Which will look somewhat like this and be a bit wider than normal headlines, which really shouldn’t break the line if at all possible.</p>
          <h2>Another H2</h2>
          <h3>Which will in rarer cases be followed by an H3.</h3>
          <p>Before there’s another paragraph of text.</p>
          <p>Paragraphs are spaced well as well. And obviously they should be pleasant to read. I <em>thought</em> about increasing their size for legibility reasons, but I still feel like UI controls should stick to classic 16px base sizes, we’re not writing a webpage after all.</p>
          <ul>
            <li>There might also be lists</li>
            <li>Both of the <strong>unordered</strong></li>
            <li>And of the <strong>ordered</strong> kinds</li>
          </ul>
          <p>This is how an ordered list would look like after a paragraph:</p>
          <ol>
            <li>First Point</li>
            <li>Second Point</li>
            <li>And last but not least: Third Point</li>
          </ol>
          <p>There’s also the rare chance that Blockqoutes might be used. They would look as follows:</p>
          <blockquote>
            <p>This is a very ominous quote. I should make it longer so it is better visible. And perhaps also make it wrap the line.</p>
            <footer>It can also quote someone.</footer>
          </blockquote>
          <p>There might also be, on rare occasions, <a href="#">Links</a>. They should stand out, but not too much.</p>
          <p>Speaking of rare occasions, it wouldn’t hurt to style code blocks and inline code, would it? So this is what <code>inline code</code> looks like.</p>
          <pre>
            <code>And here</code>
            <code>We have some more code in a block.</code>
            <code>Without syntax highlighting, of course.</code>
          </pre>
          <p>And last, but not least (for now), we probably need a way to show keyboard shortcuts like <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Enter</kbd>, too.</p>
        </div>
      </section>
      <section v-else-if="activeTabValue === 'tabs'" class="tab" key="tabs">
        <p>The active tab is: {{activeTabValue}}</p>
        <button type="button" @click="removeTab">Delete Last Demo Tab</button>
      </section>
      <section v-else-if="activeTabValue === 'inputs'" class="tab" key="inputs">
        <MbInput v-model="textTest" />
        <MbInput v-model="textTest" label="Hi there!" type="password" />
      </section>
      <section v-else class="tab" key="exampleTab">
        <p>This is just an empty test-tab.</p>
      </section>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'Home',
  computed: {
    activeTabValue() {
      return this.tabTest[this.activeTab] && (this.tabTest[this.activeTab].value || this.tabTest[this.activeTab]);
    },
  },
  data() {
    return {
      activeTab: 0,
      idCounter: 0,
      swatches: [
        'accent',
        'accent-secondary',
        'text',
        'text-secondary',
        'text-tertiary',
        'bg',
        'bg-secondary',
        'bg-tertiary',
        'negative',
        'negative-saturated',
        'positive',
        'positive-saturated',
        'warning',
        'warning-saturated',
      ],
      tabTest: [{ label: 'Styles and Colors', value: 'design' }, { label: 'Tabs', value: 'tabs' }, { label: 'Inputs', value: 'inputs' }],
      textTest: '',
    };
  },
  methods: {
    addTab() {
      this.idCounter += 1;
      this.tabTest.push({ label: `Untitled-${this.idCounter}`, value: `untitled-${this.idCounter}` });
      this.$nextTick(() => {
        this.activeTab = this.tabTest.length - 1;
      });
    },
    removeTab() {
      const lastTab = this.tabTest[this.tabTest.length - 1];
      if (lastTab.value.startsWith('untitled')) this.tabTest.pop();
    },
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/breakpoints'
@require '../assets/styles/colors'

.home
  padding: 2rem

  > h1
    margin-top: 0
    margin-bottom: 1rem

  .tabs
    margin-left: -2rem
    margin-right: -2rem
    max-width: calc(100% + 4rem)
    position: sticky
    top: 0
    z-index: 1

  .tab
    max-width: 40rem
    margin: 0 auto
    padding: 8rem 0

    &.v-enter-active,
    &.v-leave-active
      transition: opacity 200ms ease

      &.v-enter,
      &.v-leave-to
        opacity: 0

    .swatches
      display: grid
      grid-template-columns: repeat(2, 1fr)

      @media $mobile
        display: block

    .swatch-wrapper
      display: inline-block

      @media $mobile
        display: block

      &:not(:last-child)
        margin-bottom: 1rem

      .swatch
        display: inline-flex
        width: 4rem
        height: @width
        border-radius: (@width / 2)rem
        border: 1px solid $bg-secondary
        justify-content: center
        align-items: center
        margin-right: 1rem

        &.accent
          background-color: $accent
          color: $bg

        &.accent-secondary
          background-color: $accent-secondary

        &.text
          background-color: $text
          color: $bg

        &.text-secondary
          background-color: $text-secondary

        &.text-tertiary
          background-color: $text-tertiary

        &.bg
          background-color: $bg

        &.bg-secondary
          background-color: $bg-secondary

        &.bg-tertiary
          background-color: $bg-tertiary

        &.negative
          background-color: $negative

        &.negative-saturated
          background-color: $negative-saturated
          color: $bg

        &.positive
          background-color: $positive

        &.positive-saturated
          background-color: $positive-saturated
          color: $bg

        &.warning
          background-color: $warning

        &.warning-saturated
          background-color: $warning-saturated

    .typography
      margin-top: 4rem
</style>
