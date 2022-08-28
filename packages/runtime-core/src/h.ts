import { isArray, isObject } from '@hw-vue/shared';
import { createVNode, isVNode } from './vnode';

// h('div', 'content')
// h('div', {class: ''})
// h('div', vNode)
// h('div', [vNode1, vNode2])
export function h(type: any, propsOrChildren?: any, children?: any) {
    console.log('h', type, propsOrChildren, children);
    const l = arguments.length;
    if (l === 2) {
        if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
            if (isVNode(propsOrChildren)) {
                return createVNode(type, null, [propsOrChildren]);
            }
            return createVNode(type, propsOrChildren);
        } else {
            return createVNode(type, null, propsOrChildren);
        }
    } else {
        if (l > 3) {
            children = Array.prototype.slice.call(arguments, 2);
        } else if (l === 3 && isVNode(children)) {
            children = [children];
        }

        return createVNode(type, propsOrChildren, children);
    }
}
