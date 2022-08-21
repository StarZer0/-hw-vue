// 只针对具体某一个包打包
const execa = require('execa')

// TODO: 根据参数解析相应模块
const target = 'reactivity';

build(target)

// 模块打包方法
async function build(target) {
    // 调用rollup进行打包 并添加环境变量
    await execa(
        'rollup',
        // -w指定监听文件变化自动打包
        ['-cw', '--environment', `TARGET:${target}`],
        {
            // 将子进程打包信息共享到主线程
            stdio: 'inherit'
        }
    )
}