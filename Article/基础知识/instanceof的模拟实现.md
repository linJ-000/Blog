# instanceof的实现

# instanceof的模拟实现

instanceof 操作符的作用为：判断构造函数是否在对象的原型链上。

```js
function instanceOf(L, R) {
    var O = R.prototype // 构造函数的原型
    // 原型链的顶级为 null，到头了退出循环
    while (L !== null) {
        if (L === O) return true
        L = L.__proto__ // L 的隐式原型
    }
    return false
}
```