/**
 * 查找数据库中存在的文章，并显示ID
 * 使用方法: npx tsx server/find-articles.ts
 */

import prisma from './utils/prismaClient.js';

async function main() {
  try {
    console.log('开始查找数据库中的文章...');
    
    // 查询最近的20篇文章
    const articles = await prisma.content.findMany({});
    
    console.log(`找到 ${articles.length} 篇文章`);
    
    if (articles.length > 0) {
      // 打印文章ID、标题和来源
      articles.slice(0, 10).forEach((article, index) => {
        console.log(`[${index+1}] ID: ${article.id}, 标题: "${article.title}", 来源: "${article.source}"`);
      });
      
      // 选择第一篇文章的ID用于测试
      const testArticleId = articles[0].id;
      console.log(`\n选择第一篇文章ID: ${testArticleId} 用于测试生成AI分析`);
      console.log(`运行以下命令为此文章生成AI分析:\nnpx tsx server/test-generate-analysis.ts ${testArticleId}`);
    } else {
      console.log('数据库中没有找到任何文章');
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    // 不尝试断开连接，因为之前的尝试显示这可能会失败
    console.log('查询完成');
  }
}

main();
