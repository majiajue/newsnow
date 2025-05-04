/**
 * 华尔街见闻爬虫
 * 用于获取华尔街见闻的新闻数据
 */

import { myFetch } from '../fetch';
import { logger } from '../logger';

// 华尔街见闻新闻类型
export interface WallStreetNewsItem {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  url: string;
  pubDate: string;
  source: string;
  category?: string;
  tags?: string[];
  author?: string;
  imageUrl?: string;
}

// API返回的数据类型
interface WallStreetApiItem {
  uri: string;
  id: number;
  title?: string;
  content_text: string;
  content_short: string;
  display_time: number;
  type?: string;
}

interface LiveResponse {
  data: {
    items: WallStreetApiItem[];
  };
}

interface NewsResponse {
  data: {
    items: {
      resource_type?: string;
      resource: WallStreetApiItem;
    }[];
  };
}

interface HotResponse {
  data: {
    day_items: WallStreetApiItem[];
  };
}

/**
 * 获取华尔街见闻快讯列表
 * @param pageSize 每页数量
 * @returns 华尔街见闻快讯列表
 */
export async function fetchWallStreetNews(pageSize = 20): Promise<WallStreetNewsItem[]> {
  try {
    // 使用快讯API
    const apiUrl = `https://api-one.wallstcn.com/apiv1/content/lives?channel=global-channel&limit=${pageSize}`;
    
    logger.info(`开始获取华尔街见闻快讯列表: ${apiUrl}`);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://wallstreetcn.com/',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Origin': 'https://wallstreetcn.com'
    };

    const response: LiveResponse = await myFetch(apiUrl, { headers });
    
    if (!response || !response.data || !Array.isArray(response.data.items)) {
      logger.error(`获取华尔街见闻快讯列表失败: ${JSON.stringify(response)}`);
      return [];
    }
    
    logger.info(`成功获取到 ${response.data.items.length} 条华尔街见闻快讯`);
    
    return response.data.items.map(item => {
      // 解析时间
      let pubDate = new Date();
      try {
        const timestamp = item.display_time;
        if (timestamp) {
          const date = new Date(timestamp * 1000);
          if (!Number.isNaN(date.getTime())) {
            pubDate = date;
          }
        }
      } catch (e) {
        logger.warn(`解析华尔街见闻时间失败: ${item.display_time}`, { error: e });
      }
      
      return {
        id: item.id.toString(),
        title: item.title || item.content_text,
        summary: item.content_short,
        url: item.uri,
        pubDate: pubDate.toISOString(),
        source: 'WallStreet',
        category: '财经快讯',
        author: '华尔街见闻'
      };
    });
  } catch (error) {
    logger.error(`获取华尔街见闻快讯列表出错: ${error}`);
    return [];
  }
}

/**
 * 获取华尔街见闻文章列表
 * @param pageSize 每页文章数量
 * @returns 文章列表
 */
export async function fetchWallStreetArticles(pageSize = 20): Promise<WallStreetNewsItem[]> {
  try {
    // 使用文章API
    const apiUrl = `https://api-one.wallstcn.com/apiv1/content/information-flow?channel=global-channel&accept=article&limit=${pageSize}`;
    
    logger.info(`开始获取华尔街见闻文章列表，数量: ${pageSize}`);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://wallstreetcn.com/',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Origin': 'https://wallstreetcn.com'
    };

    const response: NewsResponse = await myFetch(apiUrl, { headers });
    
    if (!response || !response.data || !Array.isArray(response.data.items)) {
      logger.error(`获取华尔街见闻文章列表失败: ${JSON.stringify(response)}`);
      return [];
    }
    
    // 过滤广告和快讯
    const articles = response.data.items
      .filter(item => item.resource_type !== "ad" && item.resource.type !== "live" && item.resource.uri);
    
    logger.info(`成功获取到 ${articles.length} 篇华尔街见闻文章`);
    
    return articles.map(({ resource: item }) => {
      // 解析时间
      let pubDate = new Date();
      try {
        const timestamp = item.display_time;
        if (timestamp) {
          const date = new Date(timestamp * 1000);
          if (!Number.isNaN(date.getTime())) {
            pubDate = date;
          }
        }
      } catch (e) {
        logger.warn(`解析华尔街见闻时间失败: ${item.display_time}`, { error: e });
      }
      
      return {
        id: item.id.toString(),
        title: item.title || item.content_short,
        summary: item.content_short,
        url: item.uri,
        pubDate: pubDate.toISOString(),
        source: 'WallStreet',
        category: '财经',
        author: '华尔街见闻'
      };
    });
  } catch (error) {
    logger.error(`获取华尔街见闻文章列表出错: ${error}`);
    return [];
  }
}

