#!/bin/bash

# 这个脚本尝试使用 Node.js v18 来运行应用程序，因为它对 Prisma 客户端有更好的兼容性

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

# 创建或更新.env.server文件
echo "DATABASE_URL=$DATABASE_URL" > .env.server

# 创建或更新.env文件
echo "DATABASE_URL=$DATABASE_URL" > .env

# 尝试使用 nvm 切换到 Node.js v18
if command -v nvm &> /dev/null; then
    echo "尝试使用 nvm 切换到 Node.js v18..."
    nvm use 18 || echo "无法切换到 Node.js v18，请手动安装并使用 Node.js v18"
else
    echo "nvm 未安装，请安装 nvm 并使用 Node.js v18"
    echo "可以通过以下命令安装 nvm:"
    echo "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    echo "然后安装 Node.js v18:"
    echo "nvm install 18"
    echo "nvm use 18"
fi

# 重新生成Prisma客户端
echo "重新生成Prisma客户端..."
npx prisma generate

# 使用开发模式运行应用
echo "使用开发模式运行应用..."
DATABASE_URL="$DATABASE_URL" NODE_ENV=production HOST=0.0.0.0 PORT=4444 npm run dev
