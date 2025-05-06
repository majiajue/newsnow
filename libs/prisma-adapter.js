// 从生成的 Prisma 客户端导入 PrismaClient
import { PrismaClient as OriginalPrismaClient } from './prisma-client';

// 创建一个 PrismaClient 实例
const originalPrisma = new OriginalPrismaClient();

// 导出原始的 PrismaClient 类
export { OriginalPrismaClient as PrismaClient };

// 导出单例实例
export const prisma = originalPrisma;
export default prisma;
