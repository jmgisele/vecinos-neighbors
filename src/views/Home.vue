<template>
  <div class="home">
    <header>
      <h1>Components</h1>
      <MbToggle v-model="darkMode" :dark="dark" :icons="['sun', 'moon']" />
    </header>
    <MbTabs v-model="activeTab" :dark="dark" :tabs="tabs" show-add-option @add-tab="addTab" />
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
        <h2>Tabs</h2>
        <p>For a usage-example see the tab strip above.</p>
        <p>The active tab is: {{activeTabValue}}</p>
        <h3>Props</h3>
        <MbTable :data="props.tabs" />
        <h3>Events</h3>
        <MbTable :data="events.tabs" />
        <h3>Notes</h3>
        <p>If the <code>add-tab</code> prop is set to <code>true</code> the last tab will always contain a “Plus”-icon for adding a new tab.</p>
        <p>Clicking this tab will <strong>not</strong> automatically create a new tab, it will only send an event, so the parent can handle tab creation as it sees fit.</p>
        <MbButton :dark="dark" rounded type="negative" @click="removeTab">Delete Last Demo Tab</MbButton>
      </section>
      <section v-else-if="activeTabValue === 'inputs'" class="tab inputs" key="inputs">
        <MbInput v-model="textTest" :dark="dark" label="Label" placeholder="Placeholder" />
        <MbInput v-model="textTest" :dark="dark" error="With Error" label="Test" />
        <MbInput v-model="textTest" :dark="dark" icon="plus" label="With Icon" type="password" />
        <MbInput v-model="textTest" :dark="dark" placeholder="Just a placeholder" />
        <MbInput v-model="textTest" :dark="dark" label="Just a Label" />
        <MbInput v-model="textTest" :dark="dark" disabled placeholder="mattrbld" label="Disabled" />
        <h3>Props</h3>
        <MbTable :data="props.inputs" />
        <h3>Events</h3>
        <MbTable :data="events.inputs" />
      </section>
      <section v-else-if="activeTabValue === 'buttons'" class="tab buttons" key="buttons">
        <h2>Buttons</h2>
        <MbButton :dark="dark">Secondary Button</MbButton>
        <MbButton :dark="dark" type="primary">Primary Button</MbButton>
        <MbButton :dark="dark" rounded>Rounded Button</MbButton>
        <MbButton :dark="dark" type="positive">Positive Button</MbButton>
        <MbButton :dark="dark" type="negative">Negative Button</MbButton>
        <MbButton :dark="dark" type="warning">Warning Button</MbButton>
        <MbButton :dark="dark" icon="mattrbld" :icon-first="false">Secondary Button</MbButton>
        <MbButton :dark="dark" icon="mattrbld" rounded type="primary">Primary Button</MbButton>
        <MbButton :dark="dark" icon="mattrbld" />
        <MbButton :dark="dark" icon="mattrbld" rounded />
        <MbButton :dark="dark" disabled icon="mattrbld" />
        <MbButton :dark="dark" disabled icon="mattrbld" type="primary" />
        <MbButton :dark="dark" disabled icon="mattrbld">Disabled Button</MbButton>
        <MbButton :dark="dark" disabled icon="mattrbld" type="negative">Disabled Button</MbButton>
        <h3>Props</h3>
        <MbTable :data="props.buttons" />
        <h3>Events</h3>
        <MbTable :data="events.buttons" />
        <h3>Notes</h3>
        <p>Like with normal buttons, the text between the tags will be used as a label.</p>
        <p>If no label is provided, the button will be styled as an icon button, so an icon should be provided.</p>
      </section>
      <section v-else-if="activeTabValue === 'icons'" class="tab icons" key="icons">
        <h2>Icons</h2>
        <MbIcon v-for="icon in availableIcons" :icon="icon" :key="icon" />
        <h3>Props</h3>
        <MbTable :data="props.icons" />
      </section>
      <section v-else-if="activeTabValue === 'toggles'" class="tab toggles" key="toggles">
        <h2>Toggles</h2>
        <MbToggle v-model="toggleTest" :dark="dark">With Label</MbToggle>
        <MbToggle v-model="toggleTest" :dark="dark" disabled>Disabled</MbToggle>
        <MbToggle v-model="toggleTest" :dark="dark" />
        <MbToggle v-model="toggleTest" :dark="dark" :icons="['sun', 'moon']" />
        <h3>Props</h3>
        <MbTable :data="props.toggles" />
        <h3>Events</h3>
        <MbTable :data="events.toggles" />
        <h3>Notes</h3>
        <p>Supplying text-content between the tags will enable a label for the toggle and make it stretch over the entire width.</p>
        <p>If the <code>icons</code> prop is set, the array should contain two valid icon strings. The first will be used if <code>value === false</code> and the second if <code>value === true</code>.</p>
      </section>
      <section v-else-if="activeTabValue === 'checkboxes'" class="tab checkboxes" key="checkboxes">
        <p>The value is {{toggleTest}}</p>
        <MbCheckbox v-model="toggleTest" :dark="dark">With Label</MbCheckbox>
        <MbCheckbox v-model="toggleTest" :dark="dark" disabled>Disabled</MbCheckbox>
        <MbCheckbox v-model="toggleTest" :dark="dark" />
        <h3>Props</h3>
        <MbTable :data="props.checkboxes" />
        <h3>Events</h3>
        <MbTable :data="events.checkboxes" />
        <h3>Notes</h3>
        <p>Supplying text-content between the tags will enable a label for the checkbox and make it stretch over the entire width.</p>
      </section>
      <section v-else class="tab" key="exampleTab">
        <p>This is just an empty test-tab.</p>
        <p>To delete it, click the button in the “<u @click="activeTab = tabs.findIndex((tab) => tab.value === 'tabs')">Tabs</u>”-tab.</p>
      </section>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'Home',
  computed: {
    activeTabValue() {
      return this.tabs[this.activeTab] && (this.tabs[this.activeTab].value || this.tabs[this.activeTab]);
    },
    darkMode: {
      get() {
        const { theme } = this.$store.state.user;
        if (theme === 'dark') return true;
        if (theme === 'light') return false;
        return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) || false;
      },
      set(v) {
        if (v) this.$store.commit('setUserProperty', { key: 'theme', value: 'dark' });
        else if ((window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) this.$store.commit('setUserProperty', { key: 'theme', value: 'light' });
        else this.$store.commit('setUserProperty', { key: 'theme', value: 'auto' });
      },
    },
  },
  data() {
    return {
      activeTab: 0,
      availableIcons: [
        'check',
        'error',
        'mattrbld',
        'moon',
        'plus',
        'sun',
      ],
      events: {
        buttons: [
          ['Name', 'Data'],
          ['`click`', 'The browser click event'],
        ],
        checkboxes: [
          ['Name', 'Data'],
          ['`input`', '`!value`'],
        ],
        inputs: [
          ['Name', 'Data'],
          ['`blur`', ''],
          ['`focus`', ''],
          ['`input`', 'The new text content'],
        ],
        tabs: [
          ['Name', 'Data'],
          ['`add-tab`', ''],
          ['`input`', 'The index of the new active tab'],
        ],
        toggles: [
          ['Name', 'Data'],
          ['`input`', '`!value`'],
        ],
      },
      idCounter: 0,
      props: {
        buttons: [
          ['Name', 'Type', 'Default', 'Allowed Values'],
          ['`dark`', 'Boolean', '`false`', ''],
          ['`disabled`', 'Boolean', '`false`', ''],
          ['`icon`', 'String', '', 'A valid icon name'],
          ['`icon-first`', 'Boolean', '`true`', ''],
          ['`rounded`', 'Boolean', '`false`', ''],
          ['`type`', 'String', '', 'negative, positive, primary, warning'],
        ],
        checkboxes: [
          ['Name', 'Type', 'Default'],
          ['`dark`', 'Boolean', '`false`'],
          ['`disabled`', 'Boolean', '`false`'],
          ['`value`', 'Boolean', '`false`'],
        ],
        icons: [
          ['Name', 'Type', 'Default'],
          ['`icon`', 'String', "`'mattrbld'`"],
        ],
        inputs: [
          ['Name', 'Type', 'Default'],
          ['`dark`', 'Boolean', '`false`'],
          ['`disabled`', 'Boolean', '`false`'],
          ['`error`', 'String', ''],
          ['`icon`', 'String', ''],
          ['`label`', 'String', ''],
          ['`placeholder`', 'String', ''],
          ['`type`', 'String', "`'text'`"],
        ],
        tabs: [
          ['Name', 'Type', 'Default'],
          ['`dark`', 'Boolean', '`false`'],
          ['`showAddOption`', 'Boolean', '`false`'],
          ['`tabs`', 'Array', '`[]`'],
          ['`value`', 'Number', ''],
        ],
        toggles: [
          ['Name', 'Type', 'Default'],
          ['`dark`', 'Boolean', '`false`'],
          ['`disabled`', 'Boolean', '`false`'],
          ['`icons`', 'Array', ''],
          ['`value`', 'Boolean', '`false`'],
        ],
      },
      swatches: [
        'accent',
        'accent-secondary',
        'text',
        'text-secondary',
        'text-tertiary',
        'bg',
        'bg-secondary',
        'bg-tertiary',
        'text-dark',
        'text-secondary-dark',
        'text-tertiary-dark',
        'bg-dark',
        'bg-secondary-dark',
        'bg-tertiary-dark',
        'negative',
        'negative-saturated',
        'positive',
        'positive-saturated',
        'warning',
        'warning-saturated',
      ],
      tabs: [
        { label: 'Styles and Colors', value: 'design' },
        { label: 'Buttons', value: 'buttons' },
        { label: 'Icons', value: 'icons' },
        { label: 'Inputs', value: 'inputs' },
        { label: 'Tabs', value: 'tabs' },
        { label: 'Toggles', value: 'toggles' },
        { label: 'Checkboxes', value: 'checkboxes' },
      ],
      textTest: '',
      toggleTest: false,
    };
  },
  methods: {
    addTab() {
      this.idCounter += 1;
      this.tabs.push({ label: `Untitled-${this.idCounter}`, value: `untitled-${this.idCounter}` });
      this.$nextTick(() => {
        this.activeTab = this.tabs.length - 1;
      });
    },
    removeTab() {
      const lastTab = this.tabs[this.tabs.length - 1];
      if (lastTab.value.startsWith('untitled')) this.tabs.pop();
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

  > header
    display: flex
    align-items: center
    justify-content: space-between
    margin-bottom: 1rem

    > h1
      margin: 0

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

    .table-wrapper
      @media $mobile
        padding: 0 2rem
        margin-left: -2rem
        margin-right: -2rem

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
          color: $text

        &.bg-secondary
          background-color: $bg-secondary
          color: $text

        &.bg-tertiary
          background-color: $bg-tertiary
          color: $text

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

        &.text-dark
          background-color: $text-dark
          color: $text

        &.text-secondary-dark
          background-color: $text-secondary-dark
          color: $text

        &.text-tertiary-dark
          background-color: $text-tertiary-dark
          color: $text

        &.bg-dark
          background-color: $bg-dark
          color: $text-dark

        &.bg-secondary-dark
          background-color: $bg-secondary-dark
          color: $text-dark

        &.bg-tertiary-dark
          background-color: $bg-tertiary-dark
          color: $text-dark

    .typography
      margin-top: 4rem

    &.buttons
      .button
        margin: 1rem

    &.icons
      .icon
        margin: 0.5rem

    &.toggles
      .toggle
        margin-bottom: 1rem

    &.inputs
      .input
        margin: 1rem

    &.checkboxes
      .checkbox
        margin-bottom: 1rem
</style>
