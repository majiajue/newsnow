/**
 * 财联社模拟文章列表API
 */
import { defineEventHandler, getQuery } from 'h3';
import { logger } from '../../../utils/logger';

// 生成模拟数据
function generateMockArticles(count = 20) {
  const categories = ['财经', '科技', '政策', '市场', '公司', '国际'];
  const sources = ['财联社', '中国证券报', '上海证券报', '证券时报', '21世纪经济报道'];
  
  return Array.from({ length: count }, (_, i) => {
    const now = Date.now();
    const id = `mock-${now}-${i}`;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    
    return {
      id,
      title: `${category}模拟新闻${i+1}: ${new Date().toLocaleDateString()}市场动态分析`,
      summary: `这是一条模拟的财经新闻，由于无法连接到财联社API，系统自动生成。本条新闻模拟了${category}领域的最新动态和市场分析，仅作为界面展示使用。`,
      url: `https://www.cls.cn/detail/${id}`,
      pubDate: new Date(now - Math.floor(Math.random() * 86400000)).toISOString(),
      source,
      category,
      author: '系统自动生成',
    };
  });
}

export default defineEventHandler(async (event) => {
  // 获取查询参数
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const pageSize = parseInt(query.pageSize as string) || 20;
  
  try {
    logger.info(`获取模拟财联社文章列表`, { page, pageSize });
    
    // 生成模拟数据
    const mockArticles = generateMockArticles(pageSize);
    
    logger.info(`成功生成模拟文章数据`, { count: mockArticles.length });
    
    // 返回标准格式响应
    return {
      code: 0,
      data: mockArticles,
      pagination: {
        page,
        pageSize,
        total: 100
      }
    };
  } catch (error: any) {
    logger.error(`模拟文章列表API错误`, {
      error: error.message,
      queryParams: { page, pageSize }
    });
    
    // 返回备用数据
    return {
      code: 0,
      data: Array(pageSize).fill(null).map((_, i) => ({
        id: `fallback-${Date.now()}-${i}`,
        title: `备用文章 ${i+1}`,
        summary: '由于系统错误，显示备用内容',
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
