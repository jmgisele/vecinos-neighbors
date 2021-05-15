import { v4 as uuidv4 } from 'uuid';

export default function generateDefaultContentFromSchema(schema, filepath) {
  if (!schema.fields) return {};

  function assembleContent(fields, toplevel) {
    const obj = {};
    // Loop through all fields of a schema
    fields.forEach((field) => {
      if (field.visualOnly) return;

      let value;
      if (field.type === 'group') value = assembleContent(field.value);
      else if (field.type === 'id') {
        if (field.options && field.options.type === 'filepath') value = filepath || null; // we need to fall back to null here because undefined fields don’t get saved
        else if (field.options && field.options.type === 'uuid') value = uuidv4();
        else value = null;
      } else if (field.type === 'date' && field.options.defaultToNow) value = field.options.outputFormat === 'iso' ? new Date().toISOString() : Date.now();
      else value = field.default;

      // check if field is toplevel and in tab with groupAs → put field under that, otherwise put field in object
      if (toplevel && schema.tabs && field.tab) {
        const fieldTab = schema.tabs.find((tab) => tab.label === field.tab);
        if (fieldTab && fieldTab.groupAs) {
          if (!obj[fieldTab.groupAs]) obj[fieldTab.groupAs] = {};
          obj[fieldTab.groupAs][field.key] = value;
        } else obj[field.key] = value;
      } else obj[field.key] = value;
    });
    return obj;
  }

  return assembleContent(schema.fields, true);
}
