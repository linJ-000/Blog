# EventBus的实现

event bus（事件总线） 是 node 中各个模块的基石，也是前端组件之间重要的通信手段之一。DOM 的事件也是一种发布订阅模式，event bus可以看成自定义事件，可以模拟 DOM2级事件的接口，即提供注册事件处理函数，触发事件，移除事件处理函数三个接口。

event bus 基于发布订阅模式。该设计模式维护一个消息中心，当注册事件处理函数是，往消息中心中添加事件及其处理函数，如果一个事件有多个处理函数，则用数组保存这些处理函数。当事件触发时，调用该事件的所有处理函数。

```js
class EventEmeitter {
    constructor () {
        // 消息（事件）中心，用来保存事件及其处理函数
        this._events = this._events || new Map()
        // 设置监听上限
        this._maxListeners = this._maxListeners || 10
    }
    // 添加事件处理函数
    addListener (type, fn) {
        if (typeof fn !== 'function') {
            throw new Error('The second params must be function!')
        }

        let handler = this._events.get(type)

        if (!handler) {
            // 该事件还未被注册
            this._events.set(type, fn)
        } else if (handler && typeof handler === 'function') {
            // 该事件已有一个处理函数
            this._events.set(type, [handler, fn])
        } else {
            // 该事件有多个处理函数
            handler.push(fn)
        }
    }
    // 触发事件
    emit (type, ...args) {
        let handler = this._events.get(type)

        // 未注册过该事件，直接返回
        if (!handler) return

        if (Array.isArray(handler)) {
            // 事件存在多个处理函数
            for (let i = 0, len = handler.length; i < len; i++) {
                handler[i].apply(this, args)
            }
        } else {
            // 事件只有一个处理函数
            handler.apply(args)
        }
    }
    // 移除事件处理函数
    removeListener (type, fn) {
        let handler = this._events.get(type)

        if (!handler) return

        if (Array.isArray(handler)) {
            let position = handler.findIndex(v => v === fn)
            if (~position) {
                handler.splice(position, 1)
            }
            if (handler.length === 1) {
                this._events.set(type, handler[0])
            }
        } else {
            this._events.delete(type)
        }
    }
}
```