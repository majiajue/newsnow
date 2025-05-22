/**
 * NewNow财经前端配置文件
 */

// API基础URL（在实际部署时需要修改）
const API_BASE_URL = 'http://localhost:5001';

// API端点
const API_ENDPOINTS = {
  HEALTH: '/api/health',                            // 健康检查
  ARTICLES: '/api/articles',                        // 文章列表
  ARTICLE: '/api/articles/',                        // 单篇文章（需要追加ID）
  RELATED: '/api/articles/{id}/related',            // 相关文章（需要替换{id}）
  ANALYZE: '/api/articles/{id}/analyze',            // 分析文章（需要替换{id}）
  FLASH: '/api/flash',                              // 快讯列表
  SEARCH: '/api/search',                            // 搜索
  STATS: '/api/stats'                               // 统计信息
};

// 新闻来源配置
const NEWS_SOURCES = {
  jin10: {
    name: '金十财经',
    color: '#f39c12',
    logo: 'img/jin10-logo.png'
  },
  wallstreet: {
    name: '华尔街见闻',
    color: '#3498db',
    logo: 'img/wallstreet-logo.png'
  },
  gelonghui: {
    name: '格隆汇',
    color: '#27ae60',
    logo: 'img/gelonghui-logo.png'
  },
  fastbull: {
    name: 'FastBull',
    color: '#e74c3c',
    logo: 'img/fastbull-logo.png'
  }
};

// 默认配置
const DEFAULT_CONFIG = {
  articlesPerPage: 10,     // 每页文章数量
  flashNewsCount: 5,       // 侧边栏显示的快讯数量
  searchResultsCount: 20,  // 搜索结果数量
  relatedArticlesCount: 5, // 相关文章数量
  defaultSource: null,     // 默认不筛选来源
  cacheTimeout: 300000     // 缓存有效期（毫秒）5分钟
};

// 缓存KEY前缀
const CACHE_KEYS = {
  ARTICLES: 'newsnow_articles_',
  FLASH: 'newsnow_flash_',
  ARTICLE: 'newsnow_article_',
  SEARCH: 'newsnow_search_',
  STATS: 'newsnow_stats',
  ANALYSIS: 'newsnow_analysis_'
};