/**
 * 获取华尔街见闻热门文章列表
 * @param page 页码
 * @param pageSize 每页数量
 * @returns 华尔街见闻热门文章列表
 */
export async function fetchWallStreetHotArticles(page = 1, pageSize = 20): Promise<WallStreetNewsItem[]> {
  try {
    // 使用热门文章API
    const apiUrl = `https://api-one.wallstcn.com/apiv1/content/articles/hot?period=all`;
    
    logger.info(`开始获取华尔街见闻热门文章列表: ${apiUrl}`);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://wallstreetcn.com/',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Origin': 'https://wallstreetcn.com'
    };

    const response: HotResponse = await myFetch(apiUrl, { headers });
    
    if (!response || !response.data || !Array.isArray(response.data.day_items)) {
      logger.error(`获取华尔街见闻热门文章列表失败: ${JSON.stringify(response)}`);
      return [];
    }
    
    logger.info(`成功获取到 ${response.data.day_items.length} 篇华尔街见闻热门文章`);
    
    // 分页处理
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = response.data.day_items.slice(startIndex, endIndex);
    
    return paginatedItems.map(item => {
      return {
        id: item.id.toString(),
        title: item.title!,
        url: item.uri,
        pubDate: new Date().toISOString(), // 热门文章API没有返回时间，使用当前时间
        source: 'WallStreet',
        category: '热门',
        author: '华尔街见闻'
      };
    });
  } catch (error) {
    logger.error(`获取华尔街见闻热门文章列表出错: ${error}`);
    return [];
  }
}

/**
 * 获取华尔街见闻文章详情
 * @param id 文章ID
 * @returns 华尔街见闻文章详情
 */
export async function fetchWallStreetArticleDetail(id: string): Promise<WallStreetNewsItem | null> {
  try {
    const apiUrl = `https://api-one.wallstcn.com/apiv1/content/articles/${id}`;
    
    logger.info(`开始获取华尔街见闻文章详情: ${apiUrl}`);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': `https://wallstreetcn.com/articles/${id}`,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Origin': 'https://wallstreetcn.com'
    };

    const response = await myFetch(apiUrl, { headers });
    
    if (!response || !response.data) {
      logger.error(`获取华尔街见闻文章详情失败: ${JSON.stringify(response)}`);
      return null;
    }
    
    const article = response.data;
    
    // 解析时间
    let pubDate = new Date();
    try {
      const timestamp = article.display_time || article.created_at;
      if (timestamp) {
        const date = new Date(timestamp * 1000);
        if (!Number.isNaN(date.getTime())) {
          pubDate = date;
        }
      }
    } catch (e) {
      logger.warn(`解析华尔街见闻文章时间失败`, { error: e });
    }
    
    logger.info(`成功获取到华尔街见闻文章详情: ${article.title}`);
    
    return {
      id,
      title: article.title,
      content: article.content,
      summary: article.content_short || article.summary,
      url: `https://wallstreetcn.com/articles/${id}`,
      pubDate: pubDate.toISOString(),
      source: 'WallStreet',
      category: article.channel_name || article.asset_name || '财经',
      tags: article.tags?.map((tag: any) => tag.name) || [],
      author: article.author_name || article.source_name || 'WallStreet',
      imageUrl: article.image_uri || article.resource?.image_uri || ''
    };
  } catch (error) {
    logger.error(`获取华尔街见闻文章详情出错: ${error}`);
    return null;
  }
}
