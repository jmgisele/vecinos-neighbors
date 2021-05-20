function validate(field, parent, groupAsKey, index) {
  const {
    key, value: subfields, localised, validation,
  } = field;
  let value;
  let errors;

  if (groupAsKey) value = parent[groupAsKey][key];
  else if (index) value = parent[index];
  else value = parent[key];

  // validate subfields, if any
  if (subfields) {
    errors = new Map();
    if (Array.isArray(value)) { // rows, columns, etc. (anything  that is an array of object basically)
      value.forEach((subvalue, i) => {
        const fieldType = subfields.find((subfield) => subfield.key === subvalue.___mb_type);
        const error = validate(fieldType, value, null, i);
        if (error) errors.set(i, error);
      });
    } else { // field groups (so objects (but not localised fields))
      subfields.forEach((subfield) => {
        const error = validate(subfield, value);
        if (error) errors.set(subfield.key, error);
      });
    }
  }

  // validate the field itself
  if (validation) {
    if (localised && typeof value === 'object') { // localised field with localised values
      const langs = Object.keys(value);

      langs.forEach((lang) => {
        const error = null; // TODO: validate according to rules
        if (error) {
          if (!errors) errors = new Map();
          errors.set(lang, error);
        }
      });
    } else {
      const error = null; // TODO: validate according to rules
      if (error && errors) errors.set(key, error); // this might happen in columns and rows when subfields have errors and the field itself has an error
      else errors = error;
    }
  }

  return errors;
}

export default function validateContent(content, schema) {
  if (typeof content !== 'object') throw new TypeError('content has to be an object');
  if (typeof schema !== 'object') throw new TypeError('schema has to be an object');

  const { fields, tabs } = schema;
  const errors = new Map();

  if (!tabs || tabs.length === 0) {
    fields.forEach((field) => {
      const error = validate(field, content);
      if (error) errors.set(field.key, error);
    });
  } else {
    tabs.forEach((tab, index) => {
      fields
        .filter((field) => field.tab === tab.label || (index === 0 && !field.tab))
        .forEach((field) => {
          const error = validate(field, content, tab.groupAs);
          if (error) errors.set(field.key, error);
        });
    });
  }

  return errors;
}
