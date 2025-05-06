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

# 确保输出目录存在
mkdir -p ./src/generated/client

# 重新生成Prisma客户端
echo "重新生成Prisma客户端..."
npx prisma generate

# 创建导入修复脚本
cat > ./src/import-fix.js << EOL
// 为所有导入Prisma客户端的文件创建一个统一的导入点
import { PrismaClient } from '../generated/client';

// 创建一个单例实例
export const prisma = new PrismaClient();

// 导出PrismaClient类
export { PrismaClient };

// 默认导出单例实例
export default prisma;
EOL

echo "创建了导入修复脚本: ./src/import-fix.js"

# 使用开发模式运行应用
echo "使用开发模式运行应用..."
DATABASE_URL="$DATABASE_URL" NODE_ENV=production HOST=0.0.0.0 PORT=4444 npm run dev
