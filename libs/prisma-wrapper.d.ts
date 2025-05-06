// 为 prisma-wrapper.js 提供类型声明
import { PrismaClient as OriginalPrismaClient } from './prisma-client';

// 导出 PrismaClient 类型
export declare const PrismaClient: typeof OriginalPrismaClient;

// 导出 prisma 实例
export declare const prisma: OriginalPrismaClient;

// 默认导出 prisma 实例
export default prisma;
