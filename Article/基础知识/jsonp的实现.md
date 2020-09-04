# jsonp的实现

```js
function jsonp (options) {
    options = options || {}
    if (!options.url || !options.callback) {
        throw new Error('invaild params')
    }
    
    // 添加回调函数名
    var callbackName = ('jsonp_' + Math.random()).replace('.', '')
    options.data[callback] = callbackName
    // 格式化参数
    var params = formatParams(options.data)
    
    // 插入空的script标签
    var oHead = document.getElementsByTagName('head')[0]
    var oS = document.createElement('script')
    oHead.appendChild(oS)
    
    // 回调函数-移除script标签，回调函数和计时器
    window[callbackName] = function(json) {
        oHead.removeChild(oS)
        clearTimeout(oS.timer)
        window[callbackName] = null
        options.success && options.success(json)
    }
    
    // 发送请求
    oS.src = options.url + '?' + params
    
    // 超时处理
    if (options.time) {
        oS.timer = setTimeout(function () {
            window[callbackName] = null
            oHead.removeChild(oS)
            options.fail && options.fail({ message: 'timeout' })
        }, options.time)
    }
}

function formatParams (data) {
    var arr = []
    for (var key in data) {
        arr.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    }
    return arr.join('&')
}
```