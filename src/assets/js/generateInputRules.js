import { InputRule, wrappingInputRule, textblockTypeInputRule } from 'prosemirror-inputrules';

export default function generateInputRules(schema, userOptions = {}) {
  const rules = [];
  const defaults = {
    autoquotes: '“”‘’',
    dashes: true,
    ellipsis: true,
    minHeading: 1,
    maxHeading: 6,
    noDoubleSpace: true,
  };
  const options = { ...defaults, ...userOptions };

  if (typeof options.autoquotes === 'string' && options.autoquotes.length === 4) {
    const [openDouble, closeDouble, openSingle, closeSingle] = options.autoquotes;

    // opening double quotes.
    rules.push(new InputRule(/(?:^|[\s{[(<'"\u2018\u201C])(")$/, openDouble));
    // closing double quotes.
    rules.push(new InputRule(/"$/, closeDouble));
    // opening single quotes.
    rules.push(new InputRule(/(?:^|[\s{[(<'"\u2018\u201C])(')$/, openSingle));
    // closing single quotes.
    rules.push(new InputRule(/'$/, closeSingle));
  }

  if (options.dashes) {
    // en dash
    rules.push(new InputRule(/--$/, '–'));
    // em dash
    rules.push(new InputRule(/–-$/, '—'));
  }

  // ellipsis
  if (options.ellipsis) rules.push(new InputRule(/\.\.\.$/, '…'));

  // prevent double spaces
  if (options.noDoubleSpace) rules.push(new InputRule(/ {2,}$/, ' '));

  let type;

  /* eslint-disable no-cond-assign */
  if (type = schema.nodes.blockquote) rules.push(wrappingInputRule(/^\s*>\s$/, type));
  if (type = schema.nodes.quoteFooter) rules.push(textblockTypeInputRule(/^[-–—]\s$/, type));
  if (type = schema.nodes.codeBlock) rules.push(textblockTypeInputRule(/^```([a-zA-Z]*)?\s$/, type, (match) => ({ lang: match[1] || '' })));
  if (type = schema.nodes.orderedList) rules.push(wrappingInputRule(/^(\d+)\.\s$/, type, (match) => ({ order: +match[1] }), (match, node) => node.childCount + node.attrs.order === +match[1]));
  if (type = schema.nodes.unorderedList) rules.push(wrappingInputRule(/^\s*([-+*])\s$/, type));

  if (options.minHeading && options.maxHeading) {
    const min = Math.max(options.minHeading, 1);
    const max = Math.min(options.maxHeading, 6);

    for (let i = min; i <= max; i += 1) {
      if (type = schema.nodes[`heading${i}`]) rules.push(textblockTypeInputRule(new RegExp(`^#{${i}}\\s$`), type));
    }
  }
  /* eslint-enable no-cond-assign */

  return rules;
}
