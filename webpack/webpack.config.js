const webpack = require("webpack");
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
module.exports = {
   mode: "development",
   devtool: "source-map",
   entry: {
      background: path.resolve(__dirname, "..", "src", "background.ts"),
      content: path.resolve(__dirname, "..", "src", "content.ts"),
      options: path.resolve(__dirname, "..", "src", "options.ts"),
      inpage:path.resolve(__dirname,"..","src","inpage.ts")
   },
   output: {
      path: path.join(__dirname, "../dist"),
      filename: "[name].js",
   },

   resolve: {
      extensions: [".ts", ".js"],
      fallback:{       
         fs: false,
         path: false,
         stream: require.resolve("stream-browserify"),
         process: require.resolve("process/browser"),
         "buffer": require.resolve("buffer/")
      }
   },
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            loader: "ts-loader",
            exclude: /node_modules/,
         },
      ],
   },

   plugins: [
      new CopyPlugin({
         patterns: [{from: '.', to: '.',context: "public"}]
      }),

      new webpack.ProvidePlugin({
         Buffer: ["buffer", "Buffer"],
         process: ["process"],
       }),
      
   ],
};