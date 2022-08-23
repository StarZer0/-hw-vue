import { isEqual, isObject } from '@hw-vue/shared';
import { track, trigger } from './effect';
import { TrackOpTypes, TriggerOpTypes } from './operators';
import { reactive } from './reactive';

export function ref(value) {
    return createRef(value, false);
}

export function shallowRef(value) {
    return createRef(value, true);
}

const convert = (val) => (isObject(val) ? reactive(val) : val);

class RefImpl {
    public _value;
    public __v_isRef = true; // 表示当前是一个ref实例

    constructor(public rawValue, public shallow) {
        this._value = shallow ? rawValue : convert(rawValue);
    }

    get value() {
        // 依赖收集
        track(this, TrackOpTypes.GET, 'value');
        return this._value;
    }

    set value(val) {
        // 依赖触发
        if (!isEqual(val, this.rawValue)) {
            this.rawValue = val;
            this._value = this.shallow ? val : convert(val);
            trigger(this, TriggerOpTypes.UPDATE, 'value', val);
        }
    }
}

function createRef(rawValue: any, shallow: boolean = false) {
    return new RefImpl(rawValue, shallow);
}
