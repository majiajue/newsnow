#!/bin/bash

# 确保数据库目录存在
mkdir -p ./database
chmod 777 ./database

# 创建空数据库文件
touch ./database/newsnow.db
chmod 666 ./database/newsnow.db

# 修改Prisma schema
sed -i '' 's|url      = ".*"|url      = env("DATABASE_URL")|g' ./prisma/schema.prisma

# 设置环境变量
export DATABASE_URL="file:$(pwd)/database/newsnow.db"
echo "DATABASE_URL=$DATABASE_URL" > .env.server

# 重新生成Prisma客户端
npx prisma generate

# 创建兼容性脚本
cat > esm-compat.js << EOL
import { createRequire } from 'module';
global.require = createRequire(import.meta.url);
EOL

# 启动应用
NODE_ENV=production HOST=0.0.0.0 PORT=4444 node --import ./esm-compat.js dist/output/server/index.mjs
