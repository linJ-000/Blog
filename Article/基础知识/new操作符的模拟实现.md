# new操作符的模拟实现

new作用于构造函数上，用于生成一个新对象。

new操作符主要完成以下几件事：

1. 创建一个新对象
2. 将新对象内部不可访问的[[prototype]]（即`__proto__`）设置为外部可访问的prototype（链接原型）
3. 将this指向创建的新对象
4. 用新创建的对象执行构造函数
5. 如果构造函数没有返回一个非null的对象，那将返回该新创建的对象

## new的模拟实现

```js
function New (func) {
    var res = {}
    // 将对象的原型指向构造函数的原型
    if (func.prototype !== null) {
        res.__proto__ = func.prototype
    }

    // 将构造函数的this指向新对象，并执行构造函数
    var ret = func.apply(res, Array.prototype.slice.call(arguments, 1))

    // 如果构造函数不返回一个非空对象，则返回创建的新对象
    if ((typeof ret === 'object' || typeof ret === 'function') && ret !== null) {
        return ret
    }

    return res
}
```