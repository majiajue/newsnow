// ESM 兼容的 Prisma 客户端包装器
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 导入生成的 Prisma 客户端
const { PrismaClient } = require('./prisma-client');

// 创建 Prisma 客户端实例
const prisma = new PrismaClient();

// 导出 PrismaClient 类和实例
export { PrismaClient };
export { prisma };
export default prisma;
