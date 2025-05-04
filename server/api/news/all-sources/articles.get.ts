/**
 * 获取所有来源文章API
 * 返回已经通过定时任务处理过的文章，包含摘要和评论
 * 支持按来源筛选
 */
import { defineEventHandler, getQuery, setResponseHeader } from 'h3';
import { logger } from '#/utils/logger';
import { PrismaClient } from '@prisma/client';

// 创建Prisma客户端
const prisma = new PrismaClient();

// 支持的来源列表
const SUPPORTED_SOURCES = ['财联社', 'FastBull', 'WallStreet', 'Jin10', 'Gelonghui'];

export default defineEventHandler(async (event) => {
  // 设置响应头
  setResponseHeader(event, 'Content-Type', 'application/json');
  
  // 获取查询参数
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const pageSize = parseInt(query.pageSize as string) || 20;
  const source = query.source as string || '';
  
  try {
    logger.info(`获取所有来源文章列表`, { page, pageSize, source });
    
    // 构建查询条件
    const where: any = {
      status: "published"
    };
    
    // 如果指定了来源，则按来源筛选
    if (source && SUPPORTED_SOURCES.includes(source)) {
      where.source = source;
    }
    
    // 查询总数
    const total = await prisma.content.count({ where });
    
    // 分页查询
    const skip = (page - 1) * pageSize;
    
    // 查询文章
    const articles = await prisma.content.findMany({
      where,
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
        source: article.source || '',
        category: article.categories || '',
        author: article.author || '',
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
    logger.error(`获取所有来源文章列表失败`, { error: error.message });
    
    // 即使出错也返回一些数据
    return {
      code: 500,
      message: `获取所有来源文章列表失败: ${error.message}`,
      data: [],
      pagination: {
        page,
        pageSize,
        total: 0
      }
    };
  }
});
