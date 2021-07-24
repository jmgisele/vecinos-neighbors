import { pathBasename, pathDirname } from '../../fs';

/**
 * A function to return a default set of fields containing file information
 * @param {string} path - The file path to work on. Should end with a file extension
 * @param {string} projectDir - The root directory of the project, i.e. /porjects/projectId
 * @param {string} collectionDir - The dir property of the Collection the file belongs to
 */
export default function generateDefaultFilePathFields(path, projectDir, collectionDir) {
  const pathWithoutExtension = path.substring(0, path.lastIndexOf('.')); // we know there’s a .something at the end that we want to strip off

  return {
    filename: pathBasename(pathWithoutExtension),
    fileExtension: path.substring(path.lastIndexOf('.')),
    filepath: {
      collection: pathWithoutExtension.replace(`${collectionDir}/`, '').split('/'),
      content: pathWithoutExtension.replace(pathDirname(`${collectionDir}/`), '').split('/'),
      full: pathWithoutExtension.replace(`${projectDir}/`, '').split('/'),
    },
  };
}
