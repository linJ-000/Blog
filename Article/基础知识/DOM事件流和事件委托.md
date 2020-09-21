# DOM事件流和事件委托

## 事件流

事件流描述的是从页面中接收事件的顺序。以前的 IE 和 Netscape 提出了两种相反的事件流——事件冒泡和事件捕获，现在的浏览器实现了这两种事件流。

### 事件冒泡

事件从开始时由最具体的元素（文档中嵌套层次最深的那个节点）接收，然后逐级向上传播到较为不具体的节点（document）。

### 事件捕获

事件捕获则是不太具体的节点应该更早地接收事件，最具体地节点应该最后接收到事件。用意在于事件到达预定目标前捕获它。

### DOM事件流

DOM2级事件规定事件流包含三个阶段：

1. 事件捕获阶段
2. 目标阶段
3. 事件冒泡阶段

## 事件处理程序

### DOM0级事件处理程序

将一个函数赋值给已给一个事件处理程序属性。

```js
// 添加事件处理程序
document.getElementById('J_btn').onclick = function (e) {
    console.log('click')
}

// 移除事件处理程序
document.getElementById('J_btn').onclick = null
```

### DOM2级事件处理程序

DOM2级事件定义了两个方法 `addEventListener` 和 `removeEventListener`，这两个方法都接收三个参数：事件名，事件处理程序函数和是否在捕获阶段执行的布尔值（为 true 时在事件捕获阶段执行处理函数，为 false 时在事件冒泡阶段执行处理函数，默认为 false ）。

当为一个事件添加多个处理函数时，会按添加的顺序执行函数。

```js
// 添加事件处理程序
var clickHandle
document.getElementById('J_btn').addEventListener('click', clickHandle = function () {
    console.log('click')
}, false)

// 移除事件处理程序
document.getElementById('J_btn').removeEventListener('click', clickHandle)
```

### IE事件处理程序

IE实现了两个类似的方法 `attachEvent` 和 `detachEvent`，这两个方法都只接收事件名和处理函数两个参数，与DOM事件不同的地方在于：

1. 处理函数中的 this 指向 window
2. 为一个事件添加多个处理函数时，先添加的后执行
3. 事件的 event 对象在 window 上而不是事件回调的参数

### 阻止冒泡/捕获和取消默认行为

通过事件对象event可以实现阻止进一步的冒泡和捕获，以及取消事件的默认行为。

**DOM事件**

```js
// 阻止进一步的冒泡和捕获
e.stopPropagation()

// 取消事件的默认行为
e.preventDefault()
```

**IE 事件**

```js
// 阻止进一步的冒泡
window.event.cancalBubble = true

// 取消事件的默认行为
window.event.returnValue = false
```

## 事件委托

事件委托利用了事件冒泡，当有多个元素需要绑定事件处理程序时，可以在其上层元素绑定一个事件处理函数，所有在子元素上触发的事件都将冒泡到上层元素进行处理。

```js
document.getElementById('list').addEventListener('click', function (e) {
    e = e || window.event
    var target = e.target || event.srcElement
    
    switch (target.id) {
        case 'btn_1':
            // TODO
    }
})
```