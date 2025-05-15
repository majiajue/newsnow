#!/bin/bash

# 先停止所有Node进程
echo "停止现有 Node 进程..."
# pkill -f node || true

# 确保数据库目录存在
mkdir -p ./database

# 设置环境变量
export DATABASE_URL="file:./database/newsnow.db"
export PRISMA_CLIENT_PATH="./server/utils/sequelizeClient.js"
export FORCE_SEQUELIZE="true"

# 检查数据库文件
if [ -f "./database/newsnow.db" ]; then
  echo "数据库文件存在，大小: $(du -h ./database/newsnow.db | cut -f1)"
else
  echo "数据库文件不存在，将创建新数据库"
fi

# 输出信息
echo "启动应用程序，强制使用 Sequelize ORM 实现的持久化数据库客户端..."

# 使用 Sequelize 客户端并设置额外的环境变量
NODE_OPTIONS="--import ./esm-compat.js" \
PRISMA_CLIENT_PATH="./server/utils/sequelizeClient.js" \
FORCE_SEQUELIZE="true" \
SEQUELIZE_LOGGING="true" \
npm run dev
