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

# 创建ES模块兼容性脚本
echo "创建ES模块兼容性脚本..."
cat > esm-compat.js << EOL
import { createRequire } from 'module';
global.require = createRequire(import.meta.url);
EOL

# 创建一个简单的Prisma客户端模拟
echo "创建Prisma客户端模拟..."
mkdir -p ./server/utils
cat > ./server/utils/prismaClient.js << EOL
// 模拟Prisma客户端
export class PrismaClient {
  constructor() {
    console.log('使用模拟的PrismaClient');
  }
  
  async \$connect() { return this; }
  async \$disconnect() { return this; }
}

// 导出单例实例
export const prisma = new PrismaClient();
export default prisma;
EOL

# 使用开发模式运行应用
echo "使用开发模式运行应用..."
DATABASE_URL="$DATABASE_URL" NODE_ENV=production HOST=0.0.0.0 PORT=4444 NODE_OPTIONS="--import ./esm-compat.js" npm run dev
