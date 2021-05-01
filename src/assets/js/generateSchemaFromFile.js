export function generateFieldCandidates(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    console.log(key, value);
    acc.push({
      key: '',
      type: '',
      typeCandidates: [],
    });
    return acc;
  }, []);
}

export function generateSchemaFromCandidates(fieldCandidates) {
  const schema = fieldCandidates;
  return schema;
}
