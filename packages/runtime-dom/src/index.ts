// runtime-dom 核心就是提供DOM API方法

import { createRenderer } from '@hw-vue/runtime-core';
import { extend } from '@hw-vue/shared';
import { nodeOps } from './nodeOps';
import { patchProp } from './patchProps';

const rendererOptions = extend({ patchProp }, nodeOps);

export function createApp(rootComponent, rootProps = null) {
    const app = createRenderer(rendererOptions).createApp(rootComponent, rootProps);
    const { mount } = app;

    app.mount = function (container) {
        // 清空容器
        const el = nodeOps.querySelector(container);
        el.innerHTML = '';

        // 组件渲染成DOM并挂载
        mount(container);
    };

    return app;
}
