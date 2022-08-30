import { currentInstance, LifecycleHooks, setCurrentInstance, unsetCurrentInstance } from './component';

export function injectHook(lifecycle: LifecycleHooks, hook: Function, target = currentInstance) {
    if (target) {
        // 初始化事件列表
        const hooks = target[lifecycle] || (target[lifecycle] = []);

        // 包裹事件回调，设置当前组件实例，防止事件回调中无法获取组件实例
        const wrapHook = (...args) => {
            setCurrentInstance(target);
            const res = hook.call(currentInstance, ...args);
            unsetCurrentInstance();

            return res;
        };

        hooks.push(wrapHook);
    }
}

export function createHook(lifecycle: LifecycleHooks) {
    return function (hook: Function, target = currentInstance) {
        injectHook(lifecycle, hook, target);
    };
}

// 定义生命周期函数
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT);
export const onMounted = createHook(LifecycleHooks.MOUNTED);
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE);
export const onUpdated = createHook(LifecycleHooks.UPDATED);
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT);
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED);
export const onServerPrefetch = createHook(LifecycleHooks.SERVER_PREFETCH);

export function invokeArrayFns(fns: Function[], arg?: any) {
    for (let i = 0; i < fns.length; i++) {
        fns[i](arg);
    }
}
