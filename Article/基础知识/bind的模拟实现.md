# bind的模拟实现

> bind 方法会创建一个新函数，当这个新函数被调用时，bind 的第一个参数将作为其 this，剩余的参数将作为新函数的实参。

bind 函数的有以下的特点：
1. 返回一个函数，将其 this 绑定到第一个参数
2. 传递预设参数
3. bind 返回的函数可当作构造函数使用。此时 bind 绑定的 this 无效，但传入的参数仍有效

```js
Function.prototype._bind = function (context) {
    if (typeof this !== 'function') {
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable')
    }

    // 保存绑定的函数
    var self = this
    // 获取预设参数
    var args = Array.prototype.slice.call(arguments, 1)
    var fNOP = function () {}

    var fBound = function () {
        // 判断是普通调用还是构造函数调用
        return self.apply(
            this instanceof fBound ? this : context,
            args.concat(Array.prototype.slice.call(arguments))
        )
    }

    // 作为构造函数调用时，将其原型指向绑定函数的原型
    // fNOP 作为中转，直接绑定原型（fBound.prototype = this.prototype）容易修改绑定函数的原型
    fNOP.prototype = self.prototype
    fBound.prototype = new fNOP()

    return fBound
}
```