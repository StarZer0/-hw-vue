export const nodeOps = {
    // 创建元素
    createElement: (tagName: string) => document.createElement(tagName),
    // 移除元素
    remove: (child: HTMLElement) => {
        child.remove();
        // const parent = child.parentNode;
    },
    // 插入元素
    insert: (child: HTMLElement, parent: HTMLElement, anchor: HTMLElement | null = null) => {
        parent.insertBefore(child, anchor);
    },
    // 查询元素
    querySelector: (selector: string) => document.querySelector(selector),
    // 设置节点内容
    setElementText: (node: HTMLElement, text: string) => (node.innerText = text),
    // 创建文本节点
    createText: (text: string) => document.createTextNode(text),
    // 设置文本节点内容
    setText: (node: Text, text: string) => (node.nodeValue = text),
    // 获取下一个节点
    nextSibling: (node) => node.nextSibling,
};
