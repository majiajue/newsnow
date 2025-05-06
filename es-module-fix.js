// ES 模块兼容层
// 用于解决 require is not defined in ES module scope 问题

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// 创建一个全局的 require 函数，但不覆盖原始的 process 和 path
const originalRequire = createRequire(import.meta.url);

// 创建一个特殊的 require 函数，只处理特定的模块
globalThis.require = function(id) {
  // 只处理内置模块，不处理文件路径
  if (id === 'process' || id === 'path' || id === 'fs' || id === 'os' || id === 'util') {
    return originalRequire(id);
  }
  
  // 对于其他模块，抛出错误
  throw new Error(`Module ${id} not found. ES module compatibility layer only supports built-in modules.`);
};

// 确保 __filename 和 __dirname 在需要时可用
globalThis.__filename = fileURLToPath(import.meta.url);
globalThis.__dirname = path.dirname(globalThis.__filename);

console.log('ES 模块兼容层已加载，提供了有限的 require 函数支持');
