import FS from '@isomorphic-git/lightning-fs';
import { join } from '@isomorphic-git/lightning-fs/src/path';

const fs = new FS('mattrfs');

async function deleteFileOrFolder(path) {
  const stat = await fs.promises.lstat(path);

  if (stat.isDirectory()) return rmrf(path); // eslint-disable-line no-use-before-define
  return fs.promises.unlink(path);
}

async function rmrf(path) {
  if (!path || typeof path !== 'string' || !path.trim()) throw new Error('Invalid directory');
  if (path.trim() === '/') throw new Error('You may not delete the root directory');

  try {
    const entities = await fs.promises.readdir(path);
    await Promise.all(entities.map((entity) => {
      const fullPath = join(path, entity);
      return deleteFileOrFolder(fullPath);
    }));
    await fs.promises.rmdir(path);
  } catch (err) {
    if (err.code === 'ENOTDIR') await fs.promises.unlink(path); // it must be a file
    else throw err;
  }
}

// Adapted from https://github.com/isomorphic-git/isomorphic-git/blob/main/src/models/FileSystem.js
async function exists(filepath) {
  try {
    await fs.promises.stat(filepath);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return false;
    throw err;
  }
}

export default fs.promises;
export {
  exists,
  fs as PlainFS,
  join as joinPath,
  rmrf,
};
