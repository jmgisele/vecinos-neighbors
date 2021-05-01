import { isValid, parseISO } from 'date-fns';

import defaultFields from '../../data/defaultFields';

const labelledTypes = new Map();
defaultFields.forEach((field) => !field.visualOnly && labelledTypes.set(field.type, field.label));

function generateTypeCandidatesArray(...types) {
  const array = types.map((type) => ({ label: labelledTypes.get(type), value: type }));
  array.push({ label: 'Ignore field', value: null });
  return array;
}

function generateAllTypesArray() {
  return [...labelledTypes.entries().map(([type, label]) => ({ label, value: type })), { label: 'Ignore field', value: null }];
}

function isLanguageCode(code) {
  return (code.length === 2 && /[a-zA-Z]{2}/.test(code)) || (code.length === 5 && /[a-zA-Z]{2}-[a-zA-Z]{2}/.test(code));
}

function identifyFieldTypeByValue(value) {
  const candidate = { type: null, typeCandidates: [] }; // may also contain localised and children if necessary
  const valueType = typeof value;
  if (value === null) candidate.typeCandidates = generateAllTypesArray();
  else if (valueType !== 'object') {
    switch (valueType) {
      case 'string':
        if (value.startsWith('/') && value.includes('.')) { // it’s likely a file
          candidate.type = 'file';
          candidate.typeCandidates = generateTypeCandidatesArray('file', 'text', 'rich text', 'id', 'radio group', 'select');
        } else if (isValid(parseISO(value)) || isValid(new Date(Number.parseInt(value, 10)))) { // it’s likely a date
          candidate.type = 'date';
          candidate.typeCandidates = generateTypeCandidatesArray('date', 'text', 'rich text', 'id', 'radio group', 'select');
        } else if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) { // it’s likely a color
          candidate.type = 'color';
          candidate.typeCandidates = generateTypeCandidatesArray('color', 'text', 'rich text', 'id', 'radio group', 'select');
        } else if (/[\n#*_.<>/]/.test(value)) { // it’s likely a rich text-field (with multiple lines, markdown or html in it)
          candidate.type = 'rich text';
          candidate.typeCandidates = generateTypeCandidatesArray('rich text', 'text', 'id', 'radio group', 'file', 'select');
        } else { // it’s likely a plain text input
          candidate.type = 'text';
          candidate.typeCandidates = generateTypeCandidatesArray('text', 'rich text', 'id', 'radio group', 'color', 'select');
        }
        break;
      case 'number':
        if (value > 946684800000 && isValid(new Date(value))) { // it’s likely a date in ms format (the comparison number is Jan 1st 2000, so we don’t wrongfully classify too many (smaller) numbers as date)
          candidate.type = 'date';
          candidate.typeCandidates = generateTypeCandidatesArray('date', 'number');
        } else {
          candidate.type = 'number';
          candidate.typeCandidates = generateTypeCandidatesArray('number', 'date', 'radio group', 'select');
        }
        break;
      case 'boolean':
        candidate.type = 'toggle';
        candidate.typeCandidates = generateTypeCandidatesArray('toggle', 'radio group', 'select');
        break;
      default:
        candidate.typeCandidates = generateAllTypesArray();
    }
  } else if (Array.isArray(value)) { // that narrows it down a little
    if (value.every((subvalue) => typeof subvalue === 'string' && isLanguageCode(subvalue))) { // it’s likely a content languages field
      candidate.type = 'languages';
      candidate.typeCandidates = generateTypeCandidatesArray('languages', 'list', 'tags', 'checkboxes');
    } else if (value.every((subvalue) => typeof subvalue !== 'object')) { // it’s probably a list of sorts
      candidate.type = 'tags';
      candidate.typeCandidates = generateTypeCandidatesArray('tags', 'list', 'checkboxes', 'languages');
    } else { // it’s a repeating field group
      candidate.type = 'rows';
      candidate.typeCandidates = generateTypeCandidatesArray('rows', 'columns');
      candidate.children = value.map((subvalue) => identifyFieldTypeByValue(subvalue));
    }
  } else if (Object.keys(value).every((subkey) => isLanguageCode(subkey))) { // it’s a localised field
    const { type, typeCandidates } = identifyFieldTypeByValue(Object.values(value)[0]); // look at the first entry and use the type of that
    candidate.type = type;
    candidate.typeCandidates = [...typeCandidates, generateTypeCandidatesArray('group')];
    candidate.localised = true;
  } else if (typeof value.src === 'string' && typeof value.alt !== 'undefined') { // it’s probably an image
    candidate.type = 'image';
    candidate.typeCandidates = generateTypeCandidatesArray('image', 'group');
  } else { // it’s a group
    candidate.type = 'group';
    candidate.typeCandidates = generateTypeCandidatesArray('group');
    candidate.children = generateFieldCandidates(value); // eslint-disable-line no-use-before-define
  }
  return candidate;
}

export function generateFieldCandidates(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const candidate = { key, type: null, typeCandidates: [] };
    const {
      type, typeCandidates, localised, children,
    } = identifyFieldTypeByValue(value);

    candidate.type = type;
    candidate.typeCandidates = typeCandidates;
    if (localised) candidate.localised = localised;
    if (children) candidate.children = children;

    acc.push(candidate);
    return acc;
  }, []);
}

export function generateSchemaFromCandidates(fieldCandidates, tabs) {
  console.log(tabs);
  const schema = fieldCandidates;
  return schema;
}
