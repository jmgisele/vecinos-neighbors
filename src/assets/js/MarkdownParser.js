import MarkdownIt from 'markdown-it';

export default class MarkdownParser {
  constructor(options = { typographer: true, quotes: '“”‘’' }) {
    this.md = new MarkdownIt({ ...options, html: false, xhtmlOut: false });
  }

  parse(content) {
    return this.md.render(content);
  }

  parseInline(content) {
    return this.md.renderInline(content);
  }
}
