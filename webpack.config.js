const path = require("path");
const webpack = require("webpack");
const { camelCase } = require("camel-case");
const { merge } = require("webpack-merge");
const fs = require("fs");

const pkg = require("./package.json");

const getExports = () => fs.readdirSync("./src/components")
    .reduce((output, dir) => {
        const componentPath = `./${dir}`
        return {
            ...output,
            [componentPath]: `./src/components/${dir}/index.tsx`
        }
    }, {})

const exposes = getExports()
const name = camelCase(pkg.name);
const deps = require("./package.json").dependencies;
const shared = {
    ...deps,
    react: {
        eager: true,
        singleton: true,
        requiredVersion: deps.react,
    },
    "react-dom": {
        eager: true,
        singleton: true,
        requiredVersion: deps["react-dom"]
    }
};

const baseConfig = {
    mode: process.env.NODE_ENV === "development" ? "development" : "production",
    resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    },

    module: {
        rules: [
            {
                test: /\.m?js/,
                type: "javascript/auto",
                resolve: {
                    fullySpecified: false,
                },
            },
            {
                test: /\.json$/,
                loader: "json-loader",
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                },
            },
        ],
    },
};

const browserConfig = {
    output: {
        path: path.resolve("./dist/browser"),
    },
    plugins: [
        new webpack.container.ModuleFederationPlugin({
            name,
            filename: "remote-entry.js",
            exposes,
            shared,
        }),
    ],
};

const nodeConfig = {
    target: "node",
    output: {
        path: path.resolve("./dist/node"),
    },
    plugins: [
        new webpack.container.ModuleFederationPlugin({
            name,
            filename: "remote-entry.js",
            library: { type: "commonjs" },
            exposes,
            shared,
        }),
    ],
};

module.exports = [
    merge(baseConfig, browserConfig),
    merge(baseConfig, nodeConfig),
];