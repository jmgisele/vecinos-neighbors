import { Selection } from 'prosemirror-state';

import {
  wrapIn, setBlockType, chainCommands, toggleMark, exitCode,
} from 'prosemirror-commands';

import {
  wrapInList, splitListItem, liftListItem, sinkListItem,
} from 'prosemirror-schema-list';

import { undo, redo } from 'prosemirror-history';

function insertBreak(state, dispatch) {
  dispatch(state.tr.replaceSelectionWith(state.schema.nodes.br.create()).scrollIntoView());
  return true;
}

function insertHr(state, dispatch) {
  dispatch(state.tr.replaceSelectionWith(state.schema.nodes.horizontalRule.create()).scrollIntoView());
  return true;
}

function exitQuoteFooter(state, dispatch) {
  const { $anchor, $head } = state.selection;
  if ($head.parent.type !== state.schema.nodes.quoteFooter || $anchor.parent.type !== state.schema.nodes.quoteFooter) return false;
  const above = $head.node(-2); // -2 because we need to get outside the blockquote (negative values are interpreted as current depth + value
  const after = $head.indexAfter(-2); // -2 because we need to get outside the blockquote (negative values are interpreted as current depth + value
  const type = state.schema.nodes.paragraph;
  if (!above.canReplaceWith(after, after, type)) return false;
  if (dispatch) {
    const pos = $head.after();
    const tr = state.tr.replaceWith(pos, pos, type.createAndFill());
    tr.setSelection(Selection.near(tr.doc.resolve(pos), 1));
    dispatch(tr.scrollIntoView());
  }
  return true;
}

function clearFormatsIfEmpty(state, dispatch) {
  const { empty, $head } = state.selection;
  if (!empty || $head.pos !== 1 || $head.parent.type === state.schema.nodes.paragraph) return false;
  if (dispatch) {
    dispatch(state.tr.setBlockType($head.pos, $head.pos, state.schema.nodes.paragraph).removeMark($head.pos, $head.pos));
  }
  return true;
}

export default function generateKeymap(schema, vm) {
  const mac = typeof navigator !== 'undefined' ? /Mac/.test(navigator.platform) : false;
  const bindings = {};
  let type;

  bindings['Mod-z'] = undo;
  bindings['Mod-y'] = redo;
  bindings['Mod-Z'] = redo;

  bindings.Backspace = clearFormatsIfEmpty;

  /* eslint-disable no-cond-assign */
  // marks
  if (type = schema.marks.code) {
    bindings['Mod-C'] = toggleMark(type);
  }

  if (type = schema.marks.em) {
    bindings['Mod-i'] = toggleMark(type);
    bindings['Mod-I'] = toggleMark(type);
  }

  if (type = schema.marks.link) {
    bindings['Mod-k'] = vm.openLinkModal;
    bindings['Mod-K'] = vm.openLinkModal;
  }

  if (type = schema.marks.strike) {
    bindings['Mod-s'] = toggleMark(type);
    bindings['Mod-S'] = toggleMark(type);
  }

  if (type = schema.marks.strong) {
    bindings['Mod-b'] = toggleMark(type);
    bindings['Mod-B'] = toggleMark(type);
  }

  // breaks
  if (type = schema.nodes.br) {
    const commandChain = chainCommands(exitCode, exitQuoteFooter, insertBreak);
    bindings['Mod-Enter'] = commandChain;
    bindings['Shift-Enter'] = commandChain;
    if (mac) bindings['Ctrl-Enter'] = commandChain;
  }

  // horizontal rules
  if (type = schema.nodes.horizontalRule) {
    bindings['Mod-_'] = insertHr;
  }

  // lists
  if (type = schema.nodes.listItem) {
    bindings.Enter = splitListItem(type);
    bindings.Tab = sinkListItem(type);
    bindings['Shift-Tab'] = liftListItem(type);
  }

  if (type = schema.nodes.orderedList) {
    bindings['Mod-Shift-9'] = wrapInList(type);
  }

  if (type = schema.nodes.unorderedList) {
    bindings['Mod-Shift-8'] = wrapInList(type);
  }

  // headings
  for (let i = 1; i <= 6; i += 1) {
    if (type = schema.nodes[`heading${i}`]) {
      bindings[`Mod-Shift-${i}`] = setBlockType(type);
    }
  }

  // code blocks
  if (type = schema.nodes.codeBlock) {
    bindings['Mod-?'] = setBlockType(type);
  }

  // blockquotes
  if (type = schema.nodes.blockquote) {
    bindings['Mod->'] = wrapIn(type);

    if (type = schema.nodes.quoteFooter) {
      bindings['Mod-f'] = setBlockType(type);
      if (!bindings.Enter) bindings.Enter = exitQuoteFooter;
      else bindings.Enter = chainCommands(bindings.Enter, exitQuoteFooter);
    }
  }

  // paragraphs
  if (type = schema.nodes.paragraph) {
    bindings['Mod-Shift-0'] = setBlockType(type);
  }
  /* eslint-enable no-cond-assign */

  return bindings;
}
