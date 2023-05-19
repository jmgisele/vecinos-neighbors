<template lang="html">
  <MbPopover class="preview-comment-thread" :dark="dark" no-content-padding no-footer-padding update-on-resize use-capture-on-outside-click :visible="visible" :x="x" :y="y" @close="$emit('close')">
    <MbScroller class="comments" direction="vertical">
      <div v-for="(comment, index) in comments" class="comment" :key="comment.id" @contextmenu.prevent="openMenu($event, comment, index)">
        <header>
          <span class="author"><strong>{{comment.author}}</strong></span>
          <span class="timestamp">{{ formatTimestamp(comment.created) }}</span>
          <MbButton v-if="canComment && (index === 0 || comment.author === this.currentUser.name)" :dark="dark" icon="more-vertical" @click="openMenu($event, comment, index)" />
          <!-- TODO: Add comment overflow menu with deletion and resolution (and editing if Author === Current User) option -->
        </header>
        <!-- TODO: Add comment editor -->
        <div class="content" v-html="comment.content" />
      </div>
    </MbScroller>
    <template #footer>
      <MbEditor v-if="canComment" v-model="reply.content" :dark="dark" :format-options="{}" :formats="{ block: ['blockquote', 'orderedList', 'unorderedList'], inline: ['code', 'em', 'strike', 'strong'] }"  output-format="html" placeholder="Your reply…" ref="commentEditor" @keyup.ctrl.enter="addReply" />
      <div class="button-wrapper">
        <MbButton :dark="dark" @click="$emit('close')">Close</MbButton>
        <MbButton v-if="canComment" :dark="dark" :disabled="!reply || !reply.content || reply.content === '<p></p>'" :loading="reply.loading" icon="comment-reply-alt" type="positive" @click="addReply">Send Reply</MbButton>
      </div>
    </template>
    <MbContextMenu class="options" :dark="dark" :from-right="commentActions.fromRight" :options="modifiedCommentActions" :show="commentActions.show" :target="commentActions.target" :x="commentActions.x" :y="commentActions.y" @close="commentActions.show = false" />
  </MbPopover>
</template>

<script>
import formatTimestamp from '../../assets/js/formatTimestamp';

export default {
  computed: {
    currentUser() {
      return this.$store.getters.userInCurrentProject;
    },
    modifiedCommentActions() {
      const actions = [];

      if (!this.canComment) return actions;

      if (this.currentIndex === 0 && this.currentComment && this.currentComment.status !== 'resolved') {
        actions.push({
          action: () => {
            this.updateComment(this.currentComment.id, { status: 'resolved' });
          },
          icon: 'check',
          label: 'Mark as resolved',
        });
      } else if (this.currentIndex === 0 && this.currentComment) {
        actions.push({
          action: () => {
            this.updateComment(this.currentComment.id, { status: null });
          },
          icon: 'cross',
          label: 'Mark as unresolved',
        });
      }

      // TODO: Add option to edit comment content, maybe by pulling the current content into the reply field and changing the button label to save

      if (this.currentComment && this.currentUser.name === this.currentComment.author) {
        actions.push({
          action: () => {
            this.deleteComment(this.currentComment.id, this.currentIndex === 0);
          },
          icon: 'trash',
          label: this.currentIndex === 0 ? 'Delete comment thread' : 'Delete comment',
          type: 'negative',
        });
      }

      return actions;
    },
  },
  data() {
    return {
      commentActions: {
        fromRight: false,
        show: false,
        target: null,
        x: 0,
        y: 0,
      },
      currentComment: null,
      currentIndex: null,
      reply: {
        content: null,
        loading: false,
      },
    };
  },
  emits: ['add-reply', 'close', 'delete-comment', 'update-comment'],
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
    deleteComment(id, toplevel) {
      this.$emit('delete-comment', { id, toplevel });
      if (toplevel) this.$emit('close');
    },
    formatTimestamp,
    openMenu(e, comment, index) {
      this.currentComment = comment;
      this.currentIndex = index;
      if (!this.canComment || this.commentActions.show || this.modifiedCommentActions.length < 1) return; // close it first or abort if there’s nothing to display
      if (e.type === 'contextmenu') {
        this.commentActions.x = e.clientX;
        this.commentActions.y = e.clientY;
        this.commentActions.fromRight = false;
      } else {
        const rect = e.target.getBoundingClientRect();
        this.commentActions.fromRight = true;
        this.commentActions.x = rect.right;
        this.commentActions.y = rect.top;
      }
      this.commentActions.target = e.currentTarget;
      this.commentActions.show = true;
    },
    updateComment(id, changes) {
      this.$emit('update-comment', { id, changes });
    },
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
    max-height: 50vh
    // overflow-y: auto

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
