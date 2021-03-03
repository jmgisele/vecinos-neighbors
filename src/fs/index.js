import FS from '@isomorphic-git/lightning-fs';

const fs = new FS('mattrfs');

function joinPath(...parts) { // taken from https://github.com/isomorphic-git/lightning-fs/blob/main/src/path.js
  if (parts.length === 0) return '';
  let path = parts.join('/');
  // Replace consecutive '/'
  path = path.replace(/\/{2,}/g, '/');
  return path;
}

export default fs.promises;
export { fs as PlainFS, joinPath };
