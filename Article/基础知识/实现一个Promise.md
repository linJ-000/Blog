# 实现一个Promise

Promise 是一种异步的解决方案。Promise 存在多种规范，ES6 采用的是 [Promise/A+ 规范](https://promisesaplus.com/)。下面的实现也是基于这个规范。

## Promise 及 then 方法的实现

```js
// resolvePromsie 用于实现 then 的链式调用。
// then 需要返回一个新的 Promise，即 promise2。如果 then 有返回值（x），则需要将 x 与  promise2 进行比较，同时决定 then 返回的 Promise 的状态。
const resolvePromise = (promise2, x, resolve, reject) => {
    // 防止循环调用，即等待自身 Promise 状态改变
    // 如 const y = new Promise(resolve => setTimeout(resolve(y)))
    if (promise2 === x) {
        return reject(new TypeError('Chaining cycle detected for promise!'))
    }

    // 防止多次调用
    let called

    // 后续的判断保证实现的 Promise 能和别的库的实现兼容
    if ((typeof x === 'object' && x !== null)
        || typeof x === 'function') {
        try {
            // 保存 then，防止 then 可能是一个 getter，多次读取可能有不同的结果
            let then = x.then

            if (typeof then === 'function') {
                // 如果 x 对象有 then 方法，则 x 对象为 thenable 对象
                // 根据鸭式辩型，可把 x 对象视为 Promise
                then.call(x, y => {
                    if (called) return
                    called = true

                    // 通过递归来链式调用 then
                    resolvePromise(promise2, y, resolve, reject)
                }, r => {
                    if (called) return
                    called = true
                    reject(r)
                })
            } else {
                // 如果 then 不是函数，则直接返回 resolve 作为结果
                resolve(x)
            }
        } catch (e) {
            if (called) return
            called = true
            reject(e)
        }
    } else {
        resolve(x)
    }
}

class Promise {
    constructor (executor) {
        this.status = 'pending' // promise 状态
        this.value = undefined
        this.reason = undefined
        this.onResolvedCallbacks = [] // resolve 回调
        this.onRejectedCallbacks = [] // reject 回调

        const resolve = (value) => {
            if (this.status === 'pending') {
                this.status = 'fulfilled'
                this.value = value
                this.onResolvedCallbacks.forEach(fn => fn())
            }
        }

        const reject = (reason) => {
            if (this.status === 'pending') {
                this.status = 'rejected'
                this.reason = reason
                this.onRejectedCallbacks.forEach(fn => fn())
            }
        }

        try {
            executor(resolve, reject)
        } catch (e) {
            reject(e)
        }
    }

    then (onFulfilled, onRejected) {
        // 处理 then 值透传的问题
        // 如 new Promise(resolve => resolve(42)).then().then().then(value => console.log(value))
        onFulfilled = typeof onFulfilled === 'function'
            ? onFulfilled
            : value => value
        onRejected = typeof onRejected === 'function'
            ? onRejected
            : err => { throw err }

        // 调用 then 返回一个新的 Promise
        let promise2 = new Promise((resolve, reject) => {
            // 根据标准异步调用，这里用 setTimeout 模拟
            // 规范并没有限制用宏任务还是微任务实现异步
            // 微任务可以尝试 mutationObserver
            if (this.status === 'fulfilled') {
                setTimeout(() => {
                    try {
                        let x = onFulfilled(this.value)
                        resolvePromise(promise2, x, resolve, reject)
                    } catch (e) {
                        reject(e)
                    }
                })
            }

            if (this.status === 'rejected') {
                setTimeout(() => {
                    try {
                        let x = onRejected(this.reason)
                        resolvePromise(promise2, x, resolve, reject)
                    } catch (e) {
                        reject(e)
                    }
                })
            }

            if (this.status === 'pending') {
                this.onResolvedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            let x = onFulfilled(this.value)
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (e) {
                            reject(e)
                        }
                    })
                })
                this.onRejectedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            let x = onRejected(this.reason)
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (e) {
                            reject(e)
                        }
                    })
                })
            }
        })

        return promise2
    }
}
```

## Promise 测试

Promise/A+ 提供了一个测试脚本，测试编写的 Promise 是否符合规范。其中一共有 872 条测试用例，并会对不通过的测试用例提示代码不符合哪条规范。

在 Promise 中加上下面代码 ，并对外暴露 Promise 对象。

```js
Promise.defer = Promise.deferred = function () {
    let dfd = {};
    dfd.promise = new Promise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    })
    return dfd;
}
```

全局安装脚本并进行测试。

```
npm install -g promises-aplus-tests
promises-aplus-tests promise.js
```

## Promise API

promise/A+ 规范只给出了 promise 对象和 then 方法的实现，有了 then 方法，其他可以很简单地实现。

* Promise.resolve
* Promise.reject
* Promise.prototype.catch
* Promise.prototype.finally
* Promise.all
* Promise.race

### Promise.resolve

`Promise.resolve` 返回一个 `fulfilled` 状态的 promise。

```js
class Promise {
    // ...
    static resolve (value) {
        return new Promise(resolve => {
            resolve(value)
        })
    }
}
```

### Promise.reject

`Promise.reject` 返回一个 `rejected` 状态的 promise。

```js
class Promise {
    // ...
    static reject (reason) {
        return new Promise((resolve, reject) => {
            reject(reason)
        })
    }
}
```

### Promise.prototype.catch

`Promise.prototype.catch` 当 promise 的状态变成 `rejected` 时会被调用，其实就是 then 的第二个参数

```js
class Promise {
    // ...
    catch (onRejected) {
        return this.then(null, onRejected)
    }
}
```

### Promise.prototype.finally

`Promise.prototype.finally` 会在 promise 改变状态时被调用，不管是 `fulfilled` 还是 `rejected`。

```js
class Promise {
    // ...
    finally (callback) {
        return this.then(value => {
            return new Promise.resolve(callback()).then(() => value)
        }, reason => {
            return new Promise.resolve(callback()).then(() => { throw reason })
        })
    }
}
```

### Promise.all

`Promise.all` 并行执行传入的 promise，并返回一个 promise 作为结果，结果的 data，有一个失败则视为失败。

```js
class Promise {
    // ...
    static all (promises) {
        if (!Array.isArray(promises)) {
            return new TypeError(`TypeError: ${values} is not iterable`)
        }
        let result = []
        let index = 0 // 计数，完成的 promise 数量

        const process = (value, i) => {
            result[i] = value
            if (++index === promises.length) {
                resolve(result)
            }
        }

        return new Promise((resolve, reject) => {
            for (let i = 0; i < promises.length; i++) {
                let promise = promises[i]
                if (promise && typeof promise.then === 'function') {
                    promise.then(value => {
                        process(value, i)
                    }, reject)
                } else {
                    process(value, i) 
                }
            }
        })
    }
}
```

### Promise.race

`Promise.race` 并行执行传入的 promise，并返回最快完成的那一个

```js
class Promise {
    // ...
    static race (promises) {
        return new Promise((resolve, reject) => {
            for (let i = 0; i < promises.length; i++) {
                let promise = promises[i]
                if (promise && typeof promise.then === 'function') {
                    promise.then(resolve, reject)
                } else {
                    resolve(promise)
                }
            }
        })
    }
}
```