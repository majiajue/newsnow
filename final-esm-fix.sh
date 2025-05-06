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

# 更新.env.server文件
echo "DATABASE_URL=$DATABASE_URL" > .env.server

# 更新.env文件
echo "DATABASE_URL=$DATABASE_URL" > .env

# 创建临时修复目录
mkdir -p ./dist/.nitro/dev/

# 创建修复后的index.mjs文件
echo "创建修复后的index.mjs文件..."
cat > ./dist/.nitro/dev/fixed-index.mjs << EOL
// 修复后的入口文件
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 使用CommonJS方式导入PrismaClient
const { PrismaClient } = require('@prisma/client');

// 其他导入和代码将在这里
// ...

// 创建Prisma客户端实例
const prisma = new PrismaClient();

// 导出供其他模块使用
export { prisma, PrismaClient };
EOL

# 创建启动脚本
echo "创建启动脚本..."
cat > ./run-fixed.js << EOL
// 启动脚本
import { createRequire } from 'module';
global.require = createRequire(import.meta.url);

// 使用修复后的入口文件
import('./dist/.nitro/dev/fixed-index.mjs')
  .then(() => {
    console.log('应用成功启动');
  })
  .catch(err => {
    console.error('启动失败:', err);
  });
EOL

# 启动应用
echo "启动应用..."
DATABASE_URL="$DATABASE_URL" NODE_ENV=production HOST=0.0.0.0 PORT=4444 node run-fixed.js
