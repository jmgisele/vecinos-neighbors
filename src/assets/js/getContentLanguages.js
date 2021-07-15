export default function getContentLanguages(content, schema, defaultLanguages) {
  if (!schema.fields) return defaultLanguages;
  const languagesField = schema.fields.find((field) => field.type === 'languages');
  let languages;

  if (languagesField) {
    const fieldTab = schema.tabs && schema.tabs.find((tab) => tab.label === languagesField.tab);
    if (fieldTab.groupAs) languages = content[fieldTab.groupAs] && content[fieldTab.groupAs][languagesField.key];
    else languages = content[languagesField.key];
  }

  if (!languages || languages.length === 0) return defaultLanguages;
  return languages;
}
