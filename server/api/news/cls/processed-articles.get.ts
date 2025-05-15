/**
 * 获取已处理文章API
 * 返回已经通过定时任务处理过的文章，包含摘要和评论
 */
import { defineEventHandler, getQuery, setResponseHeader } from 'h3';
// 使用console替代logger
import prisma from '../../../utils/prismaClient.js';

// 创建Prisma客户端
// 使用预初始化的 prisma 实例;

export default defineEventHandler(async (event) => {
  // 设置响应头
  setResponseHeader(event, 'Content-Type', 'application/json');
  
  // 获取查询参数
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const pageSize = parseInt(query.pageSize as string) || 20;
  
  try {
    logger.info(`获取已处理文章列表`, { page, pageSize });
    
    // 查询总数
    const total = await prisma.content.count({
      where: {
        source: "财联社",
        status: "published",
      },
    });
    
    // 分页查询
    const skip = (page - 1) * pageSize;
    
    // 查询文章
    const articles = await prisma.content.findMany({
      where: {
        source: "财联社",
        status: "published",
      },
      orderBy: {
        publishDate: 'desc',
      },
      skip,
      take: pageSize,
    });
    
    // 格式化文章数据
    const formattedArticles = articles.map(article => {
      // 解析元数据
      let metadata = {};
      try {
        metadata = JSON.parse(article.metadata || '{}');
      } catch (e) {
        logger.warn(`解析文章元数据失败: ${article.id}`, { error: e.message });
      }
      
      return {
        id: article.id,
        title: article.title,
        summary: article.summary || '',
        content: article.content,
        url: article.sourceUrl || '',
        pubDate: article.publishDate?.toISOString() || new Date().toISOString(),
        source: article.source || '财联社',
        category: article.categories || '财经',
        author: article.author || '财联社',
        imageUrl: metadata.imageUrl || '',
        aiComment: metadata.aiComment || '',
      };
    });
    
    // 返回数据
    return {
      code: 0,
      data: formattedArticles,
      pagination: {
        page,
        pageSize,
        total,
      }
    };
  } catch (error) {
    logger.error(`获取已处理文章列表失败`, { error: error.message });
    
    // 即使出错也返回一些数据
    return {
      code: 500,
      message: `获取已处理文章列表失败: ${error.message}`,
      data: [],
      pagination: {
        page,
        pageSize,
        total: 0
      }
    };
  }
});
