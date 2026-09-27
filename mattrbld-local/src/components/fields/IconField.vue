<template>
  <section class="icon field" :class="{ dark, error, localised: showLocalisedOptions && languages.length > 1 }">
    <div v-if="!showLocalisedOptions" class="icon-picker-wrapper">
      <span>{{ label }}:</span>
      <MbIconPicker :class="{  error, 'in-split': inSplit }" :custom-icons="customIcons" :dark="dark" :data-error="error && String(error)" :model-value="safeModelValue" :preserve-color="options?.preserveColor" :pretty-filenames="options?.prettyFilenames" :removable="options?.removable" @update:model-value="handleInput" />
    </div>
    <LocalisedFieldsContainer
      v-else
      v-slot="{ lang }"
      :active="active"
      :dark="dark"
      :display-value="firstLocalisedValue"
      :error="error"
      :in-split="inSplit"
      :label="label"
      :languages="languages"
      :teleport-target="teleportTarget"
      @modal-closed="$emit('update:error', validateLocalisedValues(safeModelValue, ''))"
      @update:active="$emit('update:active', $event)"
    >
      <div class="icon-picker-wrapper">
        <span>{{ languages.length > 1 ? lang : label }}:</span>
        <MbIconPicker :class="{  error, 'in-split': renderedInSplit }" :custom-icons="customIcons" :dark="dark" :data-error="error instanceof Map ? error.get(lang) : ''" :model-value="safeModelValue[lang]" :preserve-color="options?.preserveColor" :pretty-filenames="options?.prettyFilenames" :removable="options?.removable" @update:model-value="handleInput($event, lang)" />
      </div>
    </LocalisedFieldsContainer>
  </section>
</template>

<script>
import { joinPath, readdirDeep } from '../../fs';

import assembleUrlFromTemplate from '../../assets/js/assembleUrlFromTemplate';
import generateDefaultFilePathFields from '../../assets/js/generateDefaultFilePathFields';

import { imageRegExp } from '../../data/regExps';

import field from '../../mixins/field';

import LocalisedFieldsContainer from '../utility/LocalisedFieldsContainer.vue';

export default {
  components: {
    LocalisedFieldsContainer,
  },
  computed: {
    customIcons() {
      const projectDir = joinPath('/projects', this.$store.state.currentProject.id);
      return this.iconPaths.reduce((acc, iconPath) => {
        if (this.options?.insertAs === 'template' && this.options?.urlTemplate) {
          const iconName = assembleUrlFromTemplate(this.options.urlTemplate, generateDefaultFilePathFields(iconPath, projectDir, joinPath(projectDir, this.options.sourceDir)));
          acc[iconName] = iconPath;
        } else acc[(iconPath.replace(joinPath('/projects', this.$store.state.currentProject.id), ''))] = iconPath;

        return acc;
      }, {});
    },
    safeModelValue() {
      if (this.showLocalisedOptions) {
        if (this.modelValue && typeof this.modelValue === 'object') return this.modelValue;
        return this.languages.reduce((acc, lang) => {
          if (this.modelValue) acc[lang] = this.modelValue;
          else acc[lang] = null;
          return acc;
        }, {});
      }
      if (this.modelValue && typeof this.modelValue === 'object') return Object.values(this.modelValue)[0] || null;
      return this.modelValue || null;
    },
  },
  created() {
    this.fetchIcons();
  },
  data() {
    return {
      iconPaths: [],
    };
  },
  methods: {
    convertLocalisedValue(localised) {
      if (localised) {
        return this.languages.reduce((acc, lang) => {
          if (this.modelValue) acc[lang] = this.modelValue;
          else acc[lang] = null;
          return acc;
        }, {});
      }
      return Object.values(this.modelValue)[0] || null;
    },
    async fetchIcons() {
      if (!this.options?.sourceDir) return;

      try {
        const projectDir = joinPath('/projects', this.$store.state.currentProject.id);
        this.iconPaths = (await readdirDeep(joinPath(projectDir, this.options.sourceDir))).filter((path) => imageRegExp.test(path));
      } catch (err) {
        if (err.code === 'ENOENT') this.$store.commit('addToast', { message: `Something went wrong while loading the model for ${this.label}: the icon source folder doesn’t exist`, type: 'error' });
        else this.$store.commit('addToast', { message: `Something went wrong while loading the icons for ${this.label}: ${err}`, type: 'error' });
      }
    },
  },
  mixins: [field],
  watch: {
    active(nv) {
      if (!nv) this.$emit('update:error', this.validateLocalisedValues(this.safeModelValue, ''));
    },
    'options.sourceDir': {
      handler() {
        this.fetchIcons();
      },
    },
  },
};
</script>

<style lang="scss" scoped>
  .icon.field {
  }

  .localisation-modal .input {
    display: flex;
    width: 100%;
  }

  .icon-picker-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: rem(16);

    &:not(:last-child) {
      margin-bottom: 2rem;
    }

    > .icon-picker {
      &.error {
        &:not(:focus)::before {
          opacity: 1;
          box-shadow: inset 0 0 0 rem(2) var(--negative);
        }

        &::after {
          content: attr(data-error);
          position: absolute;
          top: -1.125rem;
          left: var(--radius-m);
          font-size: 0.75rem;
          color: var(--negative-saturated);
        }
      }
    }
  }

  .in-split {
    &.input {
      width: 100%;
      margin-top: 0;

      &:not(:last-child) {
        margin-bottom: 2rem;
      }
    }

    &.dark {
      &.icon-picker {
        background-color: var(--bg-tertiary-dark);

        &:hover {
          background-color: var(--bg-tertiary-dark-lightened-5);
        }

        &:active {
          background-color: var(--bg-secondary-dark);
        }
      }
    }
  }
</style>
