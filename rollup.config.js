// rollup配置文件
import path from 'path'
import ts from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'

// packages路径
const packagesDir = path.resolve(__dirname, 'packages')
// 当前打包模块路径
const packageDir = path.resolve(packagesDir, process.env.TARGET)
const packageName = path.basename(packageDir)
// 解析当前模块下路径
const resolvePath = (p) => path.resolve(packageDir, p)

// 获取模块package.json
const pkg = require(resolvePath('package.json'))

// 映射不同打包类型的配置
const formatsMap = {
    'esm-bundler': {
        file: resolvePath(`dist/${packageName}.esm-bundler.js`),
        format: 'es'
    },
    'cjs': {
        file: resolvePath(`dist/${packageName}.cjs.js`),
        format: 'cjs'
    },
    "global": {
        file: resolvePath(`dist/${packageName}.global.js`),
        format: 'iife'
    }
}

const options = pkg.buildOptions || {}

function createConfig(format, output) {
    output.name = options.name
    output.sourcemap = true

    // 生成rollup配置
    return {
        input: resolvePath(`src/index.ts`),
        output,
        plugins: [
            json(),
            ts({
                // 指定ts配置文件
                tsconfig: path.resolve(__dirname, 'tsconfig.json')
            }),
            // 解析第三方模块
            resolve()
        ]
    }
}

// 导出配置
export default (options.formats || []).map(format => createConfig(format, formatsMap[format]))
