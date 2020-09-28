const resolvePromise = (promise2, x, resolve, reject) => {
    if (promise2 === x) {
        return reject(new TypeError('Chaining cycle detected for promise!'))
    }

    let called

    if ((typeof x === 'object' && x !== null)
        || typeof x === 'function') {
        try {
            let then = x.then

            if (typeof then === 'function') {
                then.call(x, y => {
                    if (called) return
                    called = true
                    resolvePromise(promise2, y, resolve, reject)
                }, r => {
                    if (called) return
                    called = true
                    reject(r)
                })
            } else {
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
        this.status = 'pending'
        this.value = undefined
        this.reason = undefined
        this.onResolvedCallbacks = []
        this.onRejectedCallbacks = []

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
        onFulfilled = typeof onFulfilled === 'function'
            ? onFulfilled
            : value => value
        onRejected = typeof onRejected === 'function'
            ? onRejected
            : err => { throw err }

        let promise2 = new Promise((resolve, reject) => {
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

    catch (onRejected) {
        return this.then(null, onRejected)
    }

    static resolve (value) {
        return new Promise(resolve => {
            resolve(value)
        })
    }

    static reject (reason) {
        return new Promise((resolve, reject) => {
            reject(reason)
        })
    }

    finally (callback) {
        return this.then(value => {
            return new Promise.resolve(callback()).then(() => value)
        }, reason => {
            return new Promise.resolve(callback()).then(() => { throw reason })
        })
    }

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

Promise.defer = Promise.deferred = function () {
    let dfd = {};
    dfd.promise = new Promise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    })
    return dfd;
}

module.exports = Promise