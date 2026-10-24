import path from "node:path";
import { fileURLToPath } from "node:url";
import HtmlWebpackPlugin from "html-webpack-plugin";

const directory = path.dirname(fileURLToPath(import.meta.url));
export default (_env, argv) => ({
  mode: argv.mode || "development",
  entry: "./src/index.js",
  output: {
    filename: "main.js",
    path: path.resolve(directory, "dist"),
    clean: true,
  },
  devtool: argv.mode === "production" ? false : "eval-source-map",
  devServer: { static: "./dist", host: "127.0.0.1" },
  plugins: [new HtmlWebpackPlugin({ template: "./src/template.html" })],
  module: { rules: [{ test: /\.css$/i, use: ["style-loader", "css-loader"] }] },
});
