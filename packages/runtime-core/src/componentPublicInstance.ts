import { hasOwn } from '@hw-vue/shared';

export const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        console.log(instance, key);
        if (hasOwn(instance.setupState, key)) {
            return instance.setupState[key];
        } else if (hasOwn(instance.props, key)) {
            return instance.props[key];
        } else if (hasOwn(instance.data, key)) {
            return instance.data[key];
        }
    },
    set({ _: instance }, key, value) {
        if (hasOwn(instance.setupState, key)) {
            instance.setupState[key] = value;
        } else if (hasOwn(instance.props, key)) {
            instance.props[key] = value;
        } else if (hasOwn(instance.data, key)) {
            instance.props[key] = value;
        }
    },
};
