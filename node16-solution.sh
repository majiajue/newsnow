#!/bin/bash

# 这个脚本使用 Node.js v16 来运行应用程序
# Node.js v16 对 Prisma 客户端的兼容性更好

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

# 尝试使用 nvm 切换到 Node.js v16
if command -v nvm &> /dev/null; then
    echo "尝试使用 nvm 切换到 Node.js v16..."
    nvm use 16 || echo "无法切换到 Node.js v16，请手动安装并使用 Node.js v16"
else
    echo "nvm 未安装，请安装 nvm 并使用 Node.js v16"
    echo "可以通过以下命令安装 nvm:"
    echo "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    echo "然后安装 Node.js v16:"
    echo "nvm install 16"
    echo "nvm use 16"
    exit 1
fi

# 清理旧的构建文件
echo "清理旧的构建文件..."
rm -rf dist
rm -rf node_modules/.prisma

# 重新安装依赖
echo "重新安装依赖..."
npm install

# 重新生成 Prisma 客户端
echo "重新生成 Prisma 客户端..."
npx prisma generate

# 重新构建应用程序
echo "重新构建应用程序..."
npm run build

# 启动应用
echo "启动应用..."
NODE_ENV=production HOST=0.0.0.0 PORT=4444 node dist/output/server/index.mjs
