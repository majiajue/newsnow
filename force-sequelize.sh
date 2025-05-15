#!/bin/bash

# 确保数据库目录存在
mkdir -p ./database

# 设置强制环境变量
export DATABASE_URL="file:./database/newsnow.db"
export PRISMA_CLIENT_PATH="./server/utils/sequelizeClient.js"
export FORCE_SEQUELIZE="true"

# 输出信息
echo "强制使用 Sequelize ORM 实现的持久化数据库客户端..."

# 杀掉已有进程
pkill -f node || true

# 使用强制模式启动
NODE_OPTIONS="--import ./esm-compat.js" PRISMA_CLIENT_PATH="./server/utils/sequelizeClient.js" FORCE_SEQUELIZE="true" npm run dev
