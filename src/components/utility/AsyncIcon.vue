<template>
  <div class="async-icon" :class="{ error, visible }" :style="{ maskImage: mask }">
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
      } catch (err) {
        this.error = err.message;
      }
    },
  },
  props: {
    src: String,
    visible: Boolean,
  },
  watch: {
    src(nv) {
      if (nv) {
        if (this.url) URL.revokeObjectURL(this.url);
        this.loadImage();
      }
    },
    visible(nv, ov) {
      if (nv && !ov) this.loadImage();
    },
  },
};
</script>

<style lang="scss" scoped>
  .async-icon {
    aspect-ratio: 1 / 1;
    mask-size: contain;
    mask-repeat: no-repeat;
    display: grid;
    place-items: center;
    width: rem(24);
    height: rem(24);
    transition: background-color 200ms ease;

    &.visible {
      background-color: currentColor;
    }

    &.error {
      background-color: transparent;
      color: var(--negative);
    }
  }
</style>
