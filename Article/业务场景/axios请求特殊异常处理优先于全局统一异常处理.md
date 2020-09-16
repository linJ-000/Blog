# axios请求特殊异常处理优先于全局统一异常处理

使用 axios 的时候，我们经常会定义全局的拦截器，以便对错误进行全局捕获和处理。对于一般的异常，我们用 toast 提示用户即可。但是对于一些特殊的异常，需要不同的处理方式。如果直接在调用接口的 catch 中进行操作，就会出现两个异常提示。这时候，我们就需要让特殊异常的优先级高于全局异常处理。

浏览器的事件循环机制，异步代码会被放在异步队列中，等下一次循环再取出，放入 js 执行线程中。我们可以根据这一点，将全局异常提示的代码变成异步代码，通过一个值判断是否显示全局异常提示，并将这个值交由实际的接口决定。

```js
// 响应拦截器
axios.interceptors.response.use(
    response => {
        const data = response.data

        // 是否显示全局统一异常提示
        let defaultMessage = true
        // 隐藏异常提示，并将这个函数下发给接口
        const hideDefaultMessage = () => {
            defaultMessage = false
        }

        // status !== 0 时，接口业务异常
        if (data.status !== 0) {
            response.hideDefaultMessage = hideDefaultMessage
        }

        // 异步显示全局统一处理
        setTimeout(() => {
            if (data.status !== 0 && defaultMessage) {
                errorHandler(data)
            }
        })

        return data.status !== 0
            ? Promise.reject(response)
            : response
    },
    err => {
        // ...
    }
)

// 需要进行特殊处理的接口
axios.get(url).then(res => {
    // ...
}).catch(err => {
    const data = err.data
    // 需要特殊处理的业务代码
    if (data.status === '10056') {
        // TODO: 特殊处理
        // 隐藏全局的错误提示
        if (typeof err.hideDefaultMessage === 'function') 
            err.hideDefaultMessage()
    }
})
```