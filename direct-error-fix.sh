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

# 创建修复脚本
cat > ./fix-nitro-imports.js << EOL
// 直接修复 Nitro 开发服务器的导入问题
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

// 等待 Nitro 服务器生成文件
const waitForFile = (filePath, maxAttempts = 30, interval = 500) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      if (fs.existsSync(filePath)) {
        resolve(true);
        return;
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        reject(new Error(\`文件 \${filePath} 在 \${maxAttempts} 次尝试后仍未创建\`));
        return;
      }
      
      console.log(\`等待文件 \${filePath} 创建... 尝试 \${attempts}/\${maxAttempts}\`);
      setTimeout(check, interval);
    };
    
    check();
  });
};

// 修复文件
const fixFile = async () => {
  const nitroDevDir = './dist/.nitro/dev/';
  const indexPath = path.join(nitroDevDir, 'index.mjs');
  
  try {
    // 等待文件创建
    await waitForFile(indexPath);
    
    // 读取原始文件内容
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // 替换 Prisma 导入 - 使用错误信息中建议的方式
    content = content.replace(
      /import\s*{\s*PrismaClient\s*}\s*from\s*['"].*?['"]/g,
      "import pkg from 'file:///Users/majiajue/Desktop/newsnow/node_modules/@prisma/client/default.js';\nconst { PrismaClient } = pkg;"
    );
    
    // 写回文件
    fs.writeFileSync(indexPath, content);
    console.log('成功修复 Nitro 开发服务器文件');
    
    // 重启 Nitro 服务器
    console.log('重启 Nitro 服务器...');
    exec('touch ./server/app.ts', (error) => {
      if (error) {
        console.error('重启失败:', error);
      } else {
        console.log('已触发重启');
      }
    });
  } catch (error) {
    console.error('修复失败:', error);
  }
};

// 执行修复
fixFile();
EOL

# 启动应用并在后台运行修复脚本
echo "启动应用并在后台运行修复脚本..."
DATABASE_URL="$DATABASE_URL" NODE_ENV=production HOST=0.0.0.0 PORT=4444 npm run dev & 
sleep 5
node fix-nitro-imports.js
