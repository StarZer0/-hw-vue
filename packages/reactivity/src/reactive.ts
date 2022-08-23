import { isObject } from '@hw-vue/shared';
import { mutableHandlers, shallowReactiveHandlers, readonlyReactiveHandlers, shallowReadonlyHandlers } from './baseHandlers';

export function reactive(target) {
    return createReactiveObject(target, false, mutableHandlers);
}

export function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandlers);
}

export function readonly(target) {
    return createReactiveObject(target, true, readonlyReactiveHandlers);
}

export function shallowReadonly(target) {
    return createReactiveObject(target, true, shallowReadonlyHandlers);
}

const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();

export function createReactiveObject(target, isReadonly, baseHandlers) {
    // 判断是否是对象
    if (!isObject(target)) throw new Error('target 必须是对象');

    const proxyMap = isReadonly ? readonlyMap : reactiveMap;
    // 查看是否已被代理
    const lastProxy = proxyMap.get(target);
    if (lastProxy) return lastProxy;

    // 判断对象是否重复代理 可能存在深度代理和只读代理
    const proxy = new Proxy(target, baseHandlers);
    // 存储代理结果和源对象
    proxyMap.set(target, proxy);

    return proxy;
}
