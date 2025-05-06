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

# 创建或更新.env.server文件
echo "DATABASE_URL=$DATABASE_URL" > .env.server

# 清理旧的构建文件
echo "清理旧的构建文件..."
rm -rf dist
rm -rf node_modules/.prisma

# 重新生成Prisma客户端
echo "重新生成Prisma客户端..."
npx prisma generate

# 重新构建应用程序
echo "重新构建应用程序..."
npm run build

# 初始化数据库
echo "初始化数据库..."
npx prisma db push --skip-generate

# 创建ES模块兼容性脚本
echo "创建ES模块兼容性脚本..."
cat > esm-compat.js << EOL
import { createRequire } from 'module';
global.require = createRequire(import.meta.url);
EOL

# 启动应用
echo "启动应用..."
NODE_ENV=production HOST=0.0.0.0 PORT=4444 node --import ./esm-compat.js dist/output/server/index.mjs
