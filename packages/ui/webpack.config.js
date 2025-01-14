/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const generateWebpackConfig = require("../../webpack.config");

const defaultConfig = {
  presets: ["@babel/env", "@babel/typescript"],
  plugins: [
    "@babel/plugin-syntax-bigint",
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-proposal-class-properties",
    "@babel/transform-runtime",
  ],
  sourceType: "unambiguous",
};
const babelLoader = {
  test: /\.(ts|js)x?$/,
  exclude: /(node_modules|bower_components)/,
  use: {
    loader: "babel-loader",
    options: {
      ...defaultConfig,
      babelrc: false,
      configFile: false,
      cacheDirectory: true,
    },
  },
};
const pkg = require("./package.json");

const currentPath = path.resolve(".");

const config = generateWebpackConfig({
  pkgBaseConfig: {
    output: {
      libraryExport: "default",
    },
  },
  currentPath,
  pkg,
  alias: {},
  module: {
    rules: [
      babelLoader,
      {
        test: /\.css$/i,
        use: { loader: "style-loader", options: {} },
      },
      {
        test: /\.css$/i,
        use: { loader: "css-loader", options: {} },
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: "svg-url-loader",
            options: {
              encoding: "none",
            },
          },
        ],
      },
    ],
  },
});

module.exports = config;
