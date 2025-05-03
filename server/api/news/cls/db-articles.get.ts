import { defineEventHandler, getQuery } from 'h3'
import { getClsArticlesFromDb, initClsArticles } from '../../../utils/clsDbManager'
import { logger } from '../../../utils/logger'

// 初始化：服务启动时获取一次数据并设置定时任务
initClsArticles().catch((error: any) => {
  logger.error('初始化财联社文章数据失败:', error)
})

// 生成模拟数据函数（备用）
function generateBackupArticles(count = 20) {
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
  try {
    // 获取查询参数
    const query = getQuery(event)
    const page = parseInt(query.page as string || '1', 10)
    const pageSize = parseInt(query.pageSize as string || '20', 10)

    logger.info(`获取财联社文章列表 (从数据库)`, { page, pageSize });
    
    // 从数据库获取文章
    const result = await getClsArticlesFromDb(page, pageSize)
    
    // 检查是否获取到数据
    if (result.code === 0 && result.data && result.data.length > 0) {
      logger.info(`成功从数据库获取文章数据`, { 
        count: result.data.length,
        page,
        pageSize
      });
      
      // 返回标准格式响应
      return {
        code: 0,
        data: result.data,
        pagination: result.pagination
      };
    } else {
      // 如果没有获取到数据，使用备用数据
      logger.warn(`未从数据库获取到文章数据，使用备用数据`);
      const backupArticles = generateBackupArticles(pageSize);
      
      return {
        code: 0,
        data: backupArticles,
        pagination: {
          page,
          pageSize,
          total: 100
        }
      };
    }
  } catch (error) {
    logger.error('获取财联社文章失败:', error)
    
    // 使用备用数据
    const backupArticles = generateBackupArticles(20);
    
    // 返回错误信息
    return {
      code: 0,
      data: backupArticles,
      pagination: {
        page: 1,
        pageSize: 20,
        total: 100
      },
      message: `使用模拟数据（API错误: ${error}）`
    }
  }
})
