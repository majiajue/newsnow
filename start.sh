#!/bin/bash

# 确保数据库目录存在
mkdir -p ./database
chmod 777 ./database

# 确保数据库文件存在并设置权限
touch ./database/newsnow.db
chmod 666 ./database/newsnow.db

# 确保环境变量文件存在
if [ ! -f .env.server ]; then
  echo "创建默认的.env.server文件"
  cp example.env.server .env.server
fi

# 设置数据库URL环境变量
export DATABASE_URL="file:$(pwd)/database/newsnow.db"
echo "数据库路径: $DATABASE_URL"

# 修改.env.server文件，添加DATABASE_URL
grep -q "DATABASE_URL" .env.server || echo "DATABASE_URL=$DATABASE_URL" >> .env.server

# 重新生成Prisma客户端
echo "重新生成Prisma客户端..."
npx prisma generate

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
node --env-file .env.server --import ./esm-compat.js dist/output/server/index.mjs
