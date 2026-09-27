<template>
  <div class="async-icon" :class="{ error, monochrome: !preserveColor, loaded }" :style="{ [preserveColor ? 'backgroundImage' : 'maskImage']: mask }">
    <MbIcon v-if="error" icon="error" @mouseenter="handleTooltip" />
  </div>
</template>

<script>
import fs from '../../fs';

export default {
  beforeUnmount() {
    if (this.url) URL.revokeObjectURL(this.url);
  },
  created() {
    if (this.visible) this.loadImage();
  },
  data() {
    return {
      error: false,
      loaded: false,
      mask: null,
    };
  },
  methods: {
    handleTooltip(e) {
      const tooltip = {
        message: `The icon could not be loaded: ${this.error}`,
        target: e.currentTarget,
        url: null,
      };

      this.$store.commit('setTooltip', tooltip);
    },
    async loadImage() {
      if (!this.src) {
        this.error = 'No source was set.';
        return;
      }

      try {
        const srcData = await fs.readFile(this.src);
        const blob = new Blob([srcData], this.src.endsWith('.svg') ? { type: 'image/svg+xml' } : undefined);
        this.url = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
          this.mask = `url(${this.url})`;
        };

        img.src = this.url;
        this.loaded = true;
      } catch (err) {
        this.error = err.message;
      }
    },
  },
  props: {
    preserveColor: Boolean,
    src: String,
    visible: Boolean,
  },
  watch: {
    src(nv) {
      if (nv) {
        this.error = ''; // clear leftover errors
        if (this.url) URL.revokeObjectURL(this.url);
        this.loadImage();
      }
    },
    visible(nv, ov) {
      if (nv && !ov && !this.loaded) this.loadImage();
    },
  },
};
</script>

<style lang="scss" scoped>
  .async-icon {
    aspect-ratio: 1 / 1;
    background-size: contain;
    mask-size: contain;
    background-repeat: no-repeat;
    mask-repeat: no-repeat;
    display: grid;
    place-items: center;
    width: rem(24);
    height: rem(24);
    transition: background-color 200ms ease;

    &.loaded.monochrome {
      background-color: currentColor;
    }

    &.error {
      background-color: transparent;
      color: var(--negative);
    }
  }
</style>
