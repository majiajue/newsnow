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

# 安装glob包用于文件查找
echo "安装必要的依赖..."
npm install glob

# 运行替换脚本
echo "运行Prisma导入替换脚本..."
node replace-prisma-imports.js

# 重新生成Prisma客户端
echo "重新生成Prisma客户端..."
npx prisma generate

# 使用开发模式运行应用
echo "使用开发模式运行应用..."
DATABASE_URL="$DATABASE_URL" NODE_ENV=production HOST=0.0.0.0 PORT=4444 npm run dev
