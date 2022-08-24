// 导出属性相关操作

import { pathClass } from './modules/class';
import { pathEvent } from './modules/events';
import { pathStyle } from './modules/style';

export const patchProp = (el, key, prevVal, nextVal) => {
    switch (key) {
        case 'class':
            pathClass(el, nextVal);
            break;
        case 'style':
            pathStyle(el, prevVal, nextVal);
            break;
        default:
            if (/^on[^a-z]/.test(key)) {
                // 判断是否是事件
                pathEvent(el, key, nextVal);
            }
            break;
    }
};
