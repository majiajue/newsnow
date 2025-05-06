#!/bin/bash

# 删除旧的Prisma客户端
echo "删除旧的Prisma客户端..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
rm -rf prisma-client

# 重新安装Prisma客户端
echo "重新安装Prisma客户端..."
npm install @prisma/client

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

# 修改schema.prisma文件，恢复默认输出路径
cat > ./prisma/schema.prisma << EOL
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// 内容模型
model Content {
  id          String    @id @default(uuid())
  title       String
  content     String
  source      String?
  sourceUrl   String?
  author      String?
  publishDate DateTime?
  categories  String?   // JSON字符串，存储分类列表
  tags        String?   // JSON字符串，存储标签列表
  keywords    String?   // JSON字符串，存储关键词列表
  summary     String?
  quality     Float     @default(0)
  status      String    @default("draft") // draft, published, archived
  version     Int       @default(1)
  parentId    String?   // 父版本ID
  metadata    String?   // JSON字符串，存储元数据
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // 关联父版本
  parent      Content?  @relation("ContentVersions", fields: [parentId], references: [id])
  versions    Content[] @relation("ContentVersions")
}

// 用户模型
model User {
  id        String   @id @default(uuid())
  username  String   @unique
  email     String   @unique
  password  String
  role      String   @default("user") // admin, editor, user
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// 阅读记录模型
model ReadingRecord {
  id        String   @id @default(uuid())
  contentId String
  userId    String?
  clientIp  String?
  readAt    DateTime @default(now())
  duration  Int?     // 阅读时长（秒）
  metadata  String?  // JSON字符串，存储元数据
}

// 内容统计模型
model ContentStats {
  id           String   @id @default(uuid())
  contentId    String   @unique
  views        Int      @default(0)
  uniqueViews  Int      @default(0)
  avgReadTime  Float    @default(0)
  lastUpdated  DateTime @default(now())
}
EOL

# 重新生成Prisma客户端
echo "重新生成Prisma客户端..."
npx prisma generate

# 创建Prisma客户端包装器
cat > ./server/utils/prismaClient.js << EOL
// 这是一个 ESM 兼容的 Prisma 客户端包装器
import { PrismaClient } from '@prisma/client';

// 创建一个单例实例
export const prisma = new PrismaClient();

// 导出 PrismaClient 类
export { PrismaClient };

// 默认导出单例实例
export default prisma;
EOL

echo "创建了Prisma客户端包装器: ./server/utils/prismaClient.js"

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
    
    // 替换 Prisma 导入 - 使用动态导入
    content = content.replace(
      /import\s*{\s*PrismaClient\s*}\s*from\s*['"].*?['"]/g,
      \`const { PrismaClient } = await (async () => {
  const { PrismaClient } = await import('@prisma/client');
  return { PrismaClient };
})();\`
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
