<template>
  <div class="components">
    <header>
      <h1>Components</h1>
      <MbToggle v-model="darkMode" :dark="dark" :icons="['sun', 'moon']" />
    </header>
    <MbTabs v-model="activeTab" :dark="dark" :tabs="tabs" show-add-option @add-tab="addTab" />
    <transition mode="out-in">
      <section v-if="activeTabValue === 'design'" class="tab" key="design">
        <h2>Styles and Colors</h2>
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
            <li>Both of the <strong>unordered</strong>
              <ul>
                <li>This is an indented bullet</li>
              </ul>
            </li>
            <li>And of the <strong>ordered</strong> kinds</li>
          </ul>
          <p>This is how an ordered list would look like after a paragraph:</p>
          <ol>
            <li>First Point</li>
            <li>Second Point
              <ol>
                <li>This is and indented numbered item</li>
              </ol>
            </li>
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
        <h2>Inputs</h2>
        <MbInput v-model="textTest" :dark="dark" label="Label" placeholder="Placeholder" />
        <MbInput v-model="textTest" :dark="dark" error="With Error" label="Test" />
        <MbInput v-model="textTest" :dark="dark" icon="plus" label="With Icon" type="password" />
        <MbInput v-model="textTest" :dark="dark" placeholder="Just a placeholder" />
        <MbInput v-model="textTest" :dark="dark" label="Just a Label" />
        <MbInput v-model="textTest" :dark="dark" label="Label and maximum length" :max-len="20" />
        <MbInput v-model="textTest" :dark="dark" placeholder="Just maximum length" :max-len="10" />
        <MbInput v-model="textTest" :dark="dark" disabled placeholder="mattrbld" label="Disabled" />
        <h3>Props</h3>
        <MbTable :data="props.inputs" />
        <h3>Events</h3>
        <MbTable :data="events.inputs" />
      </section>
      <section v-else-if="activeTabValue === 'buttons'" class="tab buttons" key="buttons">
        <h2>Buttons</h2>
        <MbButton :dark="dark">Secondary Button</MbButton>
        <MbButton :dark="dark" :loading="simulateLoading" :tooltip="{ message: 'Bold <kbd>Cmd</kbd> + <kbd>B</kbd> that is going to be really really long', timeout: 200, position: 'top' }" type="primary">Primary Button</MbButton>
        <MbButton :dark="dark" :loading="simulateLoading" rounded :tooltip="{ message: 'Hi there from <strong>left</strong>', timeout: 200, position: 'left' }">Rounded Button</MbButton>
        <MbButton :dark="dark" :loading="simulateLoading" :tooltip="{ message: 'Hi there from <strong>right</strong>', timeout: 200, position: 'right' }" type="positive">Positive Button</MbButton>
        <MbButton :dark="dark" :loading="simulateLoading" :tooltip="{ message: 'Hi there from <strong>bottom</strong>', timeout: 200, position: 'bottom' }" type="negative">Negative Button</MbButton>
        <MbButton :dark="dark" :loading="simulateLoading" type="warning">Warning Button</MbButton>
        <MbButton :dark="dark" icon="mattrbld" :icon-first="false">Secondary Button</MbButton>
        <MbButton :dark="dark" icon="mattrbld" rounded type="primary">Primary Button</MbButton>
        <MbButton :dark="dark" icon="mattrbld" />
        <MbButton :dark="dark" icon="mattrbld" rounded />
        <MbButton :dark="dark" disabled icon="mattrbld" />
        <MbButton :dark="dark" disabled icon="mattrbld" :loading="simulateLoading" type="primary" />
        <MbButton :dark="dark" disabled icon="mattrbld">Disabled Button</MbButton>
        <MbButton :dark="dark" disabled icon="mattrbld" :loading="simulateLoading" type="negative">Disabled Button</MbButton>
        <MbButton :dark="dark" @click="simulateLoading = !simulateLoading">{{ simulateLoading ? 'Stop' : 'Start' }} loading</MbButton>
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
        <p>All of the below icons are automatically fetched and optimized from the <code>@/assets/icons/</code> directory. Hover over them to see their name.</p>
        <MbIcon v-for="icon in availableIcons" :icon="icon" :key="icon" @mouseenter="$store.commit('setTooltip', { message: icon, target: $event.currentTarget })" />
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
        <h2>Checkboxes</h2>
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
      <section v-else-if="activeTabValue === 'tooltips'" class="tab tooltips" key="tooltips">
        <h2>Tooltips</h2>
        <p>Hover the new tab button or other buttons in “Buttons” to see a demo of the tooltips</p>
        <h3>Props</h3>
        <MbTable :data="props.tooltips" />
      </section>
      <section v-else-if="activeTabValue === 'textareas'" class="tab textareas" key="textareas">
        <h2>Textareas / Editors</h2>
        <MbEditor v-model="editorTest" :dark="dark" label="Type something" :max-len="200" output-format="text" />
        <MbEditor v-model="editorTest" :allow-new-lines="false" :dark="dark" label="Type something (no returns)" output-format="text" />
        <MbEditor v-model="editorTest" allow-raw :dark="dark" label="This will output HTML" output-format="html" placeholder="Your Text…" />
        <MbEditor v-model="editorTest" :dark="dark" :formats="{ inline: ['em', 'strike'], block: false }" :format-options="{ allowNestedLists: false, allowQuoteFooters: false, minHeading: 2, maxHeading: 4 }" :input-rule-options="{ autoquotes: '»«›‹'}" label="HTML with limited formats" :max-len="200" output-format="html" />
        <MbEditor v-model="editorTest" allow-raw :dark="dark" disabled label="This will output Markdown" output-format="markdown" />
        <div class="tester" v-html="editorTest" />
        <h3>Props</h3>
        <MbTable :data="props.textareas" />
        <h3>Events</h3>
        <MbTable :data="events.textareas" />
      </section>
      <section v-else-if="activeTabValue === 'loaders'" class="tab loaders" key="loaders">
        <h2>Loaders</h2>
        <MbLoader />
        <MbInlineLoader />
        <h3>Props</h3>
        <p>Loaders don’t support any customization with props at the moment.</p>
      </section>
      <section v-else-if="activeTabValue === 'scrollers'" class="tab scrollers" key="scrollers">
        <h2>Scrollers</h2>
        <p>Scrollers are used to hide scrollbars, but still leave indicators that there’s more content to be scrolled to, like in overflowing editor toolbars and tab bars.</p>
        <p>To facilitate horizontal scrolling on a desktop when no trackpad is available, horizontal scrollers can also be scrolled by clicking &amp; dragging with the left or middle mouse buttons.</p>
        <MbScroller class="horiz">
          <ul>
            <li>First Item</li>
            <li>Second Item</li>
            <li>Third Item</li>
            <li>Fourth Item</li>
            <li>Fifth Item</li>
            <li>Sixth Item</li>
            <li>Seventh Item</li>
            <li>Eighth Item</li>
            <li>Ninth Item</li>
            <li>Tenth Item</li>
          </ul>
        </MbScroller>
        <MbScroller class="vert" direction="vertical">
          <ul>
            <li>First Item</li>
            <li>Second Item</li>
            <li>Third Item</li>
            <li>Fourth Item</li>
            <li>Fifth Item</li>
            <li>Sixth Item</li>
          </ul>
        </MbScroller>
        <h2>Props</h2>
        <MbTable :data="props.scrollers" />
      </section>
      <section v-else-if="activeTabValue === 'popovers'" class="tab popovers" key="popovers">
        <h2>Popovers</h2>
        <p>Popovers form a basic building block for any sort of content that needs to be displayed over other content.</p>
        <MbToggle v-model="centerPopover" :dark="dark">Center Popover</MbToggle>
        <MbToggle v-model="popoverFromRight" :dark="dark">Open Popover from Right</MbToggle>
        <MbButton :dark="dark" type="primary" @click="popover = { x: $event.clientX, y: $event.clientY }">Open Popover</MbButton>
        <MbPopover :center-x="centerPopover" :center-y="centerPopover" :dark="dark" :from-right="popoverFromRight" :visible="Boolean(popover)" :x="popover && popover.x" :y="popover && popover.y" @close="popover = null">
          <template #header>
            <h3>Hello! Looooooooooooooooong</h3>
          </template>
          <p>Hello there!</p>
          <MbPopover :center-x="centerPopover" :center-y="centerPopover" :dark="dark" :from-right="popoverFromRight" :visible="Boolean(popover2)" :x="popover2 && popover2.x" :y="popover2 && popover2.y" @close="popover2 = null">
            <h3>Here’s another one!</h3>
            <p>Cool, right?</p>
          </MbPopover>
          <template #footer>
            <MbButton :dark="dark" @click="popover = null">Cancel</MbButton>
            <MbButton :dark="dark" type="primary" @click="popover2 = { x: $event.clientX, y: $event.clientY }">Add</MbButton>
          </template>
        </MbPopover>
        <h3>Props</h3>
        <MbTable :data="props.popovers" />
        <h3>Events</h3>
        <MbTable :data="events.popovers" />
        <h3>Slots</h3>
        <MbTable :data="slots.popovers" />
        <h3>Notes</h3>
        <p>If <code>stealFocus</code> gets explicitly set to false, the popover will not be focussed on opening (making keyboard shortcuts not work until it’s focussed manually)</p>
      </section>
      <section v-else-if="activeTabValue === 'selects'" class="tab selects" key="selects">
        <h2>Select Boxes</h2>
        <p>The selected value is: {{selectTest}}</p>
        <MbSelect v-model="selectTest" :dark="dark" :options="selectOptions" />
        <MbSelect v-model="selectTest" :dark="dark" filterable :options="selectOptions" />
        <MbSelect v-model="selectTest" :dark="dark" disabled :options="selectOptions" />
        <h3>Props</h3>
        <MbTable :data="props.selects" />
        <h3>Events</h3>
        <MbTable :data="events.selects" />
      </section>
      <section v-else-if="activeTabValue === 'radios'" class="tab radios" key="radios">
        <h2>Radio Groups</h2>
        <p>The selected value is: {{radioTest}}</p>
        <MbRadioGroup v-model="radioTest" :dark="dark" inline :options="['Administrator', 'Editor', 'Developer', 'Writer', 'Cheesemaker', 'Chessplayer']" />
        <MbRadioGroup v-model="radioTest" :dark="dark" :options="[{ label: 'Administrator Label', value: 'Administrator' }, { label: 'Editor Label', value: 'Editor' }, { label: 'Developer Label', value: 'Developer' }]" />
        <h3>Props</h3>
        <MbTable :data="props.radios" />
        <h3>Events</h3>
        <MbTable :data="events.radios" />
        <h3>Notes</h3>
        <p>The <code>options</code>-array can either be an array of values like strings, or an array of objects in the following format:</p>
        <p><code>{ label: 'Option Label', value: optionValue }</code></p>
      </section>
      <section v-else-if="activeTabValue === 'modals'" class="tab modals" key="modals">
        <h2>Modals</h2>
        <p>Modals get displayed over every other piece of content. They put the user in a new mode. They can also be stacked.</p>
        <p>Click the button below to open a modal.</p>
        <MbButton :dark="dark" type="primary" @click="modalVisible = true">Open Modal</MbButton>
        <MbModal :dark="dark" title="Test Modal" :visible="modalVisible" @close="modalVisible = false">
          <p>This is a testing modal.</p>
          <p>The document is in <code>{{$store.state.application.mobile ? 'mobile' : 'desktop'}}</code> mode.</p>
          <template #actions>
            <MbButton :dark="dark" @click="modalVisible = false">Close Me</MbButton>
            <MbButton :dark="dark" type="primary" @click="modalVisible2 = true">Open Nested</MbButton>
          </template>
          <MbModal :dark="dark" title="Nested Modal" :visible="modalVisible2" @close="modalVisible2 = false">
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <p>This is a nested modal for testing purposes.</p>
            <template #actions>
              <MbButton :dark="dark" type="primary" @click="modalVisible3 = true">Open Nested</MbButton>
            </template>
            <MbModal :dark="dark" title="Second Nested Modal" :visible="modalVisible3" @close="modalVisible3 = false">
              <p>This is a nested modal for testing purposes.</p>
              <p>This is a nested modal for testing purposes.</p>
              <p>This is a nested modal for testing purposes.</p>
              <p>This is a nested modal for testing purposes.</p>
              <template #actions>
                <MbButton :dark="dark" type="primary" @click="modalVisible4 = true">Open Nested</MbButton>
              </template>
              <MbModal :dark="dark" title="Third Nested Modal" :visible="modalVisible4" @close="modalVisible4 = false">
                <p>This is a nested modal for testing purposes.</p>
              </MbModal>
            </MbModal>
          </MbModal>
        </MbModal>
        <h3>Props</h3>
        <MbTable :data="props.modals" />
        <h3>Events</h3>
        <MbTable :data="events.modals" />
        <h3>Slots</h3>
        <MbTable :data="slots.modals" />
      </section>
      <section v-else-if="activeTabValue === 'progress-bars'" class="tab progress-bars">
        <h2>Progress Bars</h2>
        <MbProgress :colors="['accent']" :dark="dark" indetermined />
        <MbProgress :dark="dark" label="70%" :progress="0.7" />
        <MbProgress :colors="['positive', 'warning', 'negative']" :dark="dark" label="This is a really long label to prove a point" :progress="0.6" />
        <h3>Props</h3>
        <MbTable :data="props.progressBars" />
        <h3>Note</h3>
        <p>The colours passed in the <code>colors</code> prop should be one of the following:</p>
        <ul>
          <li><code>accent</code></li>
          <li><code>negative</code></li>
          <li><code>positive</code></li>
          <li><code>warning</code></li>
        </ul>
        <p>They correspond to the saturated variants of the same name. The default color (when none are given) is <code>positive</code></p>
        <p>If the array contains more than one item, the bar will be that color based on the progress.</p>
      </section>
      <section v-else-if="activeTabValue === 'context-menus'" class="tab context-menus" @contextmenu.prevent="contextMenu.show = true; contextMenu.x = $event.clientX; contextMenu.y = $event.clientY">
        <h2>Context Menus</h2>
        <p>Press <kbd>RMB</kbd> anywhere here to open a context menu.</p>
        <MbContextMenu :dark="dark" :options="[{ label: 'Hi there', icon: 'plus', type: 'positive' }, { label: 'Not so good', type: 'warning', disabled: true, shortcut: ['ctrl', 'q'] }, { icon: 'arrow-right', label: 'Test', shortcut: ['ctrl', 'alt', 'C'] }]" :show="contextMenu.show" :x="contextMenu.x" :y="contextMenu.y" @close="contextMenu.show = false" />
        <h3>Props</h3>
        <MbTable :data="props.contextMenus" />
        <h3>Events</h3>
        <MbTable :data="events.contextMenus" />
        <h3>Notes</h3>
        <p>The <code>options</code> array should consist of objects with the following properties:</p>
        <pre>{{'{\n  action: Function (required),\n  label: String (required),\n  icon: String,\n  type: String,\n  disabled: Boolean,\n  shortcut: Array // for displaying keyboard shortcuts\n}'}}</pre>
        <p>If a <code>target</code> is provided, it will be focussed if the context menu gets closed.</p>
        <p>If <code>stealFocus</code> gets explicitly set to false, the popover will not be focussed on opening (making keyboard shortcuts not work until it’s focussed manually)</p>
      </section>
      <section v-else-if="activeTabValue === 'file-lists'" class="tab file-lists">
        <h2>File Lists</h2>
        <p>This component is a fully fledged file browser that can display the contents of a folder and offers the ability for custom actions on the files.</p>
        <MbFileList :dark="dark" :file-actions="[{ action: showFileToast, icon: 'folder-open', label: 'Open', foldersOnly: true }, { disabled: true, icon: 'arrow-right', label: 'Move', foldersOnly: true }, { action: softDeleteFile, icon: 'trash', label: 'Delete', type: 'negative' }]" :folders-first="true" :folders-only="false" root="/" show-hidden :action="{ callback: () => $store.commit('addToast', { message: 'Hi there!'}), label: 'Add', icon: 'plus', type: 'positive'}" @fileclick="showFileToast" />
        <h3>Props</h3>
        <MbTable :data="props.fileLists" />
        <h3>Events</h3>
        <MbTable :data="events.fileLists" />
      </section>
      <section v-else-if="activeTabValue === 'tables'" class="tab">
        <h2>Tables</h2>
        <p>This is a simple wrapper component to display tabular data in a responsive fashion.</p>
        <h3>Props</h3>
        <MbTable :data="props.tables" />
        <h3>Notes</h3>
        <p>The data-array should contain one array for each row of data. The headers for the columns will be automatically generated based on the first entry in the array.</p>
        <p>Items in rows besides the first support special strings at the beginning and end of values for formatting them:</p>
        <ul>
          <li><code>`</code> causes the value to be rendered as in a <code>&lt;code /&gt;</code> tag</li>
          <li><code>*</code> causes the value to be rendered as in a <code>&lt;em /&gt;</code> tag</li>
          <li><code>**</code> causes the value to be rendered as in a <code>&lt;strong /&gt;</code> tag</li>
        </ul>
        <p>Table data could look as follows for example:</p>
        <pre data-lang="javascript"><code>{{"const data = [\n  ['Name', 'Type', 'Default'],\n  ['`data`', 'Array', '`[]`'],\n];"}}</code></pre>
      </section>
      <section v-else-if="activeTabValue === 'color-pickers'" class="tab color-pickers">
        <h2>Color Pickers</h2>
        <p>The currently picked color is: <span class="color-preview" :style="{ backgroundColor: currentColor }" />{{currentColor}}</p>
        <MbColorPicker v-model="currentColor" :dark="dark" removable />
        <MbColorPicker v-model="currentColor" :dark="dark" format="rgba" />
        <MbColorPicker v-model="currentColor" :dark="dark" format="rgba" :palette="colorPalette" />
        <MbColorPicker v-model="currentColor" :dark="dark" format="rgba" :palette="colorPalette" palette-only removable />
        <h3>Props</h3>
        <MbTable :data="props.colorPickers" />
        <h3>Events</h3>
        <MbTable :data="events.colorPickers" />
        <h3>Notes</h3>
        <p>If the format is set to <code>rgba</code> a control for the color’s opacity will be shown.</p>
        <p>With the <code>palette</code> prop an array of valid CSS colors may be passed to be displayed under the color selector / as the available colors up for selection if <code>paletteOnly</code> is also active.</p>
        <p>The <code>palette</code> array may also contain objects in the following shape to add named colors:</p>
        <pre data-lang="javascript"><code>{{JSON.stringify([{ label: 'Color Name', value: 'valid CSS color'}, { label: 'Badass', value: '#bada55' }], null, 2)}}</code></pre>
        <p>If <code>removable</code> is set to <code>true</code> an additional option to clear the color will be shown, causing the value to become <code>null</code>.</p>
      </section>
      <section v-else-if="activeTabValue === 'tag-inputs'" class="tab tag-inputs">
        <h2>Tag Inputs</h2>
        <p>This component allows entering a list of tags with autocompletion, removal and rearrangement.</p>
        <p>The current value is: <code>{{tagList}}</code></p>
        <MbTagInput v-model="tagList" :autocomplete-model="colorPalette" autocomplete-property="label" :allow-unsuggested="true" :dark="dark" label="An advanced tag input" :max="4" :min="3" />
        <MbTagInput v-model="tagList" :autocomplete-model="['foobar', 'bazlington', 'fizzbuzz', 'crazy']" :dark="dark" label="A simple tag input" />
        <h3>Props</h3>
        <MbTable :data="props.tagInputs" />
        <h3>Events</h3>
        <MbTable :data="events.tagInputs" />
        <h3>Notes</h3>
        <p>If <code>autocompleteModel</code> and <code>autocompleteProperty</code> are provided, the tag input will fetch suggestions based on the typed characters out of the model.</p>
        <p>If a model is provided, the input will only accept tags from that model unless <code>allowUnsuggested</code> is set to <code>true</code>.</p>
      </section>
      <section v-else-if="activeTabValue === 'date-pickers'" class="tab date-pickers">
        <h2>Date Pickers</h2>
        <p>This component allows picking dates and times visually.</p>
        <p>The current date is: <code>{{testdate}}</code></p>
        <MbDatePicker v-model="testdate" :dark="dark" />
        <h3>Props</h3>
        <MbTable :data="props.datePickers" />
        <h3>Events</h3>
        <MbTable :data="events.datePickers" />
        <h3>Notes</h3>
        <p>If <code>showTime</code> is not <code>true</code> the resulting date will be at the start of the day (00:00).</p>
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
  name: 'Components',
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
      availableIcons: require.context('@/assets/icons', false, /\w+\.svg$/i).keys().map((path) => path.replace(/^\.\/(.*)\.\w+$/, '$1')),
      centerPopover: false,
      colorPalette: [
        {
          label: 'Accent',
          value: '#6c5ce7',
        },
        {
          label: 'Accent Secondary',
          value: '#A29BFE',
        },
        {
          label: 'Text',
          value: '#111028',
        },
        {
          label: 'Text Secondary',
          value: 'rgba(0, 0, 0, 0.54)',
        },
        {
          label: 'Text Tertiary',
          value: 'rgba(0, 0, 0, 0.38)',
        },
        {
          label: 'Bg',
          value: '#fff',
        },
        {
          label: 'Bg Secondary',
          value: '#f4f3ff',
        },
        {
          label: 'Bg Tertiary',
          value: '#fafaff',
        },
        {
          label: 'Text Dark',
          value: 'white',
        },
        {
          label: 'Text Secondary Dark',
          value: 'rgba(255, 255, 255, 0.7)',
        },
        {
          label: 'Text Tertiary Dark',
          value: 'rgba(255, 255, 255, 0.5)',
        },
        {
          label: 'Bg Dark',
          value: '#1E1D22',
        },
        {
          label: 'Bg Secondary Dark',
          value: '#2B2A32',
        },
        {
          label: 'Bg Tertiary Dark',
          value: '#343244',
        },
        {
          label: 'Negative Saturated',
          value: '#d63031',
        },
        {
          label: 'Negative',
          value: '#ff7675',
        },
        {
          label: 'Positive Saturated',
          value: '#00b894',
        },
        {
          label: 'Positive',
          value: '#55efc4',
        },
        {
          label: 'Warning Saturated',
          value: '#fdcb6e',
        },
        {
          label: 'Warning',
          value: '#ffeaa7',
        },
      ],
      colorPaletteStrings: [
        '#6c5ce7',
        '#A29BFE',
        '#111028',
        'rgba(0, 0, 0, 0.54)',
        'rgba(0, 0, 0, 0.38)',
        '#fff',
        '#f4f3ff',
        '#fafaff',
        'white',
        'rgba(255, 255, 255, 0.7)',
        'rgba(255, 255, 255, 0.5)',
        '#1E1D22',
        '#2B2A32',
        '#343244',
        '#d63031',
        '#ff7675',
        '#00b894',
        '#55efc4',
        '#fdcb6e',
        '#ffeaa7',
      ],
      contextMenu: {
        show: false,
        x: 0,
        y: 0,
      },
      currentColor: 'rgba(123, 255, 213, 0.25)',
      events: {
        buttons: [
          ['Name', 'Data'],
          ['`click`', 'The browser click event'],
        ],
        checkboxes: [
          ['Name', 'Data'],
          ['`update:modelValue`', '`!value`'],
        ],
        colorPickers: [
          ['Name', 'Data'],
          ['`update:modelValue`', 'The new color'],
        ],
        contextMenus: [
          ['Name', 'Data'],
          ['`close`', ''],
        ],
        datePickers: [
          ['Name', 'Data'],
          ['`update:modelValue`', 'The new date in the specified format'],
        ],
        fileLists: [
          ['Name', 'Data'],
          ['`fileclick`', 'The full path of the clicked file'],
        ],
        inputs: [
          ['Name', 'Data'],
          ['`blur`', ''],
          ['`focus`', ''],
          ['`update:modelValue`', 'The new text content'],
        ],
        modals: [
          ['Name', 'Data'],
          ['`close`', ''],
        ],
        popovers: [
          ['Name', 'Data'],
          ['`close`', ''],
        ],
        radios: [
          ['Name', 'Data'],
          ['`update:modelValue`', 'The value of the selected option'],
        ],
        selects: [
          ['Name', 'Data'],
          ['`update:modelValue`', 'The value of the selected option'],
        ],
        tabs: [
          ['Name', 'Data'],
          ['`add-tab`', ''],
          ['`update:modelValue`', 'The index of the new active tab'],
        ],
        tagInputs: [
          ['Name', 'Data'],
          ['`blur`', ''],
          ['`focus`', ''],
          ['`update:modelValue`', 'The new array of tags'],
        ],
        textareas: [
          ['Name', 'Data'],
          ['`update:modelValue`', 'The new content in the specified output format'],
        ],
        toggles: [
          ['Name', 'Data'],
          ['`update:modelValue`', '`!value`'],
        ],
      },
      idCounter: 0,
      modalVisible: false,
      modalVisible2: false,
      modalVisible3: false,
      modalVisible4: false,
      popover: null,
      popover2: null,
      popoverFromRight: false,
      props: {
        buttons: [
          ['Name', 'Type', 'Default', 'Allowed Values'],
          ['`dark`', 'Boolean', '`false`', ''],
          ['`disabled`', 'Boolean', '`false`', ''],
          ['`icon`', 'String', '', 'A valid icon name'],
          ['`icon-first`', 'Boolean', '`true`', ''],
          ['`loading`', 'Boolean', '`false`', ''],
          ['`rounded`', 'Boolean', '`false`', ''],
          ['`tooltip`', 'String / Object', '', ''],
          ['`type`', 'String', '', 'negative, positive, primary, warning'],
        ],
        checkboxes: [
          ['Name', 'Type', 'Default'],
          ['`dark`', 'Boolean', '`false`'],
          ['`disabled`', 'Boolean', '`false`'],
          ['`modelValue`', 'Boolean', '`false`'],
        ],
        colorPickers: [
          ['Name', 'Type', 'Default', 'Allowed Values'],
          ['`dark`', 'Boolean', '`false`', ''],
          ['`format`', 'String', '`hex`', 'hex, rgb, rgba'],
          ['`modelValue`', 'String', '', ''],
          ['`palette`', 'Array', '`undefined`', 'Valid hex or rgb colors'],
          ['`paletteOnly`', 'Boolean', '`false`', ''],
          ['`removable`', 'Boolean', '`false`', ''],
        ],
        contextMenus: [
          ['Name', 'Type', 'Default'],
          ['`dark`', 'Boolean', '`false`'],
          ['`fromRight`', 'Boolean', '`false`'],
          ['`options`', 'Array', '`[]`'],
          ['`show`', 'Boolean', '`false`'],
          ['`stealFocus`', 'Boolean', '`true`'],
          ['`target`', 'HTMLElement', ''],
          ['`x`', 'Number', '`0`'],
          ['`y`', 'Number', '`0`'],
        ],
        datePickers: [
          ['Name', 'Type', 'Default'],
          ['`dark`', 'Boolean', '`false`'],
          ['`format`', 'String', '`ms`'],
          ['`modelValue`', 'String, Number', ''],
          ['`placeholder`', 'String', 'Choose a date…'],
          ['`removable`', 'Boolean', '`false`'],
          ['`showTime`', 'Boolean', '`false`'],
        ],
        fileLists: [
          ['Name', 'Type', 'Default', 'Notes'],
          ['`action`', 'Object', '', 'Takes Button Props and a Label and Callback, will be shown at the top right as a primary action such as "create new" and "move here" (called with currentPath)'],
          ['`dark`', 'Boolean', '`false`', ''],
          ['`fileActions`', 'Array', '`[]`', 'Takes objects with Context-Menu options including an action, which will be called with the file’s path. If filesOnly / foldersOnly are specified for an action, it will only show up in the respective type’s menu. If there’s only one, it’ll be displayed instead of the overflow menu'],
          ['`filterable`', 'Boolean', '`true`', ''],
          ['`foldersFirst`', 'Boolean', '`true`', ''],
          ['`foldersOnly`', 'Boolean', '`false`', ''],
          ['`initialSortBy`', 'String', "`'name'`", 'Allowed values: name, edited'],
          ['`initialReverseSortOrder`', 'Boolean', '`false`', 'If true, the entities will be sorted in descending order initially'],
          ['`root`', 'String', '`/`', 'The root folder to start in, will not allow going higher than that'],
          ['`showHidden`', 'Boolean', '`false`', 'By default all files starting with a . are hidden. If this is true, they’ll be shown. .git is always hidden'],
        ],
        icons: [
          ['Name', 'Type', 'Default'],
          ['`icon`', 'String', "`'mattrbld'`"],
          ['`noTransition`', 'Boolean', '`false`'],
        ],
        inputs: [
          ['Name', 'Type', 'Default'],
          ['`autofocus`', 'Boolean', '`false`'],
          ['`dark`', 'Boolean', '`false`'],
          ['`disabled`', 'Boolean', '`false`'],
          ['`error`', 'String', ''],
          ['`icon`', 'String', ''],
          ['`label`', 'String', ''],
          ['`maxLen`', 'Number', ''],
          ['`modelValue`', 'String', "`''`"],
          ['`placeholder`', 'String', ''],
          ['`type`', 'String', "`'text'`"],
        ],
        modals: [
          ['Name', 'Type', 'Default'],
          ['`dark`', 'Boolean', '`false`'],
          ['`paddedBody`', 'Boolean', '`true`'],
          ['`slim`', 'Boolean', '`false`'],
          ['`title`', 'String', '`\'\'`'],
          ['`visible`', 'Boolean', '`false`'],
        ],
        popovers: [
          ['Name', 'Type', 'Default'],
          ['`centerX`', 'Boolean', '`false`'],
          ['`centerY`', 'Boolean', '`false`'],
          ['`dark`', 'Boolean', '`false`'],
          ['`fromRight`', 'Boolean', '`false`'],
          ['`noContentPadding`', 'Boolean', '`false`'],
          ['`stealFocus`', 'Boolean', '`true`'],
          ['`visible`', 'Boolean', '`false`'],
          ['`x`', 'Number', '`0`'],
          ['`y`', 'Number', '`0`'],
        ],
        progressBars: [
          ['Name', 'Type', 'Default'],
          ['`colors`', 'Array', '`undefined`'],
          ['`dark`', 'Boolean', '`false`'],
          ['`indetermined`', 'Boolean', '`false`'],
          ['`label`', 'String', '`\'\'`'],
          ['`progress`', 'Number', '`0`'],
        ],
        radios: [
          ['Name', 'Type', 'Default'],
          ['`dark`', 'Boolean', '`false`'],
          ['`inline`', 'Boolean', '`false`'],
          ['`modelValue`', 'Any', '`undefined`'],
          ['`options`', 'Array', '`undefined`'],
        ],
        scrollers: [
          ['Name', 'Type', 'Default', 'Allowed Values'],
          ['`direction`', 'String', "`'horizontal'`", 'horizontal, vertical'],
        ],
        selects: [
          ['Name', 'Type', 'Default', 'Notes'],
          ['`dark`', 'Boolean', '`false`', ''],
          ['`disabled`', 'Boolean', '`false`', ''],
          ['`filterable`', 'Boolean', '`false`', ''],
          ['`loading`', 'Boolean', '`false`', ''],
          ['`modelValue`', 'Any', '`null`', ''],
          ['`options`', 'Array', '`false`', 'Should be an array of objects like { label: String, value: Any, disabled: Boolean }'],
          ['`placeholder`', 'String', "`'Select something…'`", 'Will only be shown if modelValue === null'],
          ['`refocus`', 'Boolean', '`true`', 'By default the button toggling the popover gets refocussed after the popover closes, but if this causes issues (like in the editor toolbar), this prop can be used to deactivated that behaviour'],
          ['`rounded`', 'Boolean', '`false`', ''],
          ['`tooltip`', 'String / Object', '', ''],
        ],
        tables: [
          ['Name', 'Type', 'Default'],
          ['`data`', 'Array', '`[]`'],
        ],
        tabs: [
          ['Name', 'Type', 'Default'],
          ['`dark`', 'Boolean', '`false`'],
          ['`modelValue`', 'Number', ''],
          ['`showAddOption`', 'Boolean', '`false`'],
          ['`tabs`', 'Array', '`[]`'],
        ],
        tagInputs: [
          ['Name', 'Type', 'Default'],
          ['`allowUnsuggested`', 'Boolean', '`false`'],
          ['`autocompleteModel`', 'Array', '`undefined`'],
          ['`autocompleteProperty`', 'String', '`undefined`'],
          ['`dark`', 'Boolean', '`false`'],
          ['`label`', 'String', '`undefined`'],
          ['`max`', 'Number', '`undefined`'],
          ['`min`', 'Number', '`undefined`'],
          ['`modelValue`', 'Array', '`[]`'],
          ['`placeholder`', 'String', '`New Tag…`'],
        ],
        textareas: [
          ['Name', 'Type', 'Default', 'Notes'],
          ['`allowNewLines`', 'Boolean', '`true`', 'Ignored if outputFormat !== \'text\', use formats in that case'],
          ['`allowNewLines`', 'Boolean', '`false`', 'Allow raw code editing when outputFormat !== \'text\''],
          ['`codeLangs`', 'Array', "`['html', 'css', 'javascript', 'markdown']`", 'What code langauges should be available when formatting code blocks'],
          ['`dark`', 'Boolean', '`false`', ''],
          ['`disabled`', 'Boolean', '`false`', ''],
          ['`error`', 'String', '`\'\'`', ''],
          ['`formatOptions`', 'Object', '`{ minHeading: 1, maxHeading: 6, allowQuoteFooters: true, allowNestedLists: true }`', ''],
          ['`formats`', 'Object', "`{ block: ['blockquote', 'codeBlock', 'heading', 'hr', 'orderedList', 'unorderedList'], inline: ['br', 'code', 'em', 'link', 'strike', 'strong'] }`", 'List of allowed formats for non-text editors. Set block to false to get an inline-only editor.'],
          ['`inputRuleOptions`', 'Object', "`{ autoquotes: '“”‘’', dashes: true, ellipsis: true, minHeading: 1, maxHeading: 6, noDoubleSpace: true, }`", 'Configuration for input rules.'],
          ['`label`', 'String', '', ''],
          ['`maxLen`', 'Number', '', ''],
          ['`modelValue`', 'String', '', 'Will be either text / html / markdown depending on outputFormat'],
          ['`outputFormat`', 'String', '', 'Allowed values: text, html, markdown'],
          ['`placeholder`', 'String', '', ''],
        ],
        toggles: [
          ['Name', 'Type', 'Default'],
          ['`dark`', 'Boolean', '`false`'],
          ['`disabled`', 'Boolean', '`false`'],
          ['`icons`', 'Array', ''],
          ['`modelValue`', 'Boolean', '`false`'],
          ['`tooltip`', 'String', ''],
        ],
        tooltips: [
          ['Name', 'Type', 'Allowed Values'],
          ['`message`', 'String', ''],
          ['`position`', 'String', 'top, left, right, bottom'],
          ['`target`', 'HTMLElement', ''],
        ],
      },
      radioTest: null,
      selectTest: null,
      selectOptions: [
        {
          label: 'Test',
          value: 'foo',
        },
        {
          label: 'Nothing',
          value: null,
        },
        {
          value: 'bar',
        },
        {
          value: 'bar1',
        },
        {
          value: 'bar2',
        },
        {
          value: 'bar3',
        },
        {
          value: 'bar31',
        },
        {
          value: 'bar32',
        },
        {
          value: 'bar33',
        },
        {
          value: 'bar34',
        },
        {
          value: 'bar35',
        },
        {
          value: 'bar36',
        },
        {
          value: 'bar37',
        },
        {
          value: 'bar38',
        },
        {
          value: 'bar39',
        },
        {
          value: 'absolutely crazily long and stuff',
        },
        {
          disabled: true,
          label: 'This is disabled',
          value: 'disabled',
        },
      ],
      simulateLoading: false,
      slots: {
        modals: [
          ['Name', 'Default Content'],
          ['actions', ''],
        ],
        popovers: [
          ['Name', 'Default Content'],
          ['header', ''],
          ['footer', ''],
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
        { label: 'Checkboxes', value: 'checkboxes' },
        { label: 'Color Pickers', value: 'color-pickers' },
        { label: 'Context Menus', value: 'context-menus' },
        { label: 'Date Pickers', value: 'date-pickers' },
        { label: 'File Lists', value: 'file-lists' },
        { label: 'Icons', value: 'icons' },
        { label: 'Inputs', value: 'inputs' },
        { label: 'Loaders', value: 'loaders' },
        { label: 'Modals', value: 'modals' },
        { label: 'Popovers', value: 'popovers' },
        { label: 'Progress Bars', value: 'progress-bars' },
        { label: 'Radio Groups', value: 'radios' },
        { label: 'Scrollers', value: 'scrollers' },
        { label: 'Select Boxes', value: 'selects' },
        { label: 'Tables', value: 'tables' },
        { label: 'Tabs', value: 'tabs' },
        { label: 'Tag Inputs', value: 'tag-inputs' },
        { label: 'Textareas', value: 'textareas' },
        { label: 'Toggles', value: 'toggles' },
        { label: 'Tooltips', value: 'tooltips' },
      ],
      editorTest: '',
      tagList: [],
      testdate: null,
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
    showFileToast(path) {
      this.$store.commit('addToast', { message: `Clicked on file: ${path}` });
    },
    softDeleteFile(path) {
      this.$store.commit('addToSoftDeleted', path);
      this.$store.commit('addToast', {
        action: () => this.$store.commit('removeFromSoftDeleted', path),
        actionLabel: 'Undo',
        message: 'The file was soft-deleted',
        timeout: false,
        type: 'warning',
      });
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

.components
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

      &.v-enter-from,
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

    &.textareas
      .editor
        margin-bottom: 3rem

    &.loaders
      .loader,
      .inline-loader
        margin-bottom: 4rem

    &.scrollers
      .horiz ul
        display: flex
        list-style: none
        padding: 0
        margin: 0

        li
          margin-right: 1rem
          flex-shrink: 0

      .vert
        max-height: 8rem

    &.popovers
      .toggle
        margin-bottom: 1rem

    &.selects
      ::v-deep(.select)
        margin: 1rem

    &.radios
      .radio-group
        margin-bottom: 1.5rem

    &.color-pickers
      .color-preview
        display: inline-block
        width: 1rem
        height: @width
        border-radius: 50%
        margin-left: 1rem
        margin-right: 0.5rem
        margin-top: 0.25rem
        vertical-align: top

      .color-picker:not(:last-of-type)
        margin-right: 1rem
        margin-bottom: 1rem
</style>
