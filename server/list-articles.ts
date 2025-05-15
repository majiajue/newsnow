/**
 * 列出数据库中的文章
 * 使用方法: npx tsx server/list-articles.ts
 */

import prisma from './utils/prismaClient.js';

async function main() {
  try {
    console.log('开始获取数据库中的文章列表...');
    
    // 获取所有文章的数量
    const count = await prisma.content.count();
    console.log(`数据库中共有 ${count} 篇文章`);
    
    // 使用简化的查询，避免日期字段解析问题
    const articles = await prisma.content.findMany({
      attributes: ['id', 'title', 'source'],
      limit: 20,
      order: [['id', 'DESC']]
    });
    
    console.log(`成功获取 ${articles.length} 篇文章信息`);
    
    // 打印文章ID和标题
    articles.forEach((article, index) => {
      console.log(`[${index+1}] ID: "${article.id}", 标题: "${article.title || '未知标题'}", 来源: "${article.source || '未知来源'}"`);
    });
    
    // 列出确切的ID 168的文章
    console.log('\n尝试直接查找ID 168...');
    const article168 = await prisma.content.findFirst({
      where: { id: 168 }
    });
    
    if (article168) {
      console.log(`找到ID为168的文章: "${article168.title}"`);
    } else {
      console.log('未找到ID为168的文章');
      
      // 尝试查找ID为字符串'168'的文章
      const articleStr168 = await prisma.content.findFirst({
        where: { id: '168' }
      });
      
      if (articleStr168) {
        console.log(`找到ID为'168'(字符串)的文章: "${articleStr168.title}"`);
      } else {
        console.log('未找到ID为\'168\'的文章');
      }
    }
    
  } catch (error) {
    console.error('获取文章列表失败:', error);
  } finally {
    try {
      // 正确使用disconnect方法
      await prisma.disconnect();
      console.log('数据库连接已断开');
    } catch (e) {
      console.error('断开连接失败:', e);
    }
  }
}

main();
