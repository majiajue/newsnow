// prismaClient.js - 强制使用 Sequelize 的兼容层
// 项目已从 Prisma ORM 切换到 Sequelize ORM 实现
// 此文件确保所有 prisma 调用都重定向到 sequelizeClient.js

// 强制输出调试信息
console.log('★★★ 强制使用 Sequelize ORM ★★★');
console.log('环境变量 DATABASE_URL:', process.env.DATABASE_URL);
console.log('环境变量 PRISMA_CLIENT_PATH:', process.env.PRISMA_CLIENT_PATH);

// 强制设置环境变量
process.env.FORCE_SEQUELIZE = 'true';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./database/newsnow.db';

// 导入原始的 Sequelize 客户端
import baseClient, { PrismaClient as BaseClient } from './sequelizeClient.js';

// 创建增强的兼容层客户端
class EnhancedPrismaClient extends BaseClient {
  constructor() {
    super();
    
    // 创建模型代理对象，支持 prisma.content.xxx 的调用方式
    this.content = {
      findUnique: this.contentFindUnique.bind(this),
      findFirst: this.contentFindFirst.bind(this),
      findMany: this.contentFindMany.bind(this),
      create: this.contentCreate.bind(this),
      update: this.contentUpdate.bind(this),
      upsert: this.contentUpsert.bind(this),
      delete: this.contentDelete.bind(this),
      deleteMany: async (args) => {
        console.log('模拟 content.deleteMany 调用', args);
        // 简单实现，仅用于兼容
        return { count: 0 };
      },
      count: this.contentCount.bind(this)
    };
    
    this.user = {
      findUnique: this.userFindUnique.bind(this),
      findFirst: this.userFindFirst.bind(this),
      findMany: this.userFindMany.bind(this),
      create: this.userCreate.bind(this),
      update: this.userUpdate.bind(this),
      upsert: this.userUpsert.bind(this),
      delete: this.userDelete.bind(this),
      count: this.userCount.bind(this)
    };
    
    this.readingRecord = {
      findUnique: this.readingRecordFindUnique.bind(this),
      findFirst: this.readingRecordFindFirst.bind(this),
      findMany: this.readingRecordFindMany.bind(this),
      create: this.readingRecordCreate.bind(this),
      update: this.readingRecordUpdate.bind(this),
      upsert: this.readingRecordUpsert.bind(this),
      delete: this.readingRecordDelete.bind(this),
      count: this.readingRecordCount.bind(this)
    };
    
    this.contentStats = {
      findUnique: this.contentStatsFindUnique.bind(this),
      findFirst: this.contentStatsFindFirst.bind(this),
      findMany: this.contentStatsFindMany.bind(this),
      create: this.contentStatsCreate.bind(this),
      update: this.contentStatsUpdate.bind(this),
      upsert: this.contentStatsUpsert.bind(this),
      delete: this.contentStatsDelete.bind(this),
      count: this.contentStatsCount.bind(this)
    };
  }
}

// 创建并导出增强的兼容层客户端实例
const prisma = new EnhancedPrismaClient();
console.log('已创建增强的 Sequelize 兼容层客户端');

// 导出
export { EnhancedPrismaClient as PrismaClient };
export default prisma;

