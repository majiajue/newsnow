// 为 prismaClient.js 提供类型声明
export declare class PrismaClient {
  constructor();
  $connect(): Promise<this>;
  $disconnect(): Promise<this>;
  
  // 添加 Prisma 客户端的其他方法
  content: {
    findUnique(args: { where: { id: string } }): Promise<any>;
  };
}

export declare const prisma: PrismaClient;
export default prisma;
