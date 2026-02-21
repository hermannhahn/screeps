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
    clean: false, // Não limpar a pasta dist para não remover os outros arquivos .js
  },
  optimization: {
    minimize: true,
  },
};
