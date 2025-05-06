import { PrismaClient } from '@prisma/client';

// 创建一个新的Prisma客户端实例
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || `file:${process.cwd()}/database/newsnow.db`
    }
  }
});

export default prisma;
