// pre-build.js
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configuration
const CONFIG = {
  source: './cms/media/',     // Change this to your source directory
  destination: './astro/public/',  // Change this to your destination directory
  verbose: true,                 // Log each copied file
	exclude: []
};

function copyFileRecursive(src, dest, excludeList) {
  if (!existsSync(src)) {
    console.warn(`[pre-build] Source directory "${src}" does not exist. Skipping.`);
    return;
  }

  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const items = readdirSync(src);

  for (const item of items) {
    if (excludeList.some(ex => item.includes(ex))) {
      if (CONFIG.verbose) console.log(`[pre-build] ⏭️  Skip: ${relative(process.cwd(), join(src, item))}`);
      continue;
    }

    const srcPath = join(src, item);
    const destPath = join(dest, item);
    const stats = statSync(srcPath);

    if (stats.isDirectory()) {
      copyFileRecursive(srcPath, destPath, excludeList);
    } else {
      mkdirSync(dirname(destPath), { recursive: true });
      copyFileSync(srcPath, destPath);
      if (CONFIG.verbose) console.log(`[pre-build] ✅ Copied: ${relative(process.cwd(), srcPath)}`);
    }
  }
}

try {
  console.log('[pre-build] Starting file copy…');
  copyFileRecursive(CONFIG.source, CONFIG.destination, CONFIG.exclude);
  console.log('[pre-build] Done!');
} catch (error) {
  console.error('[pre-build] Error:', error.message);
  process.exit(1);
}
