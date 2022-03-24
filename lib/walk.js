

// 遍历ast语法树
function walk(ast, {enter, leave}) {
  visit(ast, null, enter,leave)
}

// 访问节点
function visit(node, parent, enter, leave) {
  if (enter) { // 先执行此节点的enter方法
    enter(node, parent)
  }
  // 再遍历子节点，找出类型为对象或数组的子节点
  let childKeys = Object.keys(node).filter(key => typeof node[key] === 'object')

  childKeys.forEach(key => {
    let value = node[key]
    if (Array.isArray(value)) { // 数组
      value.forEach(val => visit(val, node, enter, leave))
    } else if (value && value.type){ // 对象
      visit(value, node, enter, leave)
    }
  })


  if (leave) {
    leave(node, parent)
  }
}

module.exports = walk