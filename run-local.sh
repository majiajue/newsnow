#!/bin/bash

# 设置数据库目录和文件
DB_DIR="$(pwd)/database"
DB_FILE="$DB_DIR/newsnow.db"

# 确保数据库目录存在
mkdir -p "$DB_DIR"
chmod 777 "$DB_DIR"

# 确保数据库文件存在并设置权限
touch "$DB_FILE"
chmod 666 "$DB_FILE"

# 设置数据库URL环境变量
export DATABASE_URL="file:$DB_FILE"
echo "数据库路径: $DATABASE_URL"

# 修改.env.server文件，添加DATABASE_URL
if [ -f .env.server ]; then
  # 如果已存在DATABASE_URL，则替换它
  if grep -q "DATABASE_URL" .env.server; then
    sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|g" .env.server
  else
    # 否则添加它
    echo "DATABASE_URL=$DATABASE_URL" >> .env.server
  fi
else
  # 如果文件不存在，创建它
  echo "DATABASE_URL=$DATABASE_URL" > .env.server
fi

# 创建ES模块兼容性脚本
echo "创建ES模块兼容性脚本..."
cat > esm-compat.js << EOL
import { createRequire } from 'module';
global.require = createRequire(import.meta.url);
EOL

# 启动应用
echo "启动应用..."
NODE_ENV=production HOST=0.0.0.0 PORT=4444 node --env-file .env.server --import ./esm-compat.js dist/output/server/index.mjs
