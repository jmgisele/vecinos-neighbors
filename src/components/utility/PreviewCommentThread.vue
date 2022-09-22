<template lang="html">
  <MbPopover class="preview-comment-thread" :dark="dark" no-content-padding update-on-resize use-capture-on-outside-click :visible="visible" :x="x" :y="y" @close="$emit('close')">
    <div v-for="comment in comments" class="comment" :key="comment.id">
      <!-- TODO: Add comment editor -->
      <div v-html="comment.content" />
    </div>
    <template v-if="canComment" #footer>
      <p>footer</p>
    </template>
  </MbPopover>
</template>

<script>
export default {
  data() {
    return {
    };
  },
  emits: ['close'],
  methods: {
  },
  props: {
    canComment: Boolean,
    comments: Array,
    dark: Boolean,
    visible: Boolean,
    x: {
      type: Number,
      default: 0,
    },
    y: {
      type: Number,
      default: 0,
    },
  },
};
</script>

<style lang="stylus" scoped>
@require '../../assets/styles/breakpoints'
@require '../../assets/styles/colors'
@require '../../assets/styles/corners'

.preview-comment-thread
  p
    max-width: 100%
    width: (440 / 16)rem
</style>
