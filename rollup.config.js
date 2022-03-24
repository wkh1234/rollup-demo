import json from 'rollup-plugin-json';



export default {
  input: 'src/main.js',
  output: {
    file: './dist/bundle.js',
    format: 'cjs', // 输出格式 amd es6 cjs iife umd 等
    name: 'bundleName' // 如果是iife umd 需要指定一个全局变量
  },
  plugins: [ json() ]
};