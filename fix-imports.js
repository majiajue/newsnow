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
      console.log(`已修复: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`处理文件 ${filePath} 时出错:`, error);
    return false;
  }
}

// 主函数
async function main() {
  try {
    const files = await findFiles();
    console.log(`找到 ${files.length} 个文件需要处理`);
    
    let fixedCount = 0;
    for (const file of files) {
      const fixed = await fixPrismaImports(file);
      if (fixed) fixedCount++;
    }
    
    console.log(`成功修复 ${fixedCount} 个文件`);
  } catch (error) {
    console.error('执行过程中出错:', error);
  }
}

// 执行主函数
main();
