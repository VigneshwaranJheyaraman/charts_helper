/**
 * Webpack properties which has to be passed to the function
 * @interface WebpackProps
 * @property {any} webpack - webpack npm module
 * @property {any} cssPlugin - extract-css-chunks-webpack-plugin npm package
 * @property {any} copyPlugin - copy-webpack-plugin npm package
 * @property {any} htmlWebpackPlugin - html-webpack-plugin npm package
 * @property {any} htmlWebpackPartialsPlugin - html-webpack-partials-plugin npm package
 * @property {any} terserPlugin - terser-webpack-plugin npm package
 * @property {any} sourceDirectory - The source directory source location
 * @property {any} path - path npm package
 * @property {any} productionEnv - the object, which must be passed to the source code while bundling, which can be accessed by process.env
 * @property {any} developmentEnv - the object, which must be passed to the source code while bundling, which can be accessed by process.env
 * @property {any} cleanWebpackPlugin - clean-webpack-plugin npm package
 */
interface WebpackProps {
  webpack: any;
  cssPlugin: any;
  copyPlugin: any;
  htmlWebpackPlugin: any;
  htmlWebpackPartialsPlugin?: any;
  terserPlugin: any;
  sourceDirectory: string;
  path: any;
  productionEnv: any;
  developmentEnv: any;
  cleanWebpackPlugin: any;
}
/**
 * @category Configurations
 * @method getBasicWebpackConfigForChartIQ
 * @description Returns a function, which can be exported on webpack.config.js passing the environment of webpack
 * Check for more details https://v4.webpack.js.org/configuration/configuration-types/#exporting-a-function
 * @param {WebpackProps} props - props which will return a configuration for webpack to process
 */
export function getBasicWebpackConfigForChartIQ(props: WebpackProps): any {
  (environment: any) => {
    environment = environment || {};
    const isProduction: boolean = environment.prod || false,
      deploymentDirectory: string = props.path.resolve(
        props.sourceDirectory,
        "..",
        `${isProduction ? "dist" : "dev"}`
      );
    return {
      entry: {
        /**
         * Specify the polyfill.js inside your source directory to add polyfill
         * @property {string} polyfill
         */
        polyfill: props.path.join(props.sourceDirectory, "polyfill.js"),
        app: props.path.join(props.sourceDirectory, "app.js"),
      },
      mode: isProduction ? "production" : "development",
      module: {
        rules: [
          {
            test: /\.js$/,
            use: [
              {
                loader: "babel-loader",
                options: {
                  presets: [
                    [
                      "@babel/preset-env",
                      {
                        targets: [
                          "defaults",
                          ">0.001%",
                          "ie 11",
                          "chrome >= 15",
                        ],
                        useBuiltIns: "entry",
                        corejs: 3.18,
                      },
                    ],
                  ],
                },
              },
            ],
          },
          {
            test: /\.(s)?css$/,
            use: [
              {
                loader: props.cssPlugin.loader,
                options: { publicPath: "css/" },
              },
              "css-loader",
              "sass-loader",
            ],
          },
          {
            test: /\.(jpg|gif|png|svg|cur)$/,
            use: [
              {
                loader: "file-loader",
                options: {
                  name: "[name].[ext]",
                  outputPath: function (
                    url: string,
                    resourcePath: string,
                    context: any
                  ) {
                    return (
                      (/images/.test(resourcePath) ? "" : "css") + "/img/" + url
                    );
                  },
                  publicPath: "img/",
                },
              },
            ],
          },
        ],
      },
      optimization: {
        splitChunks: {
          chunks: "all",
          maxInitialRequests: Infinity,
          minSize: 1000,
          name: false,
          cacheGroups: {
            components: {
              name: "components",
              priority: 10,
              test: /[\\/]js[\\/]component(s|UI)[.]js/,
            },
            addons: {
              name: "addOns",
              priority: 20,
              test: /[\\/](plugins[\\/].+[.](js(on)?|html)|js[\\/]addOns[.]js)/,
            },
            thirdparty: {
              name: "thirdparty",
              priority: 30,
              test: /[\\/]node_modules|[\\/]thirdparty[\\/]/,
            },
            examples: {
              name: "examples",
              priority: 40,
              test: /[\\/]examples[\\/].+[.]js/,
            },
          },
        },
      },
      output: {
        chunkFilename: `js/chartiq-[name].${
          isProduction ? "[contentHash]" : "bundle"
        }.js`,
        filename: `js/chartiq-core.${
          isProduction ? "[contentHash]" : "bundle"
        }.js`,
        path: deploymentDirectory,
      },
      plugins: [
        new props.terserPlugin({
          exclude: /node_modules|charting_library/,
          extractComments: false,
          terserOptions: {
            ecma: 5,
          },
        }),
        new props.copyPlugin({
          patterns: [
            {
              from: props.path.resolve(
                props.sourceDirectory,
                "js/thirdparty/html2canvas.min.js"
              ),
              to: "js/thirdparty/html2canvas.min.js",
            },
          ],
        }),
        new props.cssPlugin({
          filename: `./css/chartiq.${
            isProduction ? "[contenthash]" : "bundle"
          }.css`,
        }),
        new props.htmlWebpackPlugin({
          template: props.path.resolve(props.sourceDirectory, "index.html"),
          favicon: props.path.resolve(props.sourceDirectory, "favicon.ico"),
        }),
        new props.htmlWebpackPartialsPlugin({
          path: props.path.resolve(
            props.sourceDirectory,
            "adv.ciq.template.html"
          ),
          location: "cq-context",
        }),
        new props.webpack.DefinePlugin({
          __TREE_SHAKE__: JSON.stringify(isProduction),
          process: JSON.stringify({
            env: isProduction ? props.productionEnv : props.developmentEnv,
          }),
        }),
      ],
      resolve: {
        //specifying the chartiq's location for webpack to consider chartiq as npm package
        alias: {
          chartiq: props.sourceDirectory,
        },
      },
    };
  };
}
/**
 * @category Configurations
 * @method getBasicWebpackConfigForTradingView
 * @description Returns a function, which will specify the webpack config for Trading-view's implementation using
 * @param {WebpackProps} props - properties to return webpack configuration
 * @returns {any}
 */
