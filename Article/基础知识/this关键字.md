# this关键字

this既不指向函数自身，也不指向词法作用域，this在函数调用时绑定，完全取决于函数的调用位置。this可以让我们在函数内部访问当前的运行环境，它是执行上下文的一部分。this指向函数的调用者（一个对象）。this有以下四个绑定规则。

## this绑定规则

### 默认绑定

当没有其他绑定规则时，采用的绑定规则。直接调用函数时，函数内部的this指向全局对象window。

### 隐式绑定

当函数作为对象属性调用时，函数内部的this指向该对象

```javascript
var obj = {
    a: 1,
    foo: function () {
		console.log(this.a)
    }
}

obj.foo() // 1
```

### 显式绑定

通过函数的`call`和`apply`方法可以直接指定this的绑定对象，称之为显式绑定。

```javascript
function foo(x, y) {
    console.log( this.a, x, y );
}
var obj = { a:2 };

foo.call( obj, 1, 2 ); // 2 1 2
foo.apply( obj, [1, 2] ); // 2 1 2
```

call与apply的区别在于函数形参传入的方式不同。

### new绑定

使用new操作符调用函数时，会创建一个新对象并把它绑定到函数调用中的this上。js中的构造函数其实是被new调用的普通函数，或者说是“构造调用”。因此new改变了函数调用时this的指向，称之为new绑定。

## 箭头函数

箭头函数中的this不遵循上述四种规则，而是根据当前的词法作用域来决定。这与es5中使用变量来保存this的做法的模式是一样的。

```javascript
var obj = {
    a: 1,
    foo: function() {
		setTimeout(() => {
            console.log(this.a)
        })
    }
}
obj.foo() // 1

// 等价于

var obj = {
    a: 1,
    foo: function() {
        var self = this
		setTimeout(function() {
            console.log(self.a)
        })
    }
}
obj.foo() // 1
```
