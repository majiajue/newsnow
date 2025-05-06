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

# 清理旧的构建文件
echo "清理旧的构建文件..."
rm -rf dist
rm -rf node_modules/.prisma

# 创建ES模块兼容性脚本
echo "创建ES模块兼容性脚本..."
cat > esm-compat.js << EOL
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
EOL

# 使用环境变量重新构建应用
echo "重新构建应用程序..."
DATABASE_URL="$DATABASE_URL" NODE_OPTIONS="--import ./esm-compat.js" npm run build

# 创建软链接确保相对路径也能找到数据库
echo "创建软链接..."
mkdir -p dist/output/server/database
ln -sf ../../../database/newsnow.db dist/output/server/database/newsnow.db

# 创建 Prisma 导入修复文件
echo "创建 Prisma 导入修复文件..."
cat > dist/output/prisma-fix.js << EOL
// 修复 Prisma 客户端导入问题
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const prismaClient = require('@prisma/client');

export const PrismaClient = prismaClient.PrismaClient;
export default prismaClient;
EOL

# 修改构建后的文件，替换 Prisma 导入
echo "修复构建后的文件..."
find dist/output/server -type f -name "*.mjs" -exec sed -i '' 's|import { PrismaClient } from '"'"'@prisma/client'"'"';|import { PrismaClient } from '"'"'../prisma-fix.js'"'"';|g' {} \;

# 启动应用
echo "启动应用..."
NODE_ENV=production HOST=0.0.0.0 PORT=4444 NODE_OPTIONS="--import ./esm-compat.js" node dist/output/server/index.mjs
