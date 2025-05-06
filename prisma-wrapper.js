// 创建一个 ESM 兼容的 Prisma 客户端包装器
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 使用 CommonJS require 导入 Prisma 客户端
const prismaClient = require('@prisma/client');
const { PrismaClient: OriginalPrismaClient } = prismaClient;

// 导出兼容的 PrismaClient
export const PrismaClient = OriginalPrismaClient;
export default { PrismaClient };
