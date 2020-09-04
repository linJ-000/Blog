# webpack优化（二）：打包速度优化

*该文章基于webpack4*

* loader、plugins耗时分析（speed-measure-webpack-plugin）
* include/exclude
* resolve
* dll动态链接库
* 保存打包结果（hard-source-webpack-plugin）
* 多进程打包（happyPack）

## loader、plugins耗时分析（speed-measure-webpack-plugin）

工欲善其事必先利其器。`speed-measure-webpack-plugin`插件可以帮助我们分析每个loader和plugin的耗时，针对性地进行优化。

```js
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin")
const smp = new SpeedMeasurePlugin()

// config为webpack配置
module.exports = smp.wrap(config)
```

## include/exclude

loader是打包时消耗性能地大户。使用loader处理模块时，通过include指定处理范围，或者exclude排除一些不需处理地目录，可以减少处理时间。
```js
module: [
    rules: [
        {
            test: /\.(png|jpe?g|gif)$/,
            include: path.resolve(__dirname, "./src"), // 只处理src目录下的图片
            use: {
                loader: "url-loader",
                options: {
                    name: "[name]_[hash:6].[ext]",
                    outputPath: "images/",
                    limit: 1024
                }
            }
        },
        {
            test: /.\js$/,
            exclude: /node_modules/, // 排除node_modules
            use: {
                loader: "babel-loader"
            }
        }
    ]
]

```

## resolve

resolve.modules配置第三方模块的查找范围，默认是`['node_modules']`，查找时会逐层查找。可以指明第三方模块的绝对路径，减少查找过程

resolve.alias配置用来指定路径的别名，同时也可以减少模块的查找过程。

```js
resolve: {
    modules: [path.resolve(__dirname, "./node_modules")],
    alias: {
        '@': path.join(__dirname, './src/')
        'vue$': 'vue/dist/vue.esm.js',
    }
}
```

## dll动态链接库

将只需要打包一次的模块如框架、组件库先单独打包成dll文件，下次打包直接引用dll，减少打包时间。

```js
// webpack.config.dll.js
const path = require("path")
const { Dllplugin } = require("webpack")
module.exports = {
    mode: "development",
    entry: {
        react: ["react", "react-dom"]
    },
    output: {
        path: path.resolve(__dirname, "./dll"),
        filename: "[name].dll.js", // bundle文件名称
        library: "react" // 库的名称，对外暴露的名称
    },
    plugins: [
        new Dllplugin({
            // manifest.json文件输出位置
            path: path.join(__dirname, "./dll", "[name]-manifest.json"),
            // 定义打包的公共vendor文件对外暴露
            name: "react" // 与library一致
        })
    ]
}

// webpack.config.js
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin'); // 用于将dll插入html中

plugins: [
    new webpack.DllReferencePlugin({
        manifest: path.resolve(__dirname, "./dll/react-manifest.json")
    }),
    new AddAssetHtmlPlugin({
      filepath: path.resolve(__dirname, './dll/react.dll.js'),
    })
]
```
动态链接库配置复杂，可通过`autodll-webpack-plugin`插件减轻配置负担。但vue和react官方都已经移除了dll，因为现在有了更好的替代方案。

## 保存打包结果（hard-source-webpack-plugin）

使用dll本质是缓存打包结果，`hard-source-webpack-plugin`插件可以将打包结果保存到硬盘中，加速比dll更加明显。而且使用十分简单。

```js
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')

plugins: [
    new HardSourceWebpackPlugin()
]
```
这个插件将成为webpack5的内置功能。

## 多进程打包（happyPack）

happyPack是优化loader的最终方案。happyPack通过开启多个进程处理loader，加快构建速度。该插件适合大型项目，因为开启多线程和happyPack初始化需要一些时间。

```js
const HappyPack = require("happyPack")
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length })

module: [
    rules: [
        {
            test: /\.css$/,
            use: ["HappyPack/loader?id=css"]
        }
    ]
],
plugins: [
    new HappyPack({
        id: "css",
        loaders: ["style-loader", "css-loader"],
        ThreadPool: happyThreadPool // 共享进程池
    })
]
```
需要注意的是happyPack与`mini-css-extract-plugin`插件不兼容
