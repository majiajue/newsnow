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

# 更新.env.server文件
echo "DATABASE_URL=$DATABASE_URL" > .env.server

# 更新.env文件
echo "DATABASE_URL=$DATABASE_URL" > .env

# 创建Nitro开发目录
mkdir -p ./dist/.nitro/dev/

# 修补Prisma导入问题
echo "修补Prisma导入问题..."
cp ./patch-prisma.js ./dist/.nitro/dev/

# 创建修补脚本
echo "创建修补脚本..."
cat > ./patch-nitro.js << EOL
// 修补Nitro开发服务器的导入问题
import fs from 'fs';
import path from 'path';

const nitroDevDir = './dist/.nitro/dev/';
const indexPath = path.join(nitroDevDir, 'index.mjs');

// 检查文件是否存在
if (fs.existsSync(indexPath)) {
  // 读取原始文件内容
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // 替换Prisma导入
  content = content.replace(
    /import\s*{\s*PrismaClient\s*}\s*from\s*['"].*?['"]/g,
    "import { PrismaClient, prisma } from './patch-prisma.js'"
  );
  
  // 替换Prisma实例化
  content = content.replace(
    /const\s+prisma\s*=\s*new\s+PrismaClient\(\)/g,
    '// 使用预初始化的prisma实例'
  );
  
  // 写回文件
  fs.writeFileSync(indexPath, content);
  console.log('成功修补Nitro开发服务器文件');
} else {
  console.log('Nitro开发服务器文件不存在，将在启动时创建');
}
EOL

# 使用开发模式运行应用
echo "使用开发模式运行应用..."
DATABASE_URL="$DATABASE_URL" NODE_ENV=production HOST=0.0.0.0 PORT=4444 npm run dev
