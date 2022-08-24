// 本质上也是h函数，需要支持h函数和传入组件的情况
// case 1: h('div', { class: 'class-name' }, [childrens])

import { isArray, isObject, isString, ShapeFlags } from '@hw-vue/shared';

// case 2: createVNode(component, props)
export function createVNode(component, props, children = null) {
    // 根据component的类型判断是普通元素还是组件

    const shapeFlag = isString(component) ? ShapeFlags.ELEMENT : isObject(component) ? ShapeFlags.STATEFUL_COMPONENT : 0;

    const vnode = {
        __v_isVnode: true,
        type: component,
        props,
        children,
        el: null,
        key: props?.key,
        shapeFlag, // 判断当前虚拟节点自己的类型和儿子的类型
    };

    normalizeChildren(vnode, children);

    return vnode;
}

function normalizeChildren(vnode, children) {
    let type = 0;
    if (children === null) {
        // 不需要做任何处理
    } else if (isArray(children)) {
        type = ShapeFlags.ARRAY_CHILDREN;
    } else {
        type = ShapeFlags.TEXT_CHILDREN;
    }

    vnode.shapeFlag |= type;
}
