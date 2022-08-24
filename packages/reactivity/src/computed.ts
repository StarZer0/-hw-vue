import { effect, track, trigger } from './effect';
import { TrackOpTypes, TriggerOpTypes } from './operators';

class ComputedRefImpl {
    private _dirty = true;
    private _value;
    private effect;

    constructor(getter, public setter) {
        this.effect = effect(
            () => {
                return getter();
            },
            {
                lazy: true,
                scheduler: () => {
                    if (!this._dirty) {
                        this._dirty = true;
                        trigger(this, TriggerOpTypes.UPDATE, 'value');
                    }
                },
            }
        );
    }

    get value() {
        if (this._dirty) {
            // 更新值
            this._value = this.effect();
            // 重置状态
            this._dirty = false;
        }

        track(this, TrackOpTypes.GET, 'value');

        return this._value;
    }

    set value(newVal) {
        this.setter(newVal);
    }
}

export function computed(options) {
    let getter;
    let setter;

    if (typeof options === 'function') {
        getter = options;
        setter = () => {
            console.log('computed value must be readonly');
        };
    } else {
        getter = options.get;
        setter = options.set;
    }

    return new ComputedRefImpl(getter, setter);
}
