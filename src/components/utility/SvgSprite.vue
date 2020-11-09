<template lang="html">
  <svg width="0" height="0" style="display: none;" v-html="$options.svgSprite" />
</template>

<script>
// Based on: https://css-tricks.com/a-font-like-svg-icon-system-for-vue/
// but using different loaders and svgo for optimization since svg-inline-loader is no longer maintained
const svgContext = require.context(
  '@/assets/icons', // search this directory
  true, // search subdirectories
  /\w+\.svg$/i, // only include SVG files
);

const symbols = svgContext.keys().map((path) => {
  const module = svgContext(path);
  const content = module.default || module;
  const id = path.replace(/^\.\/(.*)\.\w+$/, '$1');
  return content.replace('<svg', `<symbol id="mb_${id}"`).replace('svg>', 'symbol>');
});

export default {
  svgSprite: symbols.join('\n'),
};
</script>
