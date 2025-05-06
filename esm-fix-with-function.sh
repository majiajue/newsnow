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

# 创建ES模块兼容性脚本
echo "创建ES模块兼容性脚本..."
cat > esm-compat.js << EOL
import { createRequire } from 'module';
global.require = createRequire(import.meta.url);
EOL

# 修复所有导入
echo "修复所有导入路径..."
cat > ./fix-imports.js << EOL
// 修复所有导入路径
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// 查找所有 TypeScript 和 JavaScript 文件
async function findFiles() {
  try {
    const files = await glob('server/**/*.{ts,js}', {
      ignore: ['**/node_modules/**', '**/dist/**', '**/server/utils/prismaClient.js']
    });
    return files;
  } catch (error) {
    console.error('查找文件时出错:', error);
    return [];
  }
}

// 修复文件中的 Prisma 导入
async function fixPrismaImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 替换导入语句
    let newContent = content.replace(
      /import\s*{\s*PrismaClient\s*}\s*from\s*['"].*?['"]/g,
      "import { prisma } from '../utils/prismaClient.js'"
    );
    
    // 替换 PrismaClient 实例化
    newContent = newContent.replace(
      /const\s+prisma\s*=\s*new\s+PrismaClient\(\s*\)/g,
      '// 使用预初始化的 prisma 实例'
    );
    
    // 如果内容有变化，写回文件
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log(\`已修复: \${filePath}\`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(\`处理文件 \${filePath} 时出错:\`, error);
    return false;
  }
}

// 主函数
async function main() {
  try {
    const files = await findFiles();
    console.log(\`找到 \${files.length} 个文件需要处理\`);
    
    let fixedCount = 0;
    for (const file of files) {
      const fixed = await fixPrismaImports(file);
      if (fixed) fixedCount++;
    }
    
    console.log(\`成功修复 \${fixedCount} 个文件\`);
  } catch (error) {
    console.error('执行过程中出错:', error);
  }
}

// 执行主函数
main();
EOL

# 运行修复脚本
echo "运行修复脚本..."
node fix-imports.js

# 使用开发模式运行应用
echo "使用开发模式运行应用..."
DATABASE_URL="$DATABASE_URL" NODE_ENV=production HOST=0.0.0.0 PORT=4444 NODE_OPTIONS="--import ./esm-compat.js" npm run dev
