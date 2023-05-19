<template lang="html">
  <MbPopover class="preview-comment-thread" :dark="dark" no-content-padding no-footer-padding update-on-resize use-capture-on-outside-click :visible="visible" :x="x" :y="y" @close="$emit('close')">
    <ul class="comments">
      <li v-for="comment in comments" class="comment" :key="comment.id">
        <header>
          <span class="author"><strong>{{comment.author}}</strong></span>
          <span class="timestamp">{{ formatTimestamp(comment.created) }}</span>
          <MbButton :dark="dark" icon="more-vertical" />
          <!-- TODO: Add comment overflow menu with deletion and resolution (and editing if Author === Current User) option -->
        </header>
        <!-- TODO: Add comment editor -->
        <div class="content" v-html="comment.content" />
      </li>
    </ul>
    <template v-if="canComment" #footer>
      <MbEditor v-model="reply.content" :dark="dark" :format-options="{}" :formats="{ block: ['blockquote', 'orderedList', 'unorderedList'], inline: ['code', 'em', 'strike', 'strong'] }"  output-format="html" placeholder="Your reply…" ref="commentEditor" @keyup.ctrl.enter="addReply" />
      <div class="button-wrapper">
        <MbButton :dark="dark" @click="$emit('close')">Close</MbButton>
        <MbButton :dark="dark" :disabled="!reply || !reply.content || reply.content === '<p></p>'" :loading="reply.loading" icon="comment-reply-alt" type="positive" @click="addReply">Send Reply</MbButton>
      </div>
    </template>
  </MbPopover>
</template>

<script>
import formatTimestamp from '../../assets/js/formatTimestamp';

export default {
  computed: {
    currentUser() {
      return this.$store.getters.userInCurrentProject;
    },
  },
  data() {
    return {
      reply: {
        content: null,
        loading: false,
      },
    };
  },
  emits: ['add-reply', 'close'],
  methods: {
    addReply() {
      if (!this.reply || !this.reply.content || this.reply.content === '<p></p>') return;

      document.activeElement.blur(); // need to blur the editor so we can reset its contents

      const comment = {
        id: Math.random().toString(36).substring(2, 9),
        author: this.currentUser.name,
        parent: this.comments[0].id,
        content: this.reply.content,
        position: null,
        status: null,
        created: Date.now(),
        updated: null,
      };

      this.$emit('add-reply', comment);
      this.reply.content = null;
    },
    formatTimestamp,
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
  &.dark
    .comment
      &:not(:last-child)
        border-bottom-color: $bg-tertiary-dark

      header
        .author
          color: $text-secondary-dark

        .timestamp
          color: $text-tertiary-dark

  .comments
    list-style: none
    padding: 0
    margin: 0

    .comment
      max-width: 100%
      width: (440 / 16)rem
      padding: (24 / 16)rem (12 / 16)rem

      &:first-child
        padding-top: (8 / 16)rem

      &:not(:last-child)
        border-bottom: 1px solid $bg-secondary

      header
        display: flex
        align-items: center
        user-select: none
        margin-bottom: (12 / 16)rem

        .author,
        .timestamp
          font-size: (12 / 16)rem

        .author
          max-width: 60%
          white-space: nowrap
          overflow: hidden
          text-overflow: ellipsis
          color: $text-secondary

        .timestamp
          color: $text-tertiary
          margin-left auto
          margin-right: (8 / 16)rem

        .button
          padding: (8 / 16)rem
          margin-right: (-4 / 16)rem

          &:deep(.icon)
            width: 1rem
            height: @width

      .content
        > :first-child
          margin-top: 0

        > :last-child
          margin-bottom: 0

  footer
    .button-wrapper
      display: flex
      padding: 0.5rem

      .button
        width: 100%

        @media $mobile
          min-width: 0

        &:not(:last-child)
          margin-right: 0.5rem

  .editor
    max-width: 100%
    width: (440 / 16)rem

    :deep(.content-wrapper)
      border-radius: 0

      &:not(:focus-within):not(.error)
        box-shadow: inset 0 (-1 / 16)rem 0 0 $bg-tertiary

      &.dark
        background-color: $bg-tertiary-dark

        &:not(:focus-within):not(.error)
          box-shadow:
            inset 0 0.0625rem 0 0 lighten($bg-tertiary-dark, 10),
            inset 0 (-1 / 16)rem 0 0 lighten($bg-tertiary-dark, 10)

        code
          background-color: lighten($bg-tertiary-dark, 10)

    &:deep(.toolbar)
      margin-top: 0
      top: 0
      border-radius: 0

      .tool-group:nth-child(2)
        display: none
</style>
