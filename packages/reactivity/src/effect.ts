import { isArray, isIntegerKey } from '@hw-vue/shared';
import { TrackOpTypes, TriggerOpTypes } from './operators';

let uid = 0;
let activeEffect;
// 解决effect递归调用问题,需要用栈保存当前执行的effect层级
// 避免切换effect时当前effect丢失
const effectStack = [];

function createReactiveEffect(fn, options): any {
    const effect = function reactiveEffect() {
        // 判断当前effect是否入栈,避免重复执行
        // effect(() => state.num++ ) 如果不进行重复判断,则会出现不停入栈更新的情况
        if (!effectStack.includes(effect)) {
            try {
                // 执行前入栈
                effectStack.push(effect);
                activeEffect = effect;
                return fn();
            } finally {
                // 执行后出栈并更新当前effect
                effectStack.pop();
                activeEffect = effectStack[effectStack.length - 1];
            }
        }
    };

    effect.id = uid++;
    effect._isEffect = true; // 用于标识是响应式effect
    effect.raw = fn; // 保留源函数
    effect.options = options; // 保留options

    return effect;
}

export function effect(fn, options: any = {}) {
    // TODO: 响应式effect

    const effects = createReactiveEffect(fn, options);
    // 没有lazy状态立即执行一次函数进行响应收集
    if (!options.lazy) {
        effects();
    }
    return effects;
}

// 维护对象、key、effect之间的映射表
const targetMap = new WeakMap();

// 将对象上某个属性收集effect列表
export function track(target: any, operator: TrackOpTypes, key: any) {
    console.log('track');
    // 通过activeEffect拿到当前执行的effect
    if (activeEffect === undefined) return;

    let depsMap = targetMap.get(target);
    if (!depsMap) targetMap.set(target, (depsMap = new Map()));

    let dep = depsMap.get(key);
    if (!dep) depsMap.set(key, (dep = new Set()));

    if (!dep.has(activeEffect)) dep.add(activeEffect);
}

export function trigger(target: any, operator: TriggerOpTypes, key: any, val?: any, oldVal?: any) {
    // 判断属性是否被收集
    const depsMap = targetMap.get(target);
    if (!depsMap) return;

    // Set天然有去重效果
    const effects = new Set<Function>();

    const addEffects = (items) => (items || []).forEach((item) => effects.add(item));

    // 判断是否是修改数组长度
    if (key === 'length' && isArray(target)) {
        // 遍历当前数组对应的收集列表
        depsMap.forEach((dep, key) => {
            // 如果修改的是数组长度，则所有比当前长度大的索引也应该被触发
            if (key === 'length' || key > val) {
                addEffects(dep);
            }
        });
    } else {
        if (key !== undefined) {
            addEffects(depsMap.get(key));
        }

        switch (operator) {
            case TriggerOpTypes.ADD:
                // 如果是数组添加下标,则length的依赖也会被触发
                if (isArray(target) && isIntegerKey(key)) {
                    addEffects(depsMap.get('length'));
                }
                break;
        }
    }

    effects.forEach((effect: any) => {
        if (effect.options.scheduler) {
            effect.options.scheduler();
        } else {
            effect();
        }
    });
}
