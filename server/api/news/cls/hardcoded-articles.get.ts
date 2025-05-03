/**
 * 硬编码文章数据API
 * 直接返回硬编码的文章数据，避免任何外部依赖
 */
import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  // 获取查询参数
  const query = getQuery(event)
  const page = parseInt(query.page as string || '1', 10)
  const pageSize = parseInt(query.pageSize as string || '20', 10)
  
  // 硬编码的文章数据
  const articles = [
    {
      id: "hardcoded-1",
      title: "财经新闻1: 市场分析报告",
      summary: "这是一条财经新闻，涵盖了最新的市场动态和分析。",
      url: "https://www.cls.cn/detail/hardcoded-1",
      pubDate: new Date().toISOString(),
      source: "财联社",
      category: "财经",
      author: "系统生成"
    },
    {
      id: "hardcoded-2",
      title: "科技新闻2: 人工智能最新进展",
      summary: "这是一条科技新闻，介绍了人工智能领域的最新突破和应用。",
      url: "https://www.cls.cn/detail/hardcoded-2",
      pubDate: new Date(Date.now() - 3600000).toISOString(),
      source: "中国证券报",
      category: "科技",
      author: "系统生成"
    },
    {
      id: "hardcoded-3",
      title: "政策新闻3: 最新经济政策解读",
      summary: "这是一条政策新闻，解读了最新发布的经济政策及其影响。",
      url: "https://www.cls.cn/detail/hardcoded-3",
      pubDate: new Date(Date.now() - 7200000).toISOString(),
      source: "上海证券报",
      category: "政策",
      author: "系统生成"
    },
    {
      id: "hardcoded-4",
      title: "市场新闻4: 股市行情分析",
      summary: "这是一条市场新闻，分析了今日股市行情和未来走势。",
      url: "https://www.cls.cn/detail/hardcoded-4",
      pubDate: new Date(Date.now() - 10800000).toISOString(),
      source: "证券时报",
      category: "市场",
      author: "系统生成"
    },
    {
      id: "hardcoded-5",
      title: "公司新闻5: 企业季度财报",
      summary: "这是一条公司新闻，报道了多家上市公司的季度财报情况。",
      url: "https://www.cls.cn/detail/hardcoded-5",
      pubDate: new Date(Date.now() - 14400000).toISOString(),
      source: "21世纪经济报道",
      category: "公司",
      author: "系统生成"
    },
    {
      id: "hardcoded-6",
      title: "国际新闻6: 全球经济形势",
      summary: "这是一条国际新闻，分析了当前全球经济形势和主要国家的经济政策。",
      url: "https://www.cls.cn/detail/hardcoded-6",
      pubDate: new Date(Date.now() - 18000000).toISOString(),
      source: "财联社",
      category: "国际",
      author: "系统生成"
    },
    {
      id: "hardcoded-7",
      title: "财经新闻7: 央行货币政策",
      summary: "这是一条财经新闻，解读了央行最新的货币政策及其对市场的影响。",
      url: "https://www.cls.cn/detail/hardcoded-7",
      pubDate: new Date(Date.now() - 21600000).toISOString(),
      source: "中国证券报",
      category: "财经",
      author: "系统生成"
    },
    {
      id: "hardcoded-8",
      title: "科技新闻8: 区块链技术应用",
      summary: "这是一条科技新闻，介绍了区块链技术在金融领域的最新应用案例。",
      url: "https://www.cls.cn/detail/hardcoded-8",
      pubDate: new Date(Date.now() - 25200000).toISOString(),
      source: "上海证券报",
      category: "科技",
      author: "系统生成"
    },
    {
      id: "hardcoded-9",
      title: "政策新闻9: 财税政策调整",
      summary: "这是一条政策新闻，解读了最新的财税政策调整及其对企业的影响。",
      url: "https://www.cls.cn/detail/hardcoded-9",
      pubDate: new Date(Date.now() - 28800000).toISOString(),
      source: "证券时报",
      category: "政策",
      author: "系统生成"
    },
    {
      id: "hardcoded-10",
      title: "市场新闻10: 债券市场分析",
      summary: "这是一条市场新闻，分析了当前债券市场的走势和投资机会。",
      url: "https://www.cls.cn/detail/hardcoded-10",
      pubDate: new Date(Date.now() - 32400000).toISOString(),
      source: "21世纪经济报道",
      category: "市场",
      author: "系统生成"
    },
    {
      id: "hardcoded-11",
      title: "公司新闻11: 企业战略调整",
      summary: "这是一条公司新闻，报道了多家大型企业的战略调整和业务转型。",
      url: "https://www.cls.cn/detail/hardcoded-11",
      pubDate: new Date(Date.now() - 36000000).toISOString(),
      source: "财联社",
      category: "公司",
      author: "系统生成"
    },
    {
      id: "hardcoded-12",
      title: "国际新闻12: 贸易形势分析",
      summary: "这是一条国际新闻，分析了全球贸易形势和主要经济体的贸易政策。",
      url: "https://www.cls.cn/detail/hardcoded-12",
      pubDate: new Date(Date.now() - 39600000).toISOString(),
      source: "中国证券报",
      category: "国际",
      author: "系统生成"
    },
    {
      id: "hardcoded-13",
      title: "财经新闻13: 宏观经济数据",
      summary: "这是一条财经新闻，解读了最新发布的宏观经济数据及其意义。",
      url: "https://www.cls.cn/detail/hardcoded-13",
      pubDate: new Date(Date.now() - 43200000).toISOString(),
      source: "上海证券报",
      category: "财经",
      author: "系统生成"
    },
    {
      id: "hardcoded-14",
      title: "科技新闻14: 数字经济发展",
      summary: "这是一条科技新闻，介绍了数字经济的最新发展趋势和创新案例。",
      url: "https://www.cls.cn/detail/hardcoded-14",
      pubDate: new Date(Date.now() - 46800000).toISOString(),
      source: "证券时报",
      category: "科技",
      author: "系统生成"
    },
    {
      id: "hardcoded-15",
      title: "政策新闻15: 产业政策解读",
      summary: "这是一条政策新闻，解读了最新的产业政策及其对相关行业的影响。",
      url: "https://www.cls.cn/detail/hardcoded-15",
      pubDate: new Date(Date.now() - 50400000).toISOString(),
      source: "21世纪经济报道",
      category: "政策",
      author: "系统生成"
    },
    {
      id: "hardcoded-16",
      title: "市场新闻16: 商品市场行情",
      summary: "这是一条市场新闻，分析了主要商品市场的价格走势和供需关系。",
      url: "https://www.cls.cn/detail/hardcoded-16",
      pubDate: new Date(Date.now() - 54000000).toISOString(),
      source: "财联社",
      category: "市场",
      author: "系统生成"
    },
    {
      id: "hardcoded-17",
      title: "公司新闻17: 企业并购动态",
      summary: "这是一条公司新闻，报道了近期重要的企业并购事件和市场反应。",
      url: "https://www.cls.cn/detail/hardcoded-17",
      pubDate: new Date(Date.now() - 57600000).toISOString(),
      source: "中国证券报",
      category: "公司",
      author: "系统生成"
    },
    {
      id: "hardcoded-18",
      title: "国际新闻18: 全球金融市场",
      summary: "这是一条国际新闻，分析了全球主要金融市场的最新动态和投资机会。",
      url: "https://www.cls.cn/detail/hardcoded-18",
      pubDate: new Date(Date.now() - 61200000).toISOString(),
      source: "上海证券报",
      category: "国际",
      author: "系统生成"
    },
    {
      id: "hardcoded-19",
      title: "财经新闻19: 金融监管动态",
      summary: "这是一条财经新闻，报道了最新的金融监管政策和监管动向。",
      url: "https://www.cls.cn/detail/hardcoded-19",
      pubDate: new Date(Date.now() - 64800000).toISOString(),
      source: "证券时报",
      category: "财经",
      author: "系统生成"
    },
    {
      id: "hardcoded-20",
      title: "科技新闻20: 科技创新趋势",
      summary: "这是一条科技新闻，介绍了当前科技创新的主要趋势和重点领域。",
      url: "https://www.cls.cn/detail/hardcoded-20",
      pubDate: new Date(Date.now() - 68400000).toISOString(),
      source: "21世纪经济报道",
      category: "科技",
      author: "系统生成"
    }
  ];
  
  // 计算分页
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageArticles = articles.slice(start, end);
  
  // 返回数据
  return {
    code: 0,
    data: pageArticles,
    pagination: {
      page,
      pageSize,
      total: articles.length
    }
  };
});
