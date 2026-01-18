<template>
  <div class="icon-picker" :class="{ dark }" tabindex="0" @click="activate" @keydown.space.prevent @keyup.space.enter="activate">
    <transition mode="out-in" name="swirl">
      <MbIcon v-if="!customIcons || !modelValue" :icon="modelValue || 'mattrbld'" />
      <AsyncIcon v-else :key="modelValue" :preserve-color="preserveColor" :src="customIcons[modelValue]" visible />
    </transition>
    <span class="label" :class="{ placeholder: !modelValue }">{{buttonLabel}}</span>
    <MbButton v-if="removable" v-show="modelValue" :dark="dark" icon="cross" ref="removeButton" rounded tooltip="Clear path" @click="$emit('update:modelValue', null)" />
    <MbPopover center-x class="picker-popover" :dark="dark" no-content-padding ref="popover" :visible="showPicker" :x="popover.x" :y="popover.y" @after-close="iconFilter = ''" @close="deactivate">
      <div class="content-wrapper">
        <header>
          <MbInput v-model="iconFilter" :dark="dark" icon="search" placeholder="Filter icons…" />
        </header>
        <MbScroller direction="vertical" ref="scroller">
          <template v-if="filteredIcons.length">
            <ul v-if="!customIcons">
              <li v-for="icon in filteredIcons" :class="{ active: icon === modelValue, dark }" :key="icon" tabindex="0" @click="pickIcon(icon)" @keydown.space.prevent @keyup.space.enter="pickIcon(icon)" @mouseenter="showNameTooltip($event, icon)">
                <MbIcon :icon="icon" />
                <span>{{icon}}</span>
              </li>
            </ul>
            <ul v-else>
              <li v-for="[icon, src] in filteredIcons" :class="{ active: icon === modelValue, dark }" :data-icon="icon" :key="icon" tabindex="0" ref="asyncIcons" @click="pickIcon(icon)" @keydown.space.prevent @keyup.space.enter="pickIcon(icon)" @mouseenter="showNameTooltip($event, icon)">
                <AsyncIcon :preserve-color="preserveColor" :src="src" :visible="visibleIcons.has(icon)" />
                <span>{{cleanIconName(icon)}}</span>
              </li>
            </ul>
          </template>
          <p v-else class="empty-state">There are no matching icons.</p>
        </MbScroller>
      </div>
      <template #footer>
        <MbButton :dark="dark" @click="deactivate">Cancel</MbButton>
      </template>
    </MbPopover>
  </div>
</template>

<script>
import { pathBasename } from '../fs';
import AsyncIcon from './utility/AsyncIcon.vue';

function generateIconsList() {
  // using ?url here to avoid a warning during build (since the icons are also imported by the SvgSprite), adding import: 'default' inflates the bundle
  return Object.keys(import.meta.glob('@/assets/icons/**.svg', { query: '?url' })).map((path) => pathBasename(path).replace(/^(.*)\.\w+$/, '$1'));
}

