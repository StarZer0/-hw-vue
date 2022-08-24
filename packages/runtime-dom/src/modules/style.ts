export function pathStyle(el: HTMLElement, prev, next) {
    const style = el.style;
    if (next === null) {
        el.removeAttribute('style');
    } else {
        // 移除旧属性
        if (prev) {
            Object.keys(prev).forEach((key) => !next[key] && style.removeProperty(key));
        }

        // 添加新的属性
        Object.keys(next).forEach((key) => style.setProperty(key, next[key]));
    }
}
