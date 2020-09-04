# ajax的实现

```js
function ajax = function (params) {
    params = params || {}
    params.data = params.data || {}
    params.type = (params.type || 'GET').toUpperCase()
    params.data = formatParams(params.data)
    
    var xhr = window.XMLHttpRequest
    	? new XMLHttpRerquest()
    	: new ActiveXObject('Microsoft.XMLHTTP')
    
    // 请求响应回调
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            var status = xhr.status
            if (status >= 200 && status <= 300) {
                var type = xhr.getResponseHeader('Content-type')
                var response
                if (~type.indexOf('xml') && xhr.responseXML) {
                    // xml格式
                    response = xhr.responseXML
                } else if (~type.indexOf('application/json')) {
                    // json格式
                    response = JSON.parse(xhr.responseText)
                } else {
                    response = xhr.responseText
                }
                // 请求成功回调
                params.success && params.success(response)
            } else {
                // 请求失败回调
                params.fail && params.fail(status)
            }
        }
    }
    
    // 发送请求
    if (params.type === 'GET') {
        xhr.open('GET', params.url + '?' + params.data, true)
        xhr.send(null)
    } else {
        xhr.open('POST', params.url, true)
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=UTF-8')
        xhr.send(params.data)
    }
}

// 格式化参数
function formatParams (data) {
    var arr = []
    for (var key in data) {
        arr.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    }
    return arr.join('&')
}
```