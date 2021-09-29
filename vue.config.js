const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

module.exports = {
  chainWebpack: (config) => {
    const svgRule = config.module.rule('svg');

    svgRule.uses.clear();

    svgRule
      .use('raw-loader')
      .loader('raw-loader')
      .end();
  },
  configureWebpack: {
    plugins: [
      new ImageMinimizerPlugin({
        minimizerOptions: {
          plugins: [
            [
              'imagemin-svgo',
              {
                plugins: [
                  {
                    name: 'removeAttrs',
                    params: {
                      attrs: ['id', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
                    },
                  },
                  {
                    name: 'convertColors',
                    params: {
                      currentColor: true,
                    },
                  },
                  'cleanupAttrs',
                  'cleanupEnableBackground',
                  'cleanupIDs',
                  'cleanupNumericValues',
                  'collapseGroups',
                  'convertEllipseToCircle',
                  'convertPathData',
                  'convertShapeToPath',
                  'convertTransform',
                  'inlineStyles',
                  'mergePaths',
                  'minifyStyles',
                  'moveElemsAttrsToGroup',
                  'moveGroupAttrsToElems',
                  'removeComments',
                  'removeDesc',
                  'removeDimensions',
                  'removeDoctype',
                  'removeEditorsNSData',
                  'removeEmptyAttrs',
                  'removeEmptyContainers',
                  'removeEmptyText',
                  'removeHiddenElems',
                  'removeMetadata',
                  'removeNonInheritableGroupAttrs',
                  'removeRasterImages',
                  'removeTitle',
                  'removeUnknownsAndDefaults',
                  'removeUnusedNS',
                  'removeUselessDefs',
                  'removeUselessStrokeAndFill',
                  'removeXMLNS',
                  'removeXMLProcInst',
                  'sortAttrs',
                  'sortDefsChildren',
                ],
              },
            ],
          ],
        },
      }),
    ],
  },
  pwa: {
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusbarStyle: 'default',
    manifestOptions: {
      background_color: '#f4f3ff',
      description: 'Build Schemas and intuitively manage content in this headless CMS that runs right on your device',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
    },
    msTileColor: '#6c5ce7',
    name: 'Mattrbld',
    themeColor: '#6c5ce7',
    workboxOptions: {
      exclude: [],
      skipWaiting: true,
    },
  },
};
