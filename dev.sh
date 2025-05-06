#!/bin/bash

# 确保数据库目录存在
mkdir -p ./database
chmod 777 ./database

# 确保数据库文件存在并设置权限
touch ./database/newsnow.db
chmod 666 ./database/newsnow.db

# 设置数据库URL环境变量
export DATABASE_URL="file:$(pwd)/database/newsnow.db"
echo "数据库路径: $DATABASE_URL"

# 确保环境变量文件存在
if [ ! -f .env.server ]; then
  echo "创建默认的.env.server文件"
  cp example.env.server .env.server
fi

# 修改.env.server文件，添加DATABASE_URL
if grep -q "DATABASE_URL" .env.server; then
  sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|g" .env.server
else
  echo "DATABASE_URL=$DATABASE_URL" >> .env.server
fi

# 使用开发模式运行应用
echo "使用开发模式运行应用..."
npm run dev
