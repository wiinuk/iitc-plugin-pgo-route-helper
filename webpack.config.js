//@ts-check
const UserScriptPlugin = require("./webpack-user-script-plugin");
const TypedCssModulePlugin = require("./webpack-typed-css-module-plugin");
const { name: packageName } = require("./package.json");
const webpack = require("webpack");

const entry = `./source/${packageName}.user.ts`;

/** @type {import("webpack").Configuration} */
const config = {
    mode: "production",
    entry,
    plugins: [
        new webpack.DefinePlugin({
            "process.browser": true,
        }),
        UserScriptPlugin,
        new TypedCssModulePlugin(),
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        allowTsInNodeModules: true,
                    },
                },
            },
            {
                test: /\.svg$/,
                type: "asset/source",
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
    optimization: {
        minimize: false,
    },
    performance: {
        // ユーザスクリプトは単一ファイルでの配布が前提なのでサイズ上限を増やす
        maxAssetSize: 300 * 1024, // 300KiB
        maxEntrypointSize: 300 * 1024, // 300KiB
    },
    devtool: "nosources-source-map",
    output: {
        path: __dirname,
        filename: `${packageName}.user.js`,
    },
};
module.exports = config;
