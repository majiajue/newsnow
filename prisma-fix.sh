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

# 修改 Prisma schema 添加输出路径
echo "修改 Prisma schema 添加输出路径..."
sed -i '' 's/provider = "prisma-client-js"/provider = "prisma-client-js"\n  output   = ".\/prisma\/client"/' ./prisma/schema.prisma

# 重新生成Prisma客户端到指定位置
echo "重新生成Prisma客户端..."
npx prisma generate

# 创建 Prisma 客户端包装器
echo "创建 Prisma 客户端包装器..."
mkdir -p ./server/utils
cat > ./server/utils/prisma.js << EOL
// ESM 兼容的 Prisma 客户端包装器
import { PrismaClient } from '../../prisma/client'

const prisma = new PrismaClient()

export { prisma }
export default prisma
EOL

# 清理旧的构建文件
echo "清理旧的构建文件..."
rm -rf dist
rm -rf node_modules/.prisma

# 创建ES模块兼容性脚本
echo "创建ES模块兼容性脚本..."
cat > esm-compat.js << EOL
import { createRequire } from 'module';
global.require = createRequire(import.meta.url);
EOL

# 重新构建应用程序
echo "重新构建应用程序..."
npm run build

# 启动应用
echo "启动应用..."
NODE_ENV=production HOST=0.0.0.0 PORT=4444 node --import ./esm-compat.js dist/output/server/index.mjs
