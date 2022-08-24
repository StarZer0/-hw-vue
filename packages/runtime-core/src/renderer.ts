import { createAppApi } from './apiCreateApp';

// 创建渲染器
export function createRenderer(rendererOptions) {
    const render = (vnode, container) => {};
    return {
        createApp: createAppApi(render),
    };
}
