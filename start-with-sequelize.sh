#!/bin/bash

# 确保数据库目录存在
mkdir -p ./database

# 设置环境变量
export DATABASE_URL="file:./database/newsnow.db"

# 输出信息
echo "启动应用程序，使用 Sequelize ORM 实现的持久化数据库客户端..."

# 使用 Sequelize 客户端
NODE_OPTIONS="--import ./esm-compat.js" PRISMA_CLIENT_PATH="./server/utils/sequelizeClient.js" npm run dev