export default {
  availableIcons: generateIconsList(),
  beforeUnmount() {
    if (this.iconObserver) this.iconObserver.disconnect();
  },
  components: {
    AsyncIcon,
  },
  computed: {
    buttonLabel() {
      if (!this.modelValue) return this.placeholder;
      if (this.prettyFilenames) return this.cleanIconName(this.modelValue);
      return this.modelValue;
    },
    filteredIcons() {
      if (!this.customIcons) {
        if (!this.iconFilter) return this.$options.availableIcons;
        return this.$options.availableIcons.filter((icon) => icon.includes(this.iconFilter.toLowerCase()));
      }

      if (!this.iconFilter) return Object.entries(this.customIcons);
      return Object.entries(this.customIcons).filter(([icon]) => icon.includes(this.iconFilter.toLowerCase()));
    },
  },
  data() {
    return {
      iconFilter: '',
      iconObserver: null,
      popover: {
        x: 0,
        y: 0,
      },
      showPicker: false,
      visibleIcons: new Set(),
    };
  },
  emits: ['update:modelValue'],
  methods: {
    activate(e) {
      if (e && this.removable && (e.target === this.$refs.removeButton.$el || this.$refs.removeButton.$el.contains(e.target))) return;
      const rect = this.$el.getBoundingClientRect();
      const remBase = Number.parseInt(window.getComputedStyle(document.documentElement).fontSize, 10);
      this.listWidth = Math.max(20, rect.width / remBase);
      this.popover.x = rect.left + rect.width / 2;
      this.popover.y = rect.bottom + 0.5 * remBase;
      window.addEventListener('scroll', this.deactivate, { capture: true, passive: true });
      this.showPicker = true;
    },
    cleanIconName(name) {
      const filename = pathBasename(name);
      return filename.slice(0, filename.lastIndexOf('.'));
    },
    deactivate(e) {
      if (e && e.type === 'scroll' && this.$refs.popover.$refs.el.contains(e.target)) return;
      window.removeEventListener('scroll', this.deactivate, { capture: true, passive: true });
      this.showPicker = false;
      this.$el.focus();
    },
    pickIcon(icon) {
      this.$emit('update:modelValue', icon);
      this.deactivate();
    },
    setupIconObserver() {
      if (!this.$refs.asyncIcons) return;

      this.visibleIcons = new Set();
      this.iconObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) this.visibleIcons.add(entry.target.dataset.icon);
          else this.visibleIcons.delete(entry.target.dataset.icon);
        });
      }, { root: this.$refs.scroller.$refs.scrollArea });

      this.$refs.asyncIcons.forEach((icon) => this.iconObserver.observe(icon));
    },
    showNameTooltip(e, icon) {
      const tooltip = {
        message: icon,
        target: e.currentTarget,
      };
      this.$store.commit('setTooltip', tooltip);
    },
  },
  mounted() {
    if (this.customIcons) this.setupIconObserver();
  },
  props: {
    customIcons: Object,
    dark: Boolean,
    modelValue: String,
    placeholder: {
      type: String,
      default: 'Pick an icon…',
    },
    preserveColor: Boolean,
    prettyFilenames: Boolean,
    removable: Boolean,
  },
  watch: {
    customIcons(nv, ov) {
      if (nv) {
        // wait a tick so the $refs can update
        this.$nextTick(() => this.setupIconObserver());
      } else if (!nv && ov) {
        this.iconObserver.disconnect();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
  @use '../assets/styles/breakpoints' as *;

  .icon-picker {
    position: relative;
    border: none;
    background-color: var(--bg-secondary);
    color: inherit;
    border-radius: var(--radius-m);
    padding: 1rem;
    padding-right: 1.5rem;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    transition: background-color 200ms ease;
    user-select: none;
    text-align: left;
    white-space: nowrap;
    max-width: 100%;
    min-width: 0;

    &:hover {
      background-color: var(--bg-tertiary);
    }

    &:focus {
      background-color: var(--bg-secondary);

      &::before {
        opacity: 1;
      }
    }

    &:active {
      transform: translateY(2px);
    }

    &.dark {
      background-color: var(--bg-secondary-dark);

      &:hover {
        background-color: var(--bg-tertiary-dark);
      }

      &:focus {
        background-color: var(--bg-secondary-dark);
      }

      .label.placeholder {
        color: var(--text-secondary-dark);
      }
    }

    &::before {
      content: '';
      position: absolute;
      top: 0px;
      left: 0px;
      right: 0px;
      bottom: 0px;
      box-shadow: inset 0 0 0 0.125rem var(--accent);
      opacity: 0;
      border-radius: inherit;
      transition: opacity 200ms ease;
    }

    .label {
      margin-left: 0.75rem;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: auto;

      &.placeholder {
        color: var(--text-secondary);
      }
    }

    .icon, .async-icon {
      flex-shrink: 0;
    }

    .async-icon {
      &.swirl-enter-active,
      &.swirl-leave-active {
        transition: transform 200ms ease, opacity 200ms ease;

        &.swirl-enter-from,
        &.swirl-leave-to {
          opacity: 0;
        }

        &.swirl-enter-from {
          transform: rotate(-45deg);
        }

        &.swirl-leave-to {
          transform: rotate(45deg);
        }
      }
    }

    .button.icon {
      margin: -0.5rem;
      margin-left: 0.5rem;
      margin-right: -1rem;
      padding: rem(8.5);
    }
  }

  .picker-popover {
    &.dark {
      .content-wrapper .empty-state {
        color: var(--text-tertiary-dark);
      }
    }

    .content-wrapper {
      background-color: inherit;

      header {
        padding: 0.5rem;

        .input {
          width: 100%;

          &.dark {
            background-color: var(--bg-tertiary-dark);
          }
        }
      }

      ul {
        user-select: none;
        max-height: 30rem;
        margin: 0;
        padding: 0.5rem;
        padding-top: 0;
        list-style: none;

        background-color: inherit;
        display: flex;
        flex-wrap: wrap;
        max-width: rem(3 * (88 + 16) + 16);

        &::after {
          content: '';
          display: block;
          height: 0.5rem;
          width: 100%;
        }

        li {
          margin: 0.5rem;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: var(--bg-secondary);
          border-radius: var(--radius-m);
          width: rem(88);
          overflow: hidden;
          cursor: pointer;
          transition: background-color 200ms ease;
          position: relative;

          &:hover {
            background-color: var(--bg-tertiary);
          }

          &:focus::before {
            opacity: 1;
          }

          &:active {
            transform: translateY(0.125rem);
            background-color: var(--bg);
          }

          &.dark {
            background-color: var(--bg-tertiary-dark);
            box-shadow: inset 0 0 0 0.0625rem var(--bg-tertiary-dark-lightened-3);

            &:hover {
              background-color: var(--bg-tertiary-dark-lightened-5);
            }

            &:active {
              background-color: var(--bg-secondary-dark);
            }

            span {
              color: var(--text-secondary-dark);
            }
          }

          &.active {
            background-color: var(--accent);
            color: var(--text-dark);

            &:hover,
            &:focus {
              background-color: var(--accent-darkened-5);
            }

            span {
              color: var(--text-secondary-dark);
            }
          }

          &::before {
            content: '';
            position: absolute;
            top: 0px;
            left: 0px;
            right: 0px;
            bottom: 0px;
            box-shadow: inset 0 0 0 0.125rem var(--accent);
            opacity: 0;
            border-radius: inherit;
            transition: opacity 200ms ease;
          }

          .icon {
            display: block;
            margin-bottom: 0.5rem;
            margin-top: 0.5rem;
          }

          span {
            font-size: 0.875rem;
            color: var(--text-secondary);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
          }
        }
      }

      .empty-state {
        color: var(--text-tertiary);
        text-align: center;
        margin-bottom: rem(24);
      }
    }
  }
</style>
