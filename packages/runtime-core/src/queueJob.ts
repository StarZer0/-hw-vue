let queue = [];

// 将执行任务放入队列中
export function queueJob(job) {
    // 去重
    if (!queue.includes(job)) {
        queue.push(job);
        queueFlush();
    }
}

// 是否正在刷新中
let isFlushPending = false;
function queueFlush() {
    // 只有第一次执行queueFlush时才会将当前flushPending置为true
    // 同时会将清空队列的方法放到微任务队列执行
    // 这样保证了数据更新后，视图不是立马更新
    if (!isFlushPending) {
        isFlushPending = true;
        Promise.resolve().then(flushJobs);
    }
}

function flushJobs() {
    isFlushPending = false;

    // 清空队列时，需要根据调用顺序依次刷新, 保证父子刷新顺序
    queue.sort((a, b) => a.id - b.id);
    // 遍历执行
    queue.forEach((job) => job());
    // 清空队列
    queue = [];
}
