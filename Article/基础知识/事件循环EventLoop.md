# 事件循环 EventLoop

JavaScript 的事件循环机制在浏览器和 Node 中有所不同。

## 浏览器中的事件循环

js是单线程执行，js语句是顺序执行的。js有一个`main thread`主线程和`call-stack`调用栈（执行栈），所有任务都会被放到调用栈等待主线程执行。当函数执行时，会被添加到栈的顶部，当执行栈执行完成后，就会从栈顶移出，知道栈被清空。

事件循环可分为以下几步：
1. js分为同步任务和异步任务，同步任务都会在主线程上执行，形成一个调用栈；异步任务会放置在事件表（Event Table）中。
2. 主线程之外，事件触发线程管理一个任务队列（Event Queue），当异步任务有运行结果时，将从事件表中往任务队列中放置一个回调函数。
3. 当主线成同步任务执行完毕时（清空调用栈，此时JS引擎空闲），将从任务队列中读取可执行的异步任务，将其添加到主线程中，开始执行。
4. 上述过程不断重复，也就是事件循环（Event Loop）

任务可以分为宏任务和微任务。不同的任务会进入不同的任务队列。

**宏任务（macrotask）**

宏任务包括正在执行的代码（同步代码），每一个宏任务都会从头执行到尾而不会有中断。而且在每个宏任务执行完毕之后，下一个宏任务执行之前，浏览器会对页面进行渲染。

宏任务包括以下几种场景：同步代码、`setTimeout`、`setInterval`、`setImmediate`、`I/O`、`UI Rendering`

**微任务（microtask）**

微任务可理解为宏任务执行完毕后立即执行的任务，也就是说微任务会在渲染之前执行，且是执行所有可执行的微任务。因此微任务的响应比`setTimeout`更快。而在两个`setTimeout`之间将执行目前产生的所有微任务。

微任务包括以下几种场景：`Promise`、`MutationObserver`、`Object.observer(已废弃)`、`process.nextTick`

整个流程可概括为：宏任务（同步代码） -> 所有微任务 -> 页面渲染 -> 一个宏任务 -> 所有微任务 -> 页面渲染

## Node 中的事件循环

Node 的事件循环一共分为6个阶段

* timers: 执行 `setTimeout` 和 `setInterval` 中到期的回调函数
* pending callbacks: 执行上一轮事件循环中的一些回调函数
* idle, prepare: 仅系统内部使用
* poll: 检索新的 I/O 事件，执行与 I/O 相关的回调（除了关闭回调，计时器和 `setImmediate` 外的回调都在此时执行）。
* check: 执行 `setImmediate`。即 Node 允许开发人员在 `poll` 阶段之后立即执行回调。
* close callbacks: 执行 close 事件的回调，如 `socket.on('close'[,fn])`。

### setImmediate 和 setTimeout

`setImmediate()` 和 `setTimeout()` 的区别在于：
* `setImmediate()` 是在当前 `poll` 阶段结束后的 `check` 阶段执行
* `setTimeout()` 是在设置的 ms 时间后在 `timers` 阶段执行

在 I/O 周期内， `setImmediate()` 总是先执行。因为在 I/O 周期内调用回调函数，时间循环总会进入 `poll` 阶段。如果不在 I/O 周期内，则无法准确判断两者谁先执行，这取决系统的性能。

### process.nextTick

`process.nextTick()` 是异步 API 的一部分，但并不是事件循环的一部分。它会在当前操作完成后立即执行，不管当前的事件循环是在哪个阶段。可理解为**在当前事件循环阶段完成后立即执行，并优先于其他微任务**，