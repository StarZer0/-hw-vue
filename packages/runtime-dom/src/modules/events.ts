// Vue中为了避免绑定事件前后频繁更新导致重复解绑、绑定事件
// 通过在invoker.value缓存当前绑定的回调
// 后续回调更新，只需要invoker.value重新赋值即可避免重复绑定
export function pathEvent(el, key, value) {
    // 函数缓存
    const invokers = el._vei || (el._vei = {});

    const eventName = key.slice(2).toLowerCae();
    const exist = invokers[eventName];

    if (value && exist) {
        exist.value = value;
    } else {
        if (value) {
            // 以前没有绑定过当前事件，需要重新绑定
            const invoker = (invokers[eventName] = createInvoker(value));
            el.addEventListener(eventName, invoker);
        } else {
            // 以前绑定过事件，但是现在移除了
            el.removeEventListener(eventName, exist);
            invokers[eventName] = undefined;
        }
    }
}

/**
 * 创建函数执行器, 通过执行.value对应的函数来避免事件回调更新后重复解绑、重新绑定
 * @param value
 * @returns
 */
function createInvoker(value: Function) {
    const invoker = (e) => {
        if (typeof invoker.value === 'function') {
            invoker.value(e);
        }
    };

    invoker.value = value;
    return invoker;
}
