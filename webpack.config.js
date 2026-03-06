const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/main.ts',
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: [/node_modules/, /screeps-steamless-client/],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs',
    clean: false, // Do not clean the dist folder to avoid removing other .js files
  },
  optimization: {
    minimize: true,
  },
};
