#!/bin/bash

# 确保数据库目录存在
mkdir -p ./database

# 设置环境变量
export DATABASE_URL="file:./database/newsnow.db"

# 输出信息
echo "启动应用程序，使用 ES 模块兼容层..."

# 使用 Node.js 的 --import 选项预加载兼容层
NODE_OPTIONS="--import ./esm-compat.js" npm run dev
