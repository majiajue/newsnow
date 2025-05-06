// 这个文件用于修补 Prisma 客户端的 ESM 导入问题
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 使用 CommonJS require 导入 Prisma 客户端
const prismaClient = require('@prisma/client');

// 导出 PrismaClient
export const PrismaClient = prismaClient.PrismaClient;

// 创建一个预初始化的实例
export const prisma = new PrismaClient();

// 默认导出
export default { PrismaClient, prisma };