export function getBasicWebpackConfigForTradingView(props: WebpackProps): any {
  return (environment: any) => {
    environment = environment || {};
    const isProduction: boolean = environment.prod || false,
      deploymentDirectory: string = props.path.resolve(
        props.sourceDirectory,
        "..",
        `${isProduction ? "dist" : "dev"}`
      );
    return {
      entry: {
        polyfill: props.path.resolve(props.sourceDirectory, "polyfill.ts"),
        main: props.path.resolve(props.sourceDirectory, "index.ts"),
      },
      output: {
        path: deploymentDirectory,
        filename: `[name].[contentHash].js`,
        chunkFilename: `[name].[contentHash].js`,
      },
      optimization: {
        minimize: true,
        splitChunks: {
          name: false,
          chunks: "all",
          minSize: 0.5e3,
          maxInitialRequests: Infinity,
          cacheGroups: {
            feeds: {
              name: "feed",
              test: props.path.resolve(
                props.sourceDirectory,
                "charts",
                "feeds"
              ),
            },
            markets: {
              name: "market",
              test: props.path.resolve(
                props.sourceDirectory,
                "charts",
                "markets"
              ),
            },
            utils: {
              name: "utils",
              test: props.path.resolve(
                props.sourceDirectory,
                "charts",
                "utils"
              ),
            },
            thirdpary: {
              name: "thirdparty",
              test: /[\\/]node_modules/,
            },
          },
        },
        minimizer: [
          new props.htmlWebpackPlugin({
            template: props.path.resolve(
              props.sourceDirectory,
              "template.html"
            ),
            favicon: props.path.resolve(props.sourceDirectory, "favicon.ico"),
          }),
          new props.cssPlugin({
            filename: `[name].[contentHash].css`,
          }),
          new props.terserPlugin({
            exclude: /node_modules|charting_library/,
            extractComments: false,
            terserOptions: {
              ecma: 5,
            },
          }),
          new props.copyPlugin({
            patterns: [
              {
                from: props.path.resolve(
                  props.sourceDirectory,
                  "charting_library"
                ),
                to: props.path.resolve(deploymentDirectory, "charting_library"),
              },
              {
                from: props.path.resolve(props.sourceDirectory, "sw.js"),
                to: props.path.resolve(deploymentDirectory, "sw.js"),
              },
            ],
          }),
          new props.cleanWebpackPlugin(),
        ],
      },
      plugins: [
        new props.webpack.DefinePlugin({
          process: JSON.stringify({
            env: isProduction ? props.productionEnv : props.developmentEnv,
          }),
        }),
      ],
      resolve: {
        modules: ["node_modules", "charting_library"],
        extensions: [".ts", ".js"],
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            use: [
              {
                loader: "babel-loader",
                options: {
                  babelrc: true,
                },
              },
              { loader: "ts-loader" },
            ],
            exclude: /node_modules|charting_library/,
          },
          {
            test: /\.css$/,
            use: [props.cssPlugin.loader, "css-loader"],
          },
        ],
      },
    };
  };
}
