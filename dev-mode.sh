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

# 创建或更新.env文件（开发模式使用）
echo "DATABASE_URL=$DATABASE_URL" > .env

# 创建或更新.env.server文件
echo "DATABASE_URL=$DATABASE_URL" > .env.server

# 重新生成Prisma客户端
echo "重新生成Prisma客户端..."
npx prisma generate

# 初始化数据库
echo "初始化数据库..."
npx prisma db push --skip-generate

# 创建ES模块兼容性脚本
echo "创建ES模块兼容性脚本..."
cat > esm-compat.js << EOL
import { createRequire } from 'module';
global.require = createRequire(import.meta.url);
EOL

# 使用开发模式运行应用
echo "使用开发模式运行应用..."
HOST=0.0.0.0 PORT=4444 NODE_OPTIONS="--import ./esm-compat.js" npm run dev
