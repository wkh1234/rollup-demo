let acorn = require('acorn')
// walk 遍历语法树
let walk = require('./walk')
// parse 转化抽象语法树
let astTree = acorn.parse(`import $ from 'jquery'`, {
  locations: true, // 是否显示位置
  ranges: true, // 是否显示范围
  sourceType:'module', // 源代码类型
  ecmaVersion:8
})
let ident = 0
const padding = () => " ".repeat(ident)
// 遍历语法树中的每一条语句
astTree.body.forEach(item => {
  // 每一条语句传递给walk方法，由walk遍历这条语句的子元素
  // 采用深度优先的方法进行遍历
  walk(item, {
    enter(node) { // 进入节点
      if (node.type) {
        console.log(padding() + node.type + '进入')
        ident+=2
      }
      
    },
    leave(node) { // 离开节点
      if (node.type) {
        ident-=2
        console.log(padding() + node.type+ '离开')
      }
    }

  })
});