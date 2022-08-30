import { effect } from '@hw-vue/reactivity';
import { ShapeFlags } from '@hw-vue/shared';
import { createAppApi } from './apiCreateApp';
import { invokeArrayFns } from './apiLifecycle';
import { createComponentInstance, LifecycleHooks, setupComponent } from './component';
import { queueJob } from './queueJob';
import { isSameVNode, normalizeVNode, TEXT } from './vnode';

// 创建渲染器
export function createRenderer(rendererOptions) {
    const { insert, remove, createElement, createText, setText, setElementText, patchProp, nextSibling } = rendererOptions;

    // 创建render effect函数
    const setupRenderEffect = (instance, container) => {
        // 创建effect 并调用render方法
        instance.update = effect(
            function componentEffect() {
                if (!instance.isMounted) {
                    // 调用beforeMount生命周期钩子
                    if (instance[LifecycleHooks.BEFORE_MOUNT]) {
                        invokeArrayFns(instance[LifecycleHooks.BEFORE_MOUNT]);
                    }

                    const subTree = (instance.subTree = instance.render.call(instance.proxy, instance.proxy));
                    console.log(subTree);
                    patch(null, subTree, container);
                    instance.isMounted = true;

                    // 调用mounted生命周期钩子
                    if (instance[LifecycleHooks.MOUNTED]) {
                        invokeArrayFns(instance[LifecycleHooks.MOUNTED]);
                    }
                } else {
                    // 调用beforeUpdate钩子
                    if (instance[LifecycleHooks.BEFORE_UPDATE]) {
                        invokeArrayFns(instance[LifecycleHooks.BEFORE_UPDATE]);
                    }

                    // 更新
                    const prevTree = instance.subTree;
                    const newProxy = instance.proxy;
                    const subTree = (instance.subTree = instance.render.call(newProxy, newProxy));
                    patch(prevTree, subTree, container);

                    // 调用updated钩子
                    if (instance[LifecycleHooks.UPDATED]) {
                        invokeArrayFns(instance[LifecycleHooks.UPDATED]);
                    }
                }
            },
            {
                scheduler: queueJob,
            }
        );
    };

    function processText(n1, n2, container) {
        if (!n1) {
            insert((n2.el = createText(n2.children)), container);
        }
    }

    function umount(node) {
        remove(node.el);
    }

    const patch = (n1, n2, container, anchor?) => {
        // 不同类型，不同初始化流程
        const { shapeFlag, type } = n2;

        // 判断n1, n2是否是同一节点，不是则没有必要进行patch, 只需要执行节点的卸载和刷新即可
        if (n1 && n2 && !isSameVNode(n1, n2)) {
            // 设置锚点，防止移除旧节点后，新节点因为没有锚点插入到当前节点层级末尾，改变了顺序
            anchor = nextSibling(n1.el);
            umount(n1);
            n1 = null;
        }

        switch (type) {
            case TEXT:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, anchor);
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    // 调用处理组件的逻辑
                    processComponent(n1, n2, container);
                }
        }
    };

    // 挂载子节点
    function mountChildren(children, el) {
        console.log(children);

        (children || []).forEach((child) => {
            // 处理文本虚拟节点
            child = normalizeVNode(child);
            patch(null, child, el);
        });
    }

    function mountElement(vNode, container, anchor?) {
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

        insert(el, container, anchor);
    }

    function patchProps(oldProps, newProps, el) {
        if (oldProps !== newProps) {
            // 遍历更新新属性
            Object.keys(newProps).forEach((key) => {
                if (newProps[key] !== oldProps[key]) {
                    patchProp(el, key, oldProps[key], newProps[key]);
                }
            });
            // 移除旧属性
            Object.keys(oldProps).forEach((key) => {
                if (newProps[key] === undefined) {
                    patchProp(el, key, oldProps[key], null);
                }
            });
        }
    }

    function unmountChildren(children) {
        console.log(children);
        children.forEach((child) => umount(child));
    }

    // 核心Diff
    function patchKeyedChildren(c1, c2, container) {
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;

        // 先分别遍历首尾是为了缩小比对范围

        // 从头对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];

            if (isSameVNode(n1, n2)) {
                patch(n1, n2, container);
            } else {
                break;
            }
            i++;
        }

        // 从尾部开始
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];

            if (isSameVNode(n1, n2)) {
                patch(n1, n2, container);
            } else {
                break;
            }

            e1--;
            e2--;
        }

        if (i > e1) {
            // 有新增的部分
            if (i <= e2) {
                // 找到下一个节点的el当锚点，否则会默认追加到尾部
                // ex: abcd abefgcd i=2 e2=4 anchor = c对应的真实节点，调用patch最终会调用insertBefore方法保证了顺序
                // 如果是ab abcd这样的情况，anchor为null, 会直接插入队列尾部，也保证了顺序
                const anchor = e2 + 1 < c2.length ? c2[e2 + 1].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, anchor);
                    i++;
                }
            }
        } else if (i > e2) {
            if (i <= e1) {
                while (i <= e1) {
                    // 卸载旧节点
                    umount(c1[i]);
                    i++;
                }
            }
        } else {
            // 新旧列表都存在
            let s1 = i;
            let s2 = i;

            // 添加映射表
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const childVNode = c2[i];
                keyToNewIndexMap.set(childVNode.key, i);
            }

            // 需要比较的次数
            const toBePatched = e2 - e1 + 1;
            const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

            // 去旧节点列表查找有没有复用
            for (let i = s1; i <= e1; i--) {
                const oldVNode = c1[i];
                let newIndex = keyToNewIndexMap.get(oldVNode.key);
                if (newIndex === undefined) {
                    umount(oldVNode);
                } else {
                    // 标记哪些节点被patch过了
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    // 比较新老节点(但是没有调整位置)
                    patch(oldVNode, c2[newIndex], container);
                }
            }

            // 获取最长递增子序列，避免频繁移动节点
            const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
            let j = increasingNewIndexSequence.length - 1;

            // 倒叙遍历可以保证每一个的anchor可以获取
            for (let i = toBePatched - 1; i >= 0; i--) {
                const curIndex = i + s2; // 当前索引
                const child = c2[curIndex]; // 当前节点

                // 获取锚点 原理同上
                const anchor = curIndex + 1 < c2.length ? c2[curIndex + 1].el : null;

                if (newIndexToOldIndexMap[i] === 0) {
                    // 为0表示没有被处理，需要调用patch新增节点
                    patch(null, child, container, anchor);
                } else {
                    if (i !== increasingNewIndexSequence[j]) {
                        // 移动元素位置
                        insert(child.el, container, anchor);
                    } else {
                        j--;
                    }
                }
            }

            // 移动节点，将新增节点插入
        }
    }

    function patchChildren(n1, n2, el) {
        // 获取前后子列表
        const c1 = n1.children;
        const c2 = n2.children;

        const prevShapeFlag = n1.shapeFlag;
        const shapeFlag = n2.shapeFlag;

        console.log(shapeFlag & ShapeFlags.TEXT_CHILDREN);

        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 老的是元素数组, 需要依次卸载
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                unmountChildren(c1);
            }

            // 两个都是文本的情况, 只需要直接替换文本值
            if (c1 !== c2) {
                console.log('22');
                setElementText(el, c2);
            }
        } else {
            // 当前是普通元素
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    // 两次都是数组 进行diff
                    patchKeyedChildren(c1, c2, el);
                } else {
                    // 删除旧节点列表
                    unmountChildren(c1);
                }
            } else {
                // 更新前是文本
                if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                    setElementText(el, '');
                }

                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    mountChildren(c2, el);
                }
            }
        }
    }

    /**
     * Element 节点diff
     * @param n1
     * @param n2
     * @param container
     */
    function patchElement(n1, n2, container) {
        console.log('patch Element');
        // 因为元素节点相同，执行元素复用
        const el = (n2.el = n1.el);

        // 获取新旧props (这里的props指代传入h函数第二个参数 ex:{ onClick, style, value, class ...})
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        // 比较props
        patchProps(oldProps, newProps, el);

        // 比较子孙节点
        patchChildren(n1, n2, container);
    }

    function processElement(n1, n2, container, anchor?) {
        if (!n1) {
            mountElement(n2, container, anchor);
        } else {
            // 进行节点diff
            patchElement(n1, n2, container);
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

function getSequence(arr: number[]): number[] {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                } else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}
