import FS from '@isomorphic-git/lightning-fs';

const fs = new FS('mattrfs');

export default fs.promises;
export { fs as PlainFS };
