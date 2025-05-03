/**
 * 数据缓存管理器
 * 用于定时获取和缓存外部API数据
 */
import { logger } from './logger';
import { myFetch } from './fetch';
import fs from 'fs';
import path from 'path';

// 缓存目录
const CACHE_DIR = path.resolve(process.cwd(), 'data/cache');

// 确保缓存目录存在
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// 缓存文件路径
const ARTICLES_CACHE_FILE = path.join(CACHE_DIR, 'cls_articles.json');

// 文章数据结构
interface ArticleData {
  id: string;
  title: string;
  summary: string;
  url: string;
  pubDate: string;
  source: string;
  category?: string;
}

// 缓存数据结构
interface CacheData {
  timestamp: number;
  articles: ArticleData[];
  total: number;
}

// 内存缓存
let articlesCache: CacheData | null = null;

/**
 * 从财联社API获取文章数据
 */
async function fetchFromApi(): Promise<ArticleData[]> {
  // API端点列表
  const apiUrls = [
    'https://www.cls.cn/v1/article/list',
    'https://www.cls.cn/v1/telegraph/list',
    'https://www.cls.cn/v1/depth/list'
  ];
  
  // 请求头
  const headers = {
    'Referer': 'https://www.cls.cn/',
    'Origin': 'https://www.cls.cn',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
  };
  
  // 请求参数
  const params = {
    app: 'CailianpressWeb',
    os: 'web',
    sv: '7.7.5',
    page: '1',
    rn: '50'
  };
  
  // 尝试所有API端点
  for (const url of apiUrls) {
    try {
      logger.info(`尝试从API获取数据: ${url}`);
      const response = await myFetch(url, { params, headers });
      
      // 尝试提取数据
      let articles: ArticleData[] = [];
      
      if (response && typeof response === 'object') {
        // 处理不同的响应格式
        let items: any[] = [];
        
        if (Array.isArray(response.data)) {
          items = response.data;
        } else if (response.data?.roll_data?.list && Array.isArray(response.data.roll_data.list)) {
          items = response.data.roll_data.list;
        } else if (response.data?.roll_data && Array.isArray(response.data.roll_data)) {
          items = response.data.roll_data;
        } else if (response.data?.depth_list && Array.isArray(response.data.depth_list)) {
          items = response.data.depth_list;
        } else if (Array.isArray(response)) {
          items = response;
        }
        
        // 转换数据格式
        if (items.length > 0) {
          articles = items
            .filter(item => !item.is_ad)
            .map(item => ({
              id: item.id || '',
              title: item.title || item.brief || '',
              summary: item.digest || item.brief || '',
              url: item.link || item.shareurl || `https://www.cls.cn/detail/${item.id}`,
              pubDate: item.ctime ? new Date(parseInt(item.ctime) * 1000).toISOString() : new Date().toISOString(),
              source: item.source || '财联社',
              category: item.column_name || '财经'
            }));
          
          logger.info(`成功从API获取数据: ${url}`, { count: articles.length });
          return articles;
        }
      }
    } catch (error) {
      logger.warn(`从API获取数据失败: ${url}`, { error: error.message });
    }
  }
  
  // 所有API都失败
  logger.error('所有API端点都失败');
  return [];
}

/**
 * 读取缓存文件
 */
function readCacheFile(): CacheData | null {
  try {
    if (fs.existsSync(ARTICLES_CACHE_FILE)) {
      const data = fs.readFileSync(ARTICLES_CACHE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    logger.error('读取缓存文件失败', { error: error.message });
  }
  return null;
}

/**
 * 写入缓存文件
 */
function writeCacheFile(data: CacheData): void {
  try {
    fs.writeFileSync(ARTICLES_CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    logger.info('缓存文件已更新', { timestamp: data.timestamp, count: data.articles.length });
  } catch (error) {
    logger.error('写入缓存文件失败', { error: error.message });
  }
}

/**
 * 刷新缓存数据
 */
export async function refreshCache(): Promise<void> {
  try {
    // 从API获取最新数据
    const articles = await fetchFromApi();
    
    if (articles.length > 0) {
      // 更新内存缓存
      articlesCache = {
        timestamp: Date.now(),
        articles,
        total: articles.length * 5 // 估计总数
      };
      
      // 更新文件缓存
      writeCacheFile(articlesCache);
      logger.info('缓存已刷新', { count: articles.length });
    } else {
      logger.warn('API未返回数据，保持使用旧缓存');
    }
  } catch (error) {
    logger.error('刷新缓存失败', { error: error.message });
  }
}

/**
 * 获取文章数据
 */
export async function getArticles(page: number = 1, pageSize: number = 20): Promise<{
  articles: ArticleData[];
  pagination: { page: number; pageSize: number; total: number };
}> {
  // 如果内存缓存不存在，尝试读取文件缓存
  if (!articlesCache) {
    articlesCache = readCacheFile();
    
    // 如果文件缓存不存在，尝试从API获取
    if (!articlesCache) {
      await refreshCache();
    }
  }
  
  // 如果仍然没有缓存，返回空数组
  if (!articlesCache) {
    logger.error('无法获取文章数据');
    return {
      articles: [],
      pagination: { page, pageSize, total: 0 }
    };
  }
  
  // 计算分页
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageArticles = articlesCache.articles.slice(start, end);
  
  return {
    articles: pageArticles,
    pagination: {
      page,
      pageSize,
      total: articlesCache.total || articlesCache.articles.length * 5
    }
  };
}

// 定时刷新间隔（毫秒）
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5分钟

// 定时刷新任务
let refreshTimer: NodeJS.Timeout | null = null;

/**
 * 启动定时刷新
 */
export function startScheduledRefresh(): void {
  // 立即刷新一次
  refreshCache().catch(error => {
    logger.error('初始刷新失败', { error: error.message });
  });
  
  // 设置定时刷新
  refreshTimer = setInterval(async () => {
    try {
      await refreshCache();
    } catch (error) {
      logger.error('定时刷新失败', { error: error.message });
    }
  }, REFRESH_INTERVAL);
  
  logger.info('定时刷新已启动', { interval: `${REFRESH_INTERVAL / 1000}秒` });
}

/**
 * 停止定时刷新
 */
export function stopScheduledRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
    logger.info('定时刷新已停止');
  }
}
