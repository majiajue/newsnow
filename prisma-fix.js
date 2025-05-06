// 修复 Prisma 客户端导入问题
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const prismaClient = require('@prisma/client');

export const PrismaClient = prismaClient.PrismaClient;
export default prismaClient;
