// 将packages下所有文件打包
const fs = require('fs')
const path = require('path')
const execa = require('execa')

// 找到packages下所有模块目录
const packages = fs.readdirSync(path.resolve(__dirname, '../packages'))
    // 筛选非目录文件
    .filter(folder => fs.statSync(`packages/${folder}`).isDirectory())

// 对所有模块并行打包
runParallel(packages, build)

// 并行打包逻辑
function runParallel(targets, iteratorFn) {
    const builders = targets.map(target => iteratorFn(target))
    return Promise.all(builders)
}

// 模块打包方法
async function build(target) {
    // 调用rollup进行打包 并添加环境变量
    await execa(
        'rollup',
        ['-c', '--environment', `TARGET:${target}`],
        {
            // 将子进程打包信息共享到主线程
            stdio: 'inherit'
        }
    )
}