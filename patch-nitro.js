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
