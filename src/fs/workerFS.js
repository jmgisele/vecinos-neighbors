import FsWorker from 'worker-loader!./fs.worker'; // eslint-disable-line

import MagicPortal from '../assets/js/FixedMagicPortal';

const worker = new FsWorker();
const portal = new MagicPortal(worker);

async function loadImage(path) {
  const workerThread = await portal.get('workerThread');
  return workerThread.loadImage(path);
}

async function rmrf(path) {
  const workerThread = await portal.get('workerThread');
  return workerThread.rmrf(path);
}

export { loadImage, rmrf }; // eslint-disable-line import/prefer-default-export
