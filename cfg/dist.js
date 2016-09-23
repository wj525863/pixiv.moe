'use strict';

let path = require('path');
let webpack = require('webpack');
let fileSystem = require('fs');
let minify = require('html-minifier').minify;

let baseConfig = require('./base');
let defaultSettings = require('./defaults');

// Add needed plugins here
let BowerWebpackPlugin = require('bower-webpack-plugin');
let ExtractTextPlugin = require('extract-text-webpack-plugin');

let config = Object.assign({}, baseConfig, {
  entry: [
    'es6-promise',
    'whatwg-fetch',
    path.join(__dirname, '../src/index')
  ],
  output: {
    path: path.join(__dirname, '/../dist/assets'),
    filename: 'bundle-[hash].js',
    publicPath: defaultSettings.publicPath
  },
  cache: false,
  devtool: 'sourcemap',
  plugins: [
    new webpack.optimize.DedupePlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    }),
    new BowerWebpackPlugin({
      searchResolveModulesDirectories: false
    }),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.NoErrorsPlugin(),
    new ExtractTextPlugin('bundle-[hash].css'), function() {
      // via https://github.com/webpack/webpack/issues/86#issuecomment-179957661
      this.plugin('done', function(statsData) {
        let stats = statsData.toJson();

        if (!stats.errors.length) {
          let htmlFileName = '/../dist/index.html';
          let html = fileSystem.readFileSync(path.join(__dirname, htmlFileName), 'utf8');

          let htmlOutput = html.replace(
            /<script\s+src=(["'])(.+?)bundle\.js\1/i,
            '<script src=$1$2' + stats.assetsByChunkName.main[0] + '$1');

          htmlOutput = htmlOutput.replace(
            /<link\s+rel="stylesheet"\s+href=(["'])(.+?)bundle\.css\1/i,
            '<link rel="stylesheet" href=$1$2' + stats.assetsByChunkName.main[1] + '$1');

          htmlOutput = minify(htmlOutput, {
            collapseWhitespace: true,
            removeComments: true,
            minifyJS: true,
            processConditionalComments: true
          });

          fileSystem.writeFileSync(
            path.join(__dirname, '/../dist', htmlFileName), htmlOutput);
        }
      });
    }
  ],
  module: defaultSettings.getDefaultModules()
});

// Add needed loaders to the defaults here
config.module.loaders.push({
  test: /\.(js|jsx)$/,
  loader: 'babel',
  include: [].concat(
    config.additionalPaths,
    [path.join(__dirname, '/../src')]
  )
}, {
  test: /\.css$/,
  loader: ExtractTextPlugin.extract('css-loader')
});

module.exports = config;