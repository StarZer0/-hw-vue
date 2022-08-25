import { effect } from '@hw-vue/reactivity';
import { ShapeFlags } from '@hw-vue/shared';
import { createAppApi } from './apiCreateApp';
import { createComponentInstance, setupComponent } from './component';
import { normalizeVNode, TEXT } from './vnode';

// 创建渲染器
export function createRenderer(rendererOptions) {
    const { insert, remove, createElement, createText, setText, setElementText, patchProp } = rendererOptions;

    // 创建render effect函数
    const setupRenderEffect = (instance, container) => {
        // 创建effect 并调用render方法
        effect(function componentEffect() {
            console.log('render gegnx');
            if (!instance.isMounted) {
                const subTree = (instance.subTree = instance.render.call(instance.proxy, instance.proxy));
                console.log(subTree);
                patch(null, subTree, container);
                instance.isMounted = true;
            } else {
                // 更新
                console.log('更新');
            }
        });
    };

    function processText(n1, n2, container) {
        if (!n1) {
            insert((n2.el = createText(n2.children)), container);
        }
    }

    const patch = (n1, n2, container) => {
        // 不同类型，不同初始化流程
        const { shapeFlag, type } = n2;
        switch (type) {
            case TEXT:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container);
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    // 调用处理组件的逻辑
                    processComponent(n1, n2, container);
                }
        }
    };

    // 挂载子节点
    function mountChildren(children, el) {
        children.forEach((child) => {
            // 处理文本虚拟节点
            child = normalizeVNode(child);
            patch(null, child, el);
        });
    }

    function mountElement(vNode, container) {
        console.log(container);
        // 递归渲染
        const { props, shapeFlag, type, children } = vNode;
        // 创建元素
        const el = (vNode.el = createElement(type));
        if (props) {
            Object.keys(props).forEach((key) => patchProp(el, key, null, props[key]));
        }

        console.log(shapeFlag & ShapeFlags.TEXT_CHILDREN);
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            setElementText(el, children);
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el);
        }

        insert(el, container);
    }

    function processElement(n1, n2, container) {
        if (!n1) {
            mountElement(n2, container);
        }
    }

    const mountComponent = (vnode, container) => {
        // 组件渲染流程 调用setup获取返回值，获取render返回结果渲染
        // 创建实例
        const instance = (vnode.component = createComponentInstance(vnode));
        // 将数据解析到实例
        setupComponent(instance);
        // 创建一个effect让render执行
        setupRenderEffect(instance, container);
    };

    const processComponent = (n1, n2, container) => {
        if (n1 === null) {
            mountComponent(n2, container);
        } else {
            // 进行组件更新流程
        }
    };

    const render = (vnode, container) => {
        // 根据不同的虚拟节点，创建对应的真实元素

        patch(null, vnode, container);
    };
    return {
        createApp: createAppApi(render),
    };
}
