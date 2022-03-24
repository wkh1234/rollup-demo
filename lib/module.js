let MagicString = require('magic-string')
let path = require('path')
let { parse } = require('acorn')
const analyse  = require('./analyse')

// 判断一下 obj对象上 是否有props属性
function ownProperty(obj, props) {
  return Object.prototype.hasOwnProperty.call(obj, props)
}

// 每个文件都是一个模块，每个模块都会对应一个module实例
class Module {
  constructor({code, path, bundle}) {
    this.code = new MagicString(code, {filename: path})
    this.path = path // 模块的路径
    this.bundle = bundle // 属于哪个bundle的实例
    this.ast = parse(code, { // 把源代码转化成抽象语法树--解析依赖
      ecmaVersion: 7,
      sourceType: 'module'
    })
    this.analyse()
  }

  analyse() {
    this.imports = {} // 存放着当前模块的所有的导入
    this.exports = {} // 存放着当前模块的所有导出
    this.ast.body.forEach(node => {
      if (node.type === 'ImportDeclaration') { // 导入语句在ast中的 类型
        let source = node.source.value // 从那个模块进行的导入
        let specifiers = node.specifiers
        specifiers.forEach(specifie => {
          const name = specifie.imported.name;
          const localName = specifie.local.name;
          // 本地的哪个变量，从那个模块的哪个变量导出的
           // this.imports.age = {name: 'age', localName: "age", source: './msg.js}
          this.imports[localName] = {name, localName, source}
        })
      } else if (node.type === 'ExportNamedDeclaration') {
        let declaration = node.declaration
        if (declaration.type === 'VariableDeclaration') {
          let name = declaration.declarations[0].id.name
          // 记录一下当前模块的导出，
          this.exports[name] = {
            node,
            localName:name,
            expression: declaration
          }
        }
      }
    })

    analyse(this.ast, this.code, this) // 找到了_defines 和 _dependsOn
    this.definitions = {} // 存放着所有的全局变量的定义语句
    this.ast.body.forEach(node => {
      Object.keys(node._defines).forEach(name=> {
        // key 是全局变量名，值是定义这个全局变量的语句
        this.definitions[name] = node
      })
    })
  }
  // 展开这个模块里的语句，把这些语句中定义的变量的语句，都放到结果里
  expandAllStatements() {
    let allStatements = []
    this.ast.body.forEach(node => {
      if(node.type === 'ImportDeclaration') return
      if(node.type === 'VariableDeclaration') return;//如果是变量声明的，也不需要了
      if(node.type === 'FunctionDeclaration') return;//如果是变量声明的，也不需要了
      let statement = this.expandStatements(node)
      allStatements.push(...statement)
    });
    return allStatements
  }

  // 展开一个节点
  // 找到当前节点依赖的变量（访问的变量）；找到这些变量声明的语句
  // 这些语句可能是在当前模块声明的，也可能是在导入的模块声明的
  expandStatements (node) {
    let result = []
    node._include = true; // 表示这个节点已经确定被纳入到打包结果中，以后不需要重复添加

    const dependencies = Object.keys(node._dependsOn) // 外部依赖
    dependencies.forEach(name => {
      // 找到定义这个变量的声明节点，这个节点可以在当前模块内，也可以在依赖的模块里
      let definition = this.define(name)
      result.push(...definition)
    })

    const dependenciesOwn = Object.keys(node._dependsOwnOn);//[age]
    dependenciesOwn.forEach(name=>{
      let definition = this.define(name);//找到age变量的定义语句，然后返回
      result.push(...definition);
    });
    //2.添加自己的语句
    result.push(node);

    return result
  }
  define(name) {
    // 差找一下导入变量里有没有name
    if (ownProperty(this.imports, name)) {
      // this.imports.age = {name: 'age', localName: "age", source: './msg.js}
      const importData = this.imports[name]
      debugger
      // 获取msg模块 有 exports inports
      const module= this.bundle.fetchModule(importData.source, this.path)
      const exportData = module.exports[importData.name]
      // console.log(exportData, importData.name, module)
      // 调用msg模块的define方法，参数是msg模块的本地变量名，为了返回定义变量的语句
      return module.define(exportData.localName)
    } else {
        // definetions 是对象，key是当前模块的变量名，值是定义这个变量的语句
        let statement = this.definitions[name]
        if (statement && !statement._include) { // 语句存在 没有被包含
          return this.expandStatements(statement) // 递归执行展开
        } else {
          return []
        }
    }

  }
}
module.exports = Module