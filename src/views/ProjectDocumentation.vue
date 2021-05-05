<template lang="html">
  <div class="project-documentation">
    <article v-html="content" />
    <pre v-if="Object.keys(frontmatter).length > 0" :class="{ dark }">{{frontmatter}}</pre>
  </div>
</template>

<script>
import * as matter from 'gray-matter';

import fs from '../fs';
import MarkdownParser from '../assets/js/MarkdownParser';

const md = new MarkdownParser();

async function readAndParseFile(path) {
  try {
    const file = matter(await fs.readFile(path, 'utf8'));
    const renderedMd = md.parse(file.content);
    const unparsedFrontmatter = file.data;
    return { content: renderedMd, error: null, frontmatter: unparsedFrontmatter };
  } catch (err) {
    return { content: null, error: err, frontmatter: null };
  }
}

export default {
  async beforeRouteEnter(to, from, next) {
    if (to.params.path) {
      const { content, error, frontmatter } = await readAndParseFile(to.params.path);

      if (!error) {
        next((vm) => {
          vm.frontmatter = frontmatter; // eslint-disable-line no-param-reassign
          vm.content = content; // eslint-disable-line no-param-reassign
        });
        return;
      }
      next(error);
      return;
    }
    next({ name: 'NotFound' });
  },
  async beforeRouteUpdate(to) {
    if (to.params.path) {
      const { content, error, frontmatter } = await readAndParseFile(to.params.path);
      if (error) return error;
      this.frontmatter = frontmatter;
      this.content = content;
      return true;
    }
    return { name: 'NotFound' };
  },
  data() {
    return {
      content: null,
      frontmatter: null,
    };
  },
  props: {
    dark: Boolean,
  },
};
</script>

<style lang="stylus" scoped>
@require '../assets/styles/colors'

.project-documentation
  padding: 0 1rem
  height: 100%
  overflow: auto

  > pre
    max-width: 60rem
    margin-left: auto
    margin-right: auto
    background-color: transparent
    color: $text-secondary
    border: 0.0625rem dashed $text-tertiary

    &.dark
      color: $text-secondary-dark
      border-color: $text-tertiary-dark

  > article
    padding: 4rem 0
    max-width: 40rem
    margin: 0 auto

    > :first-child
      margin-top: 0

    ::v-deep(img)
      max-width: 100%
</style>
