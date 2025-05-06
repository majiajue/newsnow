import { createRequire } from 'module';
global.require = createRequire(import.meta.url);

// 修复 Prisma 客户端导入问题
const originalLoad = global.__ORIGINAL_LOAD__ = process._load;
process._load = function(request, parent, isMain) {
  if (request === '@prisma/client') {
    const path = require.resolve('@prisma/client');
    return require(path);
  }
  return originalLoad(request, parent, isMain);
};
