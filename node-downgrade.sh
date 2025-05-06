#!/bin/bash

# 这个脚本通过使用较低版本的Node.js来解决问题
# Node.js v16或v18对ES模块和CommonJS模块的兼容性更好

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

# 创建ES模块兼容性脚本
echo "创建ES模块兼容性脚本..."
cat > esm-compat.js << EOL
import { createRequire } from 'module';
global.require = createRequire(import.meta.url);
EOL

# 清理旧的构建文件
echo "清理旧的构建文件..."
rm -rf dist
rm -rf node_modules/.prisma

# 使用nvm切换到Node.js v18（如果已安装）
echo "尝试切换到Node.js v18..."
if command -v nvm &> /dev/null; then
    nvm use 18 || echo "无法切换到Node.js v18，继续使用当前版本"
else
    echo "nvm未安装，建议安装Node.js v18以解决兼容性问题"
fi

# 重新生成Prisma客户端
echo "重新生成Prisma客户端..."
npx prisma generate

# 重新构建应用程序
echo "重新构建应用程序..."
npm run build

# 创建软链接确保相对路径也能找到数据库
echo "创建软链接..."
mkdir -p dist/output/server/database
ln -sf ../../../database/newsnow.db dist/output/server/database/newsnow.db

# 启动应用
echo "启动应用..."
NODE_ENV=production HOST=0.0.0.0 PORT=4444 node --import ./esm-compat.js dist/output/server/index.mjs
