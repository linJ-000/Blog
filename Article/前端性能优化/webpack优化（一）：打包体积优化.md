# webpack优化（一）：打包体积优化

*该文章基于webpack4*

* html压缩
* 抽离css（mini-css-extract-plugin）
* css压缩（optimize-css-assets-webpack-plugin）
* js压缩
* 打包依赖分析（webpack-bundle-analyzer）
* @babel/polyfill按需引入
* 组件懒加载
* 代码拆分（splitChunks）
* tree sharking
* externals

## html压缩

`html-wepack-plugin`插件可以对模板进行配置，同时也能对html进行压缩。
```js
const HtmlWebpackPlugin = require("html-wepack-plugin")

plugins: [
    new HtmlWebpackPlugin({
        // ...
        minify: { // html压缩
            removeComments: true, // 移除HTML中的注释
            collapseWhitespace: true, // 删除空白符和换行符
            minifyCSS: true // 压缩行内css
        }
    })
]
```
压缩html同时可以处理相邻行内元素间空白间隙的问题。

## 抽离css（mini-css-extract-plugin）
处理css一般需要`css-loader`和`style-loader`。

`css-loader`将css的内容加入到js中，`style-loader`将js中的css以`<style>`标签的方式插入html中。

如果要将css抽离成单独的文件，可以使用`mini-css-extract-plugin`插件。抽离css文件可以减小单个文件的体积，有效利用浏览器的并发请求；同时可以通过`contenthash`监听文件内容变化，减少每次打包文件的变动。

```js
const MiniCssExtractPlugin = require("mini-css-extract-plugin")

module: {
    rules: [
        {
            test: /\.css$/,
            use: [
                MiniCssExtractPlugin.loader,
                'css-loader'
            ]
        }
    ]
},
plugins: [
    new MiniCssExtractPlugin({
        filename: "css/[name]-[contenthash:8].css"
    })
]
```

需要注意的是，该插件的功能与`style-loader`的功能是冲突的，且该插件不支持HMR。所以在开发环境下使用`style-loader`，在生产环境下使用`mini-css-extract-plugin`

## css压缩（optimize-css-assets-webpack-plugin）

使用`optimize-css-assets-webpack-plugin`插件可以对css进行压缩。
```js
const OptimizeCssAssetsWebpackPlugin = require("optimize-css-assets-webpack-plugin")

plugins: [
    new OptimizeCssAssetsWebpackPlugin({
        // cssnano 是 postcss 的依赖
        cssProcessor: require("cssnano"),
        cssProcessorOptions: {
            discardComments: { removeAll: true }
        }
    })
]
```

## js压缩

将`mode`设置为`production`时，webpack将自动启用js压缩。

## 打包依赖分析（webpack-bundle-analyzer）

`webpack-bundle-analyzer`插件可以显示打包结果的每个文件大小及其依赖，通过结果可以针对性地进行优化，如按需引入和代码拆分。直接在插件中配置就可以使用。
```js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

plugins: [
    new BundleAnalyzerPlugin()
]
```

## @babel/polyfill按需引入

babel可以转换es6语法，但是es6新增的api还需要额外处理。`@babel/polyfill`提供了es6新增api的低版本实现。但不是每个api都是需要的，所以需要按需引入。

```js
// .babelrc
{
    "presets": [
        [
            "@babel/preset-env", // 语法转换插件
            {
                "corejs": 2, // 核心库版本
                // 自动按需引入
                // 设置成entry也能按需引入，但要在入口文件中import "@babel/polyfill"
                "useBuiltIns": "usage"
            }
        ]
    ]
}
```

## 组件懒加载

一些不是首屏渲染的组件可以使用懒加载，减小入口文件体积，以提高首屏的渲染速度。最常见的是路由页面及弹窗组件。webpack提供的`import()`方法可以将组件异步引入。该组件模块将被打包成一个单独的文件，通过魔法注释如`/* webpackChunkName: "Home" */`可以对模块进行配置。

```js
{
    path: '/home',
    name: 'Home',
    component: () => import(/* webpackChunkName: "Home" */ '@/views/home')
}
```

## 代码拆分（splitChunks）

webpack默认是将所有代码都打包到入口文件中，很容易让入口文件的体积变得非常大，不利于加载。通过`splitChunks`可以将代码拆分成多个文件，有效利用浏览器并发请求。

如果拆分了同步模块，则需要在`HtmlWebpackPlugin`手动配置拆分的模块。

```js
optimization: {
    splitChunks: {
        chunks: "all", // all所有 initial同步 async异步
        minSize: 30000, // 模块最小体积 kb
        maxSize: 0, // 对模块进行二次分割, 不推荐
        minChunks: 1, // 模块最少引用次数
        maxAsyncRequests: 5, // 最大异步请求数
        maxInitialRequests: 3, // 最大初始化请求数，入口文件同步请求
        automaticNameDelimiter: '~', // 打包分隔符
        name: true, // 打包后的名称
        cacheGroups: { // 缓存组
            vue: {
                name: 'vue',
                test: /[\\/]node_modules[\\/](vue)/,
                priority: -5
            },
            vendors: {
                name: 'vendors',
                test: /[\\/]node_modules[\\/]/,
                priority: -10 // 优先级，符合多个规则时打包到优先级高的分组
            }
        }
    }
}
```

## tree sharking

tree sharking指的是去掉项目中那些没用到的代码，就像把树上的烂叶子摇掉。tree sharking有两种：js和css。

### js

开启js摇树需要满足三个条件：

1. es module模块规范
2. 开启`optimization.usedExports`
3. 开启js压缩（`mode: 'production'`时会默认开启）

### css

使用`purifycss-webpack`插件去除无用的css代码。
```js
const PurifyCSS = require('purifycss-webpack')
const glob = require("glob-all")

pulgins: [
    new PurifyCSS({
        paths: glob.sync([
            // 要做css摇树的路径
            path.resolve(__dirname, "./src/*.html"), // html模板中可能有内联
            path.resolve(__dirname, "./src/*.js")
        ])
    })
]
```

需要注意的是tree sharking有一定风险，如js中的副作用可能被删掉；如果用js设置类名，那该类的样式也可能被删掉。可通过在`package.json`中配置`sideEffects`排除不使用摇树的文件。

## externals

`externals`配置提供了不从bundle中引用依赖的方式，即将配置的依赖排除打包，取而代之的是需要在模板中用`<script>`手动引入依赖。

一般将框架（如Vue）和组件库等不常改动的依赖配置`externals`，而从CDN引入，以减小打包体积，减少打包时间。
