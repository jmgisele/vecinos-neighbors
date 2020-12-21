<template lang="html">
  <input accept="image/png, image/jpeg" class="avatar-uploader" type="file" @change="loadImage">
</template>

<script>
export default {
  emits: ['ready'],
  methods: {
    loadImage(e) {
      const img = e.target.files[0];
      const imageURL = window.URL.createObjectURL(img);
      const image = new Image();

      this.$el.value = ''; // clear the input, we don’t need it anymore

      image.onload = () => {
        window.URL.revokeObjectURL(imageURL);
        const canvas = document.createElement('canvas');
        canvas.width = this.size;
        canvas.height = this.size;

        const ctx = canvas.getContext('2d');
        const sourceSize = Math.min(image.width, image.height);
        const cropAxis = image.width < image.height ? 'y' : 'x';
        const cropDistance = cropAxis === 'x' ? image.width - image.height : image.height - image.width;

        ctx.imageSmoothingQuality = 'high';

        if (cropAxis === 'x') ctx.drawImage(image, cropDistance / 2, 0, sourceSize, sourceSize, 0, 0, 128, 128);
        else ctx.drawImage(image, 0, cropDistance / 2, sourceSize, sourceSize, 0, 0, 128, 128);

        const avatar = canvas.toDataURL('image/jpeg', Math.max(Math.min(this.compression, 1), 0));
        this.$emit('ready', avatar);
      };
      image.src = imageURL;
    },
  },
  props: {
    compression: {
      type: Number,
      default: 0.45,
    },
    size: {
      type: Number,
      default: 128,
    },
  },
};
</script>

<style lang="stylus" scoped>
.avatar-uploader
  display: none;
</style>
