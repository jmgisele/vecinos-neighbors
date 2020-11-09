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
                    removeAttrs: {
                      attrs: ['id', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
                    },
                  },
                  {
                    convertColors: {
                      currentColor: true,
                    },
                  },
                  { removeRasterImages: true },
                  { removeViewBox: false },
                  { removeXMLNS: true },
                  { removeDimensions: true },
                  { sortAttrs: true },
                ],
              },
            ],
          ],
        },
      }),
    ],
  },
};
