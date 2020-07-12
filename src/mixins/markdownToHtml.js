import * as MarkdownIt from 'markdown-it';
import MarkdownItAnchor from 'markdown-it-anchor';
import * as MarkdownItEmoji from 'markdown-it-emoji';
import * as MarkdownItLinkAttributes from 'markdown-it-link-attributes';

const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  typographer: true,
  quotes: '“”‘’',
});

md.use(MarkdownItAnchor, { level: 1 });
md.use(MarkdownItEmoji);

md.use(MarkdownItLinkAttributes, {
  attrs: {
    target: '_blank',
    rel: 'noopener nofollow noreferrrer',
  },
  pattern: /^https?/,
});

export default function markdownToHtml(value, inline = false) {
  if (typeof value !== 'string' || !value || !value.trim()) return '';
  if (inline) return md.renderInline(value);
  return md.render(value);
}
