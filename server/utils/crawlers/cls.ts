/**
 * 财联社新闻爬虫
 * 用于获取财联社的新闻数据
 */

import { load } from 'cheerio';
import { logger } from '../logger';
import { myFetch } from '../fetch';
import { md5, myCrypto } from '../crypto';

// 财联社新闻类型
export interface CLSNewsItem {
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

// 财联社新闻列表接口响应
interface CLSNewsListResponse {
  code: number;
  data: {
    roll_data: {
      list: {
        id: string;
        title: string;
        ctime: string;
        digest: string;
        source?: string;
        link?: string;
        shareurl?: string;
      }[];
    };
  };
}

// 财联社新闻详情接口响应
interface CLSNewsDetailResponse {
  code: number;
  data: {
    content: string;
    title: string;
    ctime: string;
    source: string;
    author?: string;
    tags?: string[];
    category?: string;
  };
}

// 基础参数
const baseParams = {
  app: "CailianpressWeb",
  os: "web",
  sv: "7.7.5",
};

/**
 * 获取请求参数，包括签名
 * @param moreParams 额外参数
 * @returns 包含签名的参数对象
 */
async function getSearchParams(moreParams?: Record<string, string>) {
  const searchParams = new URLSearchParams({ ...baseParams, ...moreParams });
  searchParams.sort();
  const signature = await md5(await myCrypto(searchParams.toString(), "SHA-1"));
  searchParams.append("sign", signature);
  return Object.fromEntries(searchParams);
}

/**
 * 获取财联社快讯列表
 * @param page 页码
 * @param pageSize 每页数量
 * @returns 财联社快讯列表
 */
export async function fetchCLSFlashNews(page = 1, pageSize = 20): Promise<CLSNewsItem[]> {
  try {
    const enParams = Array.from({ length: 200 }, (_, i) => `${20100 + i}`).join(',');
    const params = await getSearchParams({
      en: enParams,
      rn: pageSize.toString(),
      page: page.toString(),
    });
    
    const url = `https://www.cls.cn/api/sw`;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.cls.cn/telegraph',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Origin': 'https://www.cls.cn'
    };

    const response = await myFetch(url, { 
      headers,
      params
    }) as CLSNewsListResponse;
    
    if (response.code !== 0 || !response.data?.roll_data?.list) {
      logger.error(`获取财联社快讯列表失败: ${JSON.stringify(response)}`);
      return [];
    }
    
    return response.data.roll_data.list.map(item => ({
      id: item.id,
      title: item.title,
      summary: item.digest,
      url: item.link || item.shareurl || `https://www.cls.cn/detail/${item.id}`,
      pubDate: new Date(parseInt(item.ctime) * 1000).toISOString(),
      source: item.source || '财联社',
    }));
  } catch (error) {
    logger.error(`获取财联社快讯列表出错: ${error}`);
    return [];
  }
}

/**
 * 获取财联社文章列表
 * @param page 页码
 * @param pageSize 每页数量
 * @returns 财联社文章列表
 */
export async function fetchCLSArticles(page = 1, pageSize = 20): Promise<CLSNewsItem[]> {
  try {
    const params = await getSearchParams({
      page: page.toString(),
      rn: pageSize.toString(),
      subscribedColumnIds: '',
      hasFirstVipArticle: '1'
    });
    
    const url = `https://www.cls.cn/api/homeNews`;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.cls.cn/',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Origin': 'https://www.cls.cn'
    };

    const response = await myFetch(url, { 
      headers,
      params
    }) as CLSNewsListResponse;
    
    if (response.code !== 0 || !response.data?.roll_data?.list) {
      logger.error(`获取财联社文章列表失败: ${JSON.stringify(response)}`);
      return [];
    }
    
    return response.data.roll_data.list.map(item => ({
      id: item.id,
      title: item.title,
      summary: item.digest,
      url: item.link || item.shareurl || `https://www.cls.cn/detail/${item.id}`,
      pubDate: new Date(parseInt(item.ctime) * 1000).toISOString(),
      source: item.source || '财联社',
    }));
  } catch (error) {
    logger.error(`获取财联社文章列表出错: ${error}`);
    return [];
  }
}

/**
 * 获取财联社文章详情
 * @param id 文章ID
 * @returns 财联社文章详情
 */
export async function fetchCLSArticleDetail(id: string): Promise<CLSNewsItem | null> {
  try {
    const params = await getSearchParams();
    
    const url = `https://www.cls.cn/api/article/${id}`;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': `https://www.cls.cn/detail/${id}`,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Origin': 'https://www.cls.cn'
    };

    const response = await myFetch(url, { 
      headers,
      params
    }) as CLSNewsDetailResponse;
    
    if (response.code !== 0 || !response.data) {
      logger.error(`获取财联社文章详情失败: ${JSON.stringify(response)}`);
      return null;
    }
    
    // 提取文章中的第一张图片作为封面图
    let imageUrl = '';
    try {
      const $ = load(response.data.content);
      const firstImg = $('img').first();
      if (firstImg.length) {
        imageUrl = firstImg.attr('src') || '';
      }
    } catch (e) {
      logger.error(`提取文章图片出错: ${e}`);
    }
    
    return {
      id,
      title: response.data.title,
      content: response.data.content,
      url: `https://www.cls.cn/detail/${id}`,
      pubDate: new Date(parseInt(response.data.ctime) * 1000).toISOString(),
      source: response.data.source || '财联社',
      author: response.data.author,
      tags: response.data.tags,
      category: response.data.category,
      imageUrl
    };
  } catch (error) {
    logger.error(`获取财联社文章详情出错: ${error}`);
    return null;
  }
}
