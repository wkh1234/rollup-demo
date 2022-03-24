var MagicString = require('magic-string')

let myString = new MagicString('export var name = "小明"')

console.log(myString.snip(0,6).toString()) // 删除0之前，6之后，类似截取字符串

// 从开始到结束，删除字符，基于原始字符串
console.log(myString.remove(0,7).toString())

// 很多模块，把他们打包到一个文件里，需要 很多文件的源代码合在一起

let bundleString = new MagicString.Bundle()
bundleString.addSource({
  content: 'var a = 1',
  separator:'\n'
})

bundleString.addSource({
  content: 'var b = 2',
  separator:'\n'
})
// let str = ''
// str += 'var a = 1\n'
// str += 'var b = 2\n'
// console.log(str)
console.log(bundleString.toString())