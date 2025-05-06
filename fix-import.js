// ESM 兼容的 Prisma 客户端包装器
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 使用 CommonJS require 导入 Prisma 客户端
const prismaClient = require('@prisma/client');

// 导出 PrismaClient
export const PrismaClient = prismaClient.PrismaClient;
export default prismaClient;
