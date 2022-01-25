// path: creating path using elements we give
const path = require("path");

// plugin for separating Javascript and CSS
const MiniCssExtractPlugin = require("mini-css-extract-plugin").default;

// console.log(path.resolve(__dirname, "assets", "js"));
// => /home/ubuntu/wetube/assets/js

const BASE_JS_PATH = "./src/client/js/";

module.exports = {
  entry: {
    main: BASE_JS_PATH + "main.js",
    videoPlayer: BASE_JS_PATH + "videoPlayer.js",
    recoder: BASE_JS_PATH + "recoder.js",
    commentSection: BASE_JS_PATH + "commentSection.js",
  },
  // watch: true,   => we replace it in package.json with -w option
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/styles.css",
    }),
  ],
  output: {
    filename: "js/[name].js",
    path: path.resolve(__dirname, "assets"),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [["@babel/preset-env", { targets: "defaults" }]],
          },
        },
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
        // write down the loaders in reverse order
        // because webpack interprets loader in reverse order.
        // MiniCssExtractPlugin extracts CSS from Javascript and makes separate CSS files.
      },
    ],
  },
};
