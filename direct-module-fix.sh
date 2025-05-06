#!/bin/bash

# 确保数据库目录存在
mkdir -p ./database
chmod 777 ./database

# 创建空数据库文件
touch ./database/newsnow.db
chmod 666 ./database/newsnow.db

# 设置绝对路径环境变量
DB_PATH="$(pwd)/database/newsnow.db"
export DATABASE_URL="file:$DB_PATH"
echo "数据库路径: $DATABASE_URL"

# 创建或更新.env.server文件
echo "DATABASE_URL=$DATABASE_URL" > .env.server

# 重新生成Prisma客户端
echo "重新生成Prisma客户端..."
npx prisma generate

# 创建缺失的模块目录
echo "创建缺失的模块目录..."
mkdir -p dist/output/server/node_modules/.prisma/client/

# 创建缺失的default.js文件
echo "创建缺失的default.js文件..."
cat > dist/output/server/node_modules/.prisma/client/default.js << EOL
// 这是一个空的模块，用于解决模块缺失问题
module.exports = {};
EOL

# 创建ES模块兼容性脚本
echo "创建ES模块兼容性脚本..."
cat > esm-compat.js << EOL
import { createRequire } from 'module';
global.require = createRequire(import.meta.url);

// 修复模块解析
const originalResolveFilename = require('module')._resolveFilename;
require('module')._resolveFilename = function(request, parent, isMain, options) {
  if (request === '.prisma/client/default') {
    return require.resolve('./dist/output/server/node_modules/.prisma/client/default.js');
  }
  return originalResolveFilename(request, parent, isMain, options);
};
EOL

# 修复Prisma客户端导入
echo "修复Prisma客户端导入..."
sed -i '' 's|import { PrismaClient } from '"'"'@prisma/client'"'"';|import pkg from '"'"'@prisma/client'"'"';\nconst { PrismaClient } = pkg;|g' dist/output/server/chunks/nitro/nitro.mjs

# 启动应用
echo "启动应用..."
NODE_ENV=production HOST=0.0.0.0 PORT=4444 node --import ./esm-compat.js dist/output/server/index.mjs
