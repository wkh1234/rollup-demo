export default function myExample () {
  return {
      name: 'my-example', // 这个名字将会出现在在警告和报错中
      resolveId ( importee ) {
          if (importee === 'virtual-module') {
              return importee; // 这个告诉rollup不应该通过其他的插件或者检查文件系统去寻找这个id
          }
          return null; // 其他的id不受影响
      },
      load ( id ) {
          if (id === 'virtual-module') {
              return 'export default "This is virtual!"'; // "virtual-module"的源码
          }
          return null; // 其他的id还是通过正常的方式解析
      }
  };
}
