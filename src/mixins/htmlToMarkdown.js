import TurndownService from 'turndown/lib/turndown.browser.es';

const service = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
});

service.addRule('strikethrough', {
  filter: ['del', 's', 'strike'],
  replacement: (content) => `~~${content}~~`,
});

service.addRule('list-indent', {
  filter: (node) => node.className.includes('ql-indent') && node.nodeName === 'LI',
  replacement(content, node, options) {
    const cleanContent = content
      .replace(/^\n+/, '')
      .replace(/\n+$/, '\n')
      .replace(/\n/gm, '\n    ');
    let prefix = `${options.bulletListMarker}   `;
    const parent = node.parentNode;
    const indentLevel = window.parseInt(node.className.replace('ql-indent-', ''), 10);
    if (parent.nodeName === 'OL') {
      prefix = '1.   ';
    }
    return `${' '.repeat(indentLevel * 4)}${prefix}${cleanContent}${(node.nextSibling && !/\n$/.test(cleanContent) ? '\n' : '')}`;
  },
});

service.addRule('custom-line-breaks', {
  filter: (node) => node.nodeName === 'P' && ((node.nextElementSibling && node.nextElementSibling.className.includes('linebreak-true')) || node.className.includes('linebreak-true')),
  replacement: (content, node, options) => `${content + options.br}\n`,
});

service.addRule('fencedCodeBlock', {
  filter: (node, options) => options.codeBlockStyle === 'fenced' && node.nodeName === 'PRE',
  replacement: (content, node, options) => {
    const className = node.getAttribute('class') || '';
    const language = (className.match(/lang-(\S+)/) || [null, ''])[1];

    // we need to remove the last newline before the fence if there is one
    return `\n\n${options.fence}${language}\n${node.textContent.replace(/\n+$/, '')}\n${options.fence}\n\n`;
  },
});

export default function htmlToMarkdown(html) {
  return service.turndown(html);
}
