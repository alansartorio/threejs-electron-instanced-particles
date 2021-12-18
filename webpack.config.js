const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

const common = {
  devtool: "inline-source-map",
  mode: "development",
  module: {
    rules: [
      {
        test: /\.(mtl|obj)$/i,
        use: "file-loader",
      },
      {
        test: /\.(glsl)$/i,
        use: "raw-loader",
      },
      {
        test: /\.tsx?$/i,
        use: "ts-loader",
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
};

module.exports = [
  Object.assign({}, common, {
    target: "electron-renderer",
    entry: "./src/renderer/renderer.ts",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "renderer-bundle.js",
    },
    plugins: [
      new HtmlWebpackPlugin({ template: "src/renderer/index.html" }),
      new MiniCssExtractPlugin(),
    ],
  }),
  Object.assign({}, common, {
    target: "electron-main",
    entry: "./src/main/main.ts",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "main-bundle.js",
    },
  }),
  // Object.assign({}, common, {
  //   target: "node",
  //   entry: "./src/main/preload.ts",
  //   output: {
  //     path: path.resolve(__dirname, "dist"),
  //     filename: "preload.js",
  //   },
  // }),
];
