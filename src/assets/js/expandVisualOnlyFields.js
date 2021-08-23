/**
 * A function to recursively expand any fields with visualOnly === true and a value
 * @param {array} fields - the array of fields to process
 */
export default function expandVisualOnlyFields(fields) {
  return fields.reduce((acc, field) => {
    if (field.visualOnly && Array.isArray(field.value) && field.value.length > 0) return acc.concat(expandVisualOnlyFields(field.value));
    acc.push(field);
    return acc;
  }, []);
}
