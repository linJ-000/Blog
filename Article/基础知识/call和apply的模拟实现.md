# call和apply的模拟实现

函数的`call`和`apply`方法可以显示绑定函数的this。这是利用this的隐式绑定实现的，即函数作为对象属性调用时，函数内部的this指向该对象。

`call`和`apply`的区别在于传参上的不同。`call`需要传入函数的参数列表，而`apply`则是将函数参数作为数组传入。

主要的实现步骤为

1. 将函数设置为对象的属性（如果没有上下文则函数指向window）
2. 执行函数，并将剩余参数传给函数（es6以下用arguments获取剩余函数，用eval执行函数）
3. 删除属性

## call的模拟实现

```js
// ES5
Function.prototype.call = function (context) {
    // 将函数设置为对象的属性
    context = context || window
    context.fn = this

    var args = []
    // 注意循环的其实为1，需要去掉第一个参数context
    for (var i = 1, len = arguments.length; i < len; i++) {
        args.push('arguments[' + i + ']')
    }

    // eval将字符串作为代码执行 context.fn(arguments[1], arguments[2]...)
    var result = eval('context.fn(' + args + ')')
    // 删除属性
    delete context.fn

    return result
}

// ES6
Function.prototype._call = function (context, ...args) {
    // es6可通过...运算符收集剩余参数，args为一个数组
    context = context || window
    context.fn = this
    // 将args数组通过...运算符展开，传递给fn
    let result = context.fn(...args)
    delete context.fn
    return result
}

```

## apply的模拟实现

```js
// ES5
Function.prototype._apply = function (context, arr) {
    context = context || window
    context.fn = this
    var result

    if (typeof arr === 'undefined') {
        // 如果第二个参数不存在则直接调用，获取结果
        result = context.fn()
    } else {
        if (!(arr instanceof Array)) {
            throw new Error('params must be array')
        }

        var args = []
        for (var i = 0; i < arr.length; i++) {
            args.push('arr[' + i + ']')
        }

        var result = eval('context.fn(' + args + ')')
    }

    delete context.fn
    return result
}

// ES6
Function.prototype._apply = function (context, args) {
    context = context || window
    context.fn = this
    let result
    
    if (typeof args === 'undefined') {
        result = context.fn()
    } else {
        if (!Array.isArray(args)) throw new Error('params must be array')
        
        result = context.fn(...args)
    }
    
    delete context.fn
    return result
}

```