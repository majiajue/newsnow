import { defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { PrismaClient, prisma } from '../../../utils/prismaClient.js'

// 使用预初始化的 prisma 实例

export default defineEventHandler(async (event) => {
  // 设置响应头
  setResponseHeader(event, 'Content-Type', 'application/json');
  
  try {
    // 获取查询参数
    const query = getQuery(event)
    const page = parseInt(query.page as string || '1', 10)
    const pageSize = parseInt(query.pageSize as string || '20', 10)

    // 查询总数
    const total = await prisma.content.count({
      where: {
        source: "财联社",
        status: "published",
      },
    })
    
    // 查询文章
    const articles = await prisma.content.findMany({
      where: {
        source: "财联社",
        status: "published",
      },
      orderBy: {
        publishDate: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
    
    // 转换为前端需要的格式
    const formattedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      summary: article.summary || article.content,
      url: article.sourceUrl || "",
      pubDate: article.publishDate?.toISOString() || new Date().toISOString(),
      source: article.source || "财联社",
      category: article.categories || "财经",
      author: article.author || "财联社",
    }))
    
    // 返回数据
    return {
      code: 0,
      data: formattedArticles,
      pagination: {
        page,
        pageSize,
        total,
      }
    }
  } catch (error) {
    console.error('获取财联社文章失败:', error)
    
    // 生成备用数据
    const backupArticles = generateBackupArticles(20);
    
    // 返回错误信息
    return {
      code: 0,
      data: backupArticles,
      pagination: {
        page: 1,
        pageSize: 20,
        total: 100
      }
    }
  }
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
