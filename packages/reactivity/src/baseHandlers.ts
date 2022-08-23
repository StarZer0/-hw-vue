import { extend, hasOwn, isArray, isIntegerKey, isObject } from '@hw-vue/shared';
import { track, trigger } from './effect';
import { TrackOpTypes, TriggerOpTypes } from './operators';
import { reactive, readonly } from './reactive';

function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        const res = Reflect.get(target, key, receiver);

        if (!isReadonly) {
            // 收集依赖
            track(target, TrackOpTypes.GET, key);
        }

        if (shallow) {
            return res;
        }

        // 每次get属性值时才会去深层代理
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }

        return res;
    };
}
function createSetter(isShallow = false) {
    return function set(target, key, value, receiver) {
        const lastVal = Reflect.get(target, key);

        // 判断key是否存在
        let existKey = isArray(lastVal) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);

        const result = Reflect.set(target, key, value, receiver);

        // 数据更新时触发依赖重新更新
        // 需要进行新增、修改判断
        if (existKey) {
            // 修改
            trigger(target, TriggerOpTypes.UPDATE, key, value, lastVal);
        } else {
            // 新增
            trigger(target, TriggerOpTypes.ADD, key, value);
        }

        return result;
    };
}

export const mutableHandlers = {
    get: createGetter(),
    set: createSetter(),
};

export const shallowReactiveHandlers = {
    get: createGetter(false, true),
    set: createSetter(true),
};

const readonlySetter = {
    set: (target, key) => {
        console.warn(`set "${key}" of readonly object is now allowed.`);
    },
};

export const readonlyReactiveHandlers = extend(
    {
        get: createGetter(true, false),
    },
    readonlySetter
);

export const shallowReadonlyHandlers = extend(
    {
        get: createGetter(true, true),
    },
    readonlySetter
);
