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

# 创建包装器文件
echo "创建包装器文件..."
mkdir -p dist/output/
cat > dist/output/prisma-wrapper.js << EOL
// 创建一个 ESM 兼容的 Prisma 客户端包装器
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 使用 CommonJS require 导入 Prisma 客户端
const prismaClient = require('@prisma/client');
const { PrismaClient: OriginalPrismaClient } = prismaClient;

// 导出兼容的 PrismaClient
export const PrismaClient = OriginalPrismaClient;
export default { PrismaClient };
EOL

# 修改构建后的文件中的Prisma导入
echo "修改构建后的文件中的Prisma导入..."
sed -i '' 's|import { PrismaClient } from '"'"'@prisma/client'"'"';|import { PrismaClient } from '"'"'../prisma-wrapper.js'"'"';|g' dist/output/server/chunks/nitro/nitro.mjs

# 创建ES模块兼容性脚本
echo "创建ES模块兼容性脚本..."
cat > esm-compat.js << EOL
import { createRequire } from 'module';
global.require = createRequire(import.meta.url);
EOL

# 启动应用
echo "启动应用..."
NODE_ENV=production HOST=0.0.0.0 PORT=4444 node --import ./esm-compat.js dist/output/server/index.mjs
