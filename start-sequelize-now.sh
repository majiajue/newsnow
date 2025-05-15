#!/bin/bash

# 强制使用 Sequelize 的启动脚本

# 确保数据库目录存在
mkdir -p ./database

# 强制修改 prismaClient.js 文件
echo "// 强制使用 Sequelize 实现
// 此文件确保所有 prisma 调用都重定向到 sequelizeClient.js

// 导入必要的环境检查工具
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 强制使用 Sequelize
process.env.FORCE_SEQUELIZE = 'true';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./database/newsnow.db';

// 确保数据库目录存在
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.resolve(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(\`创建数据库目录: \${dbDir}\`);
}

// 记录状态
console.log('★★★ 强制使用 Sequelize ORM ★★★');

// 重新导出 sequelizeClient.js 的所有内容
export * from './sequelizeClient.js';
export { default } from './sequelizeClient.js';
" > ./server/utils/prismaClient.js

# 停止所有Node进程
echo "停止现有Node进程..."
pkill -f node || true
sleep 2

# 设置必要的环境变量
export DATABASE_URL="file:./database/newsnow.db"
export PRISMA_CLIENT_PATH="./server/utils/sequelizeClient.js"
export FORCE_SEQUELIZE="true"
export SEQUELIZE_LOGGING="true"

# 输出关键信息
echo "数据库路径: $DATABASE_URL"
echo "强制使用 Sequelize: $FORCE_SEQUELIZE"

# 启动应用
echo "启动应用程序..."
NODE_OPTIONS="--import ./esm-compat.js" npm run dev
