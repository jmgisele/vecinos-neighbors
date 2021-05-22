import userInputToRegex from './userInputToRegex';

export function validateField(value, type, rules) {
  if (!rules) return '';

  let error = '';
  let valueToCheck = value;

  switch (type) {
    case 'languages':
      valueToCheck = value || [];
      if (rules.min && valueToCheck.length < rules.min) {
        if (rules.min === 1) error = 'At least one language is required';
        else error = `At least ${rules.min} languages are required`;
      }
      break;
    case 'text':
    case 'rich text':
      valueToCheck = value || '';
      if (rules.required && !valueToCheck) error = 'This field is required';
      else if (rules.enforceMinMax && (rules.min || rules.max)) {
        if (rules.min && valueToCheck.length < rules.min) error = 'The value is too short';
        if (rules.max && valueToCheck.length > rules.max) error = 'The value is too long';
      } else if (rules.regex) {
        try {
          if (!userInputToRegex(rules.regex).test(valueToCheck)) error = rules.regexError || 'Invalid value';
        } catch (err) {
          // do nothing, if we end up here it’s because the user-input regex was invalid
        }
      }
      break;
    default:
      if (rules.required && !valueToCheck) error = 'This field is required';
  }
  return error;
}

function validate(field, parent, languages, groupAsKey, index) {
  const {
    key, value: subfields, localised, type, validation,
  } = field;
  let value;
  let errors;

  if (groupAsKey) value = (parent[groupAsKey] && parent[groupAsKey][key]) || {}; // need to fall back to an empty object here in case the groupAs-field doesn’t exist
  else if (index) value = parent[index];
  else value = parent[key];

  // validate subfields, if any
  if (subfields) {
    if (Array.isArray(value)) { // rows, columns, etc. (anything  that is an array of object basically)
      value.forEach((subvalue, i) => {
        const fieldType = subfields.find((subfield) => subfield.key === subvalue.___mb_type);
        const error = validate(fieldType, value, languages, null, i);
        if (error) {
          if (!errors) errors = new Map();
          errors.set(i, error);
        }
      });
    } else { // field groups (so objects (but not localised fields))
      subfields.forEach((subfield) => {
        const error = validate(subfield, value, languages);
        if (error) {
          if (!errors) errors = new Map();
          errors.set(subfield.key, error);
        }
      });
    }
  }

  // validate the field itself
  if (validation) {
    if (localised) { // localised field with localised values
      languages.forEach((lang) => {
        const error = validateField(value ? value[lang] : null, type, validation);
        if (error) {
          if (!errors) errors = new Map();
          errors.set(lang, error);
        }
      });
    } else {
      const error = validateField(value, type, validation);
      if (error && errors) errors.set(key, error); // this might happen in columns and rows when subfields have errors and the field itself has an error
      else errors = error;
    }
  }

  return errors;
}

export default function validateContent(content, schema, languages) {
  if (typeof content !== 'object') throw new TypeError('content has to be an object');
  if (typeof schema !== 'object') throw new TypeError('schema has to be an object');

  const { fields, tabs } = schema;
  const errors = new Map();

  if (!tabs || tabs.length === 0) {
    fields.forEach((field) => {
      const error = validate(field, content, languages);
      if (error) errors.set(field.key, error);
    });
  } else {
    tabs.forEach((tab, index) => {
      fields
        .filter((field) => field.tab === tab.label || (index === 0 && !field.tab))
        .forEach((field) => {
          const error = validate(field, content, languages, tab.groupAs);
          if (error) errors.set(field.key, error);
        });
    });
  }

  return errors;
}
