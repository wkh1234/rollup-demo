


// 分析语法树

const walk = require("./walk");
const Scope = require("./scope");

// 找出当前模块使用了哪些变量，区分当前模块声明的变量，和导入的别的模块的变量
function analyse (ast, magicString, module) {
  let scope = new Scope() // 先创建一个模块内的全局作用域
  //遍历当前所有的语法树的所有顶级节点
  ast.body.forEach(node => { // body 下面的顶级节点
    
    // 给作用域添加变量，var let const function 变量声明
    function addToScope(declaration) {
      let name = declaration.id.name // 获得这个声明的变量
      scope.add(name);  // 把这个变量添加到当前作用域
      if (!scope.parent) { // 如果当前是全局作用域
        node._defines[name] = true // 在全局作用域下声明一个全局的变量
      }
    }

    Object.defineProperties(node, {
      // start 指的是此节点在源码中的起始索引，end是结束索引
      _source: {
        value: magicString.snip(node.start, node.end)
      },
      _defines:{value:{}}, // 存放当前模块定义的所有的全局变量
      _dependsOn:{value: {}}, // 当前模块没有定义 但是使用到的变量，也就是依赖的外部变量
      _dependsOwnOn:{value:{}},//当前模块定义的变量 当前节点依赖了哪些内部变量
      _included:{ value: false, writable: true}, // 此语句是否已经被 包含到打包结果中
    })
    // 构建作用域链
    walk(node, {
      enter(node) {
        let newScope
        switch(node.type) {
          case 'FunctionDeclaration': // 当前节点是一个函数声明
            const params = node.params.map(x =>x.name)
            addToScope(node)
            // 创建一个新的作用域对象
            newScope = new Scope({
              parent: scope, // 父作用域就是当前的作用域
              params
            })
            break
          case 'VariableDeclaration': // 普通声明，不会行成新的作用域
            node.declarations.forEach(addToScope)
            break
        }
        if (newScope) { // 当前节点声明一个新的作用域
          // 如果此节点生成一个新的作用域，那么会在这个节点放一个_scope, 指向新的作用域
          Object.defineProperty(node, '_scope', {value: newScope})
          scope = newScope
        }
      },

      leave(node) {
        if(node._scope) { // 如果此节点产出一个新的作用域，那等离开这个节点，scope回到父组用域
          scope = scope.parent
        }
      }
    })

  });

  // 找出外部依赖,给_dependOn赋值
  ast.body.forEach(statement => {
    walk(statement, {
      enter(node) {
        if(node._scope) { //节点有_scope属性，说明该节点产生了一个新的作用域
          scope = node._scope
        }
        if (node.type === 'Identifier') { // 一个变量
          // 从当前作用域向上递归，找到这个变量在那个作用域中定义
          const definingScope = scope.findDefiningScope(node.name)
          if (!definingScope) {
            statement._dependsOn[node.name] = true // 表示这是一个外部依赖变量
          } else{
          statement._dependsOwnOn[node.name]=true;//添加标识符依赖 依赖了哪些内部变量
        }
        }
      },
      leave(node) {
        if(node._scope) scope = scope.parent
      }
    })

  });
}

module.exports = analyse