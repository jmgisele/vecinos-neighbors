import FS from '@isomorphic-git/lightning-fs';
import { join } from '@isomorphic-git/lightning-fs/src/path';

const fs = new FS('mattrfs');

function joinPath(...parts) { // taken from https://github.com/isomorphic-git/lightning-fs/blob/main/src/path.js
  if (parts.length === 0) return '';
  let path = parts.join('/');
  // Replace consecutive '/'
  path = path.replace(/\/{2,}/g, '/');
  return path;
}

async function deleteFileOrFolder(path) {
  const stat = await fs.promises.lstat(path);

  if (stat.isDirectory()) return rmrf(path); // eslint-disable-line no-use-before-define
  return fs.promises.unlink(path);
}

async function rmrf(path) {
  if (!path || typeof path !== 'string' || !path.trim()) throw new Error('Invalid directory');
  if (path.trim() === '/') throw new Error('You may not delete the root directory');

  // assume the folder is not empty since we would’ve used rmdir then
  const entities = await fs.promises.readdir(path);
  await Promise.all(entities.map((entity) => {
    const fullPath = join(path, entity);
    return deleteFileOrFolder(fullPath);
  }));
  await fs.promises.rmdir(path);
}

export default fs.promises;
export { fs as PlainFS, joinPath, rmrf };
