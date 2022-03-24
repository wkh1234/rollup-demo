let fs = require('fs')
const Module = require('./module')
let MagicString = require('magic-string')
let path = require('path')


class Bundle {
  constructor(options) {
    // 入口文件的绝对路径，包括后缀名称
    this.entryPath = options.entry.replace(/\.js$/, '') + '.js' // 保证文件名称有js后缀
    this.modules = {} // 存放着所有模块，包括入口文件和他依赖的所有模块
  }

  build(outputFileName) {
    // 从入口文件的绝对路径出发，找到他的模块定义,获取模块实例
    let entryModule = this.fetchModule(this.entryPath)
    // 把这个入口模块所有的语句进行展开，返回所有的语句组成的数组
    this.statements = entryModule.expandAllStatements()
    // 生成代码
    const { code } = this.generate()
    // 生成打包文件，输出代码
    fs.writeFileSync(outputFileName, code, 'utf-8')

  }

  // 获取模块信息
  fetchModule (importPath, importer) {// importer -父模块
    let route; // 入口文件的绝对路径
    if(!importer) { // 如果没有模块导入此模块（没有父模块），说明这就是入口模块
      route = importPath 
    } else {
      if (path.isAbsolute(importPath)) { // 如果是绝对路径
        route = importPath 
      } else if(importPath[0] == '.'){ // 相对路径
        route = path.resolve(path.dirname(importer), importPath.replace(/\.js$/, '') + '.js')
      } 
    }

    if (route) {
      // 读取文件中的代码
      let code = fs.readFileSync(route, 'utf8')
      let module = new Module({
        code, // 模块的源代码
        path: route, // 模块的绝对路径
        bundle: this // 属于哪个bundle
      })
      return module
    }
  }
  // 把 this.statements 生成代码
  generate() {
    let magicString = new MagicString.Bundle()
    this.statements.forEach(node => {
        const source = node._source.clone() // _source 在 analyse 方法中添加
        if (node.type === 'ExportNamedDeclaration'){
          source.remove(node.start, node.declaration.start)
        }
        magicString.addSource({
          content: source,
          separator: '\n'
        })
    });
    return {code: magicString.toString()}
  }
}

module.exports = Bundle