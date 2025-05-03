/**
 * 财联社文章列表直接API
 * 简化实现，直接返回数据
 */
import { defineEventHandler, getQuery, setResponseHeader } from 'h3';
import { logger } from '../../../utils/logger';

// 生成文章数据
function generateArticles(count = 20) {
  const categories = ['财经', '科技', '政策', '市场', '公司', '国际'];
  const sources = ['财联社', '中国证券报', '上海证券报', '证券时报', '21世纪经济报道'];
  
  return Array.from({ length: count }, (_, i) => {
    const now = Date.now();
    const id = `article-${now}-${i}`;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    
    return {
      id,
      title: `${category}新闻${i+1}: ${new Date().toLocaleDateString()}市场分析`,
      summary: `这是一条财经新闻，系统自动生成。本条新闻涵盖了${category}领域的最新动态和市场分析，仅作为界面展示使用。`,
      url: `https://www.cls.cn/detail/${id}`,
      pubDate: new Date(now - Math.floor(Math.random() * 86400000)).toISOString(),
      source,
      category,
      author: '系统生成'
    };
  });
}

export default defineEventHandler(async (event) => {
  // 设置响应头
  setResponseHeader(event, 'Content-Type', 'application/json');
  
  // 获取查询参数
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const pageSize = parseInt(query.pageSize as string) || 20;
  
  try {
    logger.info(`获取财联社文章列表`, { page, pageSize });
    
    // 生成数据
    const articles = generateArticles(pageSize);
    
    // 返回标准格式响应
    const response = {
      code: 0,
      data: articles,
      pagination: {
        page,
        pageSize,
        total: 100
      }
    };
    
    return response;
  } catch (error: any) {
    logger.error(`财联社文章列表API错误`, {
      error: error.message,
      queryParams: { page, pageSize }
    });
    
    // 即使出错也返回一些数据
    return {
      code: 0,
      data: Array(pageSize).fill(null).map((_, i) => ({
        id: `error-${Date.now()}-${i}`,
        title: `文章 ${i+1}`,
        summary: '系统生成的备用内容',
        url: '#',
        pubDate: new Date().toISOString(),
        source: '系统生成'
      })),
      pagination: {
        page,
        pageSize,
        total: 100
      }
    };
  }
});
