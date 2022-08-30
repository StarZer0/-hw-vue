import { isFunction, isObject, ShapeFlags } from '@hw-vue/shared';
import { PublicInstanceProxyHandlers } from './componentPublicInstance';

export const enum LifecycleHooks {
    BEFORE_CREATE = 'bc',
    CREATED = 'c',
    BEFORE_MOUNT = 'bm',
    MOUNTED = 'm',
    BEFORE_UPDATE = 'bu',
    UPDATED = 'u',
    BEFORE_UNMOUNT = 'bum',
    UNMOUNTED = 'um',
    DEACTIVATED = 'da',
    ACTIVATED = 'a',
    RENDER_TRIGGERED = 'rtg',
    RENDER_TRACKED = 'rtc',
    ERROR_CAPTURED = 'ec',
    SERVER_PREFETCH = 'sp',
}

export let currentInstance = null;

export function getCurrentInstance() {
    return currentInstance;
}

export function setCurrentInstance(instance) {
    currentInstance = instance;
}

export function unsetCurrentInstance() {
    currentInstance = null;
}

// 创建组件实例
export function createComponentInstance(vnode) {
    const instance = {
        vnode,
        type: vnode.type,
        props: {},
        attrs: {},
        slots: {},
        setupState: {}, // setup返回的对象
        ctx: null,
        isMounted: false,
    };
    instance.ctx = { _: instance };
    return instance;
}

// 解析setup函数
export function setupComponent(instance) {
    const { props, children } = instance.vnode;

    // initProps()
    instance.props = props;
    // initSlots()
    instance.children = children;

    // 判断当前组件是否是有状态组件
    let stateFlag = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
    if (stateFlag) {
        // 调用setup获取状态，并填充进入render
        setupStatefulCOmponent(instance);
    }
}

function setupStatefulCOmponent(instance) {
    // 通过代理将当前实例上的属性代理出来，避免链式调用
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers as any);

    // 获取组件类型, 拿到组件setup方法
    let Component = instance.type;
    let { setup } = Component;

    if (setup) {
        // 设置当前组件实例 方面生命周期注册时调用
        setCurrentInstance(instance);

        const setupContext = createContext(instance);
        const setupResult = setup(instance.props, setupContext);

        // 当前setup调用完成后，需要移除当前实例
        unsetCurrentInstance();
        handleSetupResult(instance, setupResult);
    } else {
        finishComponentSetup(instance);
    }

    // 执行render函数
    Component.render?.(instance.proxy);
}

function handleSetupResult(instance, setupResult) {
    if (isFunction(setupResult)) {
        instance.render = setupResult;
    } else if (isObject(setupResult)) {
        instance.setupState = setupResult;
    }

    finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
    let Component = instance.type;

    if (!instance.render) {
        if (!Component.render && Component.template) {
            // 调用模板编译生成render函数
        }
        instance.render = Component.render;
    }
}

function createContext(instance) {
    return {
        attrs: instance.attrs,
        props: instance.props,
        slots: instance.slots,
        emit: () => {},
        expose: () => {},
    };
}
