import { createVNode } from './vnode';

export function createAppApi(render) {
    return function createApp(rootComponent, rootProps) {
        const app = {
            _props: rootProps,
            _component: rootComponent,
            _container: null,
            mount(container) {
                // 1. 创建虚拟节点
                const vnode = createVNode(rootComponent, rootProps);
                console.log(vnode);
                // 2. 调用render方法进行渲染
                render(vnode, container);

                app._container = container;
            },
        };

        return app;
    };
}
