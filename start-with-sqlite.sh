#!/bin/bash

# 确保数据库目录存在
mkdir -p ./database

# 设置环境变量
export DATABASE_URL="file:./database/newsnow.db"

# 输出信息
echo "启动应用程序，使用 SQLite 持久化的模拟 Prisma 客户端..."

# 运行应用程序
npm run dev
