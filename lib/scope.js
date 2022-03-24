class Scope { // 模拟作用域
  constructor(options={}) {
    this.name = options.name
    this.parent = options.parent // 父作用域
    this.names = options.params || [] // 此作用域内有哪些变量
  }

  add (name) {
    this.names.push(name)
  }

  findDefiningScope(name) {
    if (this.names.includes(name)) {
      return this
    }
    if (this.parent) {
      return this.parent.findDefiningScope(name)
    }
    return null
  }
}
// tree-shaking 的原理核心就是基于这样的一个scope chain


module.exports = Scope
