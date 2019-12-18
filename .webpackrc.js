const path = require('path');

module.exports = {
  entry: 'src/index.js',
  extraBabelPlugins: [
    ['import', { libraryName: 'antd', libraryDirectory: 'es', style: true }],
  ],
  alias: {
    components: path.resolve(__dirname, 'src/components/'),
    common: path.resolve(__dirname, 'src/common/'),
    utils: path.resolve(__dirname, 'src/utils/'),
    routes: path.resolve(__dirname, 'src/routes/'),
    assets: path.resolve(__dirname, 'src/assets/'),
  },
  loaders: [
    {
      test: /\.less$/,
      exclude: /node_modules/,
      loader: 'style-loader!css-loader!less-loader'
    }
  ]
}