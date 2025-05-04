/**
 * 金十数据爬虫
 * 用于获取金十数据的新闻数据
 */

import { load } from 'cheerio';
import { logger } from '../logger';
import { myFetch } from '../fetch';

// 金十数据新闻类型
export interface Jin10NewsItem {
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

// 金十数据API返回的数据类型
interface Jin10ApiItem {
  id: string;
  time: string;
  type: number;
  data: {
    pic?: string;
    title?: string;
    source?: string;
    content?: string;
    source_link?: string;
    vip_title?: string;
    lock?: boolean;
    vip_level?: number;
    vip_desc?: string;
  };
  important: number;
  tags: string[];
  channel: number[];
  remark: any[];
}

/**
 * 获取金十数据新闻列表
 * @param page 页码
 * @param pageSize 每页数量
 * @returns 金十数据新闻列表
 */
export async function fetchJin10News(page = 1, pageSize = 20): Promise<Jin10NewsItem[]> {
  try {
    // 使用时间戳确保获取最新数据
    const timestamp = Date.now();
    const url = `https://www.jin10.com/flash_newest.js?t=${timestamp}`;
    
    logger.info(`开始获取金十数据新闻列表: ${url}`);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.jin10.com/',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    };

    // 获取JS文件内容
    const rawData: string = await myFetch(url, { 
      headers,
      responseType: 'text'
    });
    
    if (!rawData) {
      logger.error(`获取金十数据新闻列表失败: 响应为空`);
      return [];
    }
    
    // 处理JS文件内容，提取JSON数据
    const jsonStr = (rawData as string)
      .replace(/^var\s+newest\s*=\s*/, "") // 移除开头的变量声明
      .replace(/;*$/, "") // 移除末尾可能存在的分号
      .trim(); // 移除首尾空白字符
    
    // 解析JSON数据
    const data: Jin10ApiItem[] = JSON.parse(jsonStr);
    
    logger.info(`成功获取到 ${data.length} 条金十数据新闻`);
    
    // 过滤并转换数据
    const allNews = data
      .filter(item => (item.data.title || item.data.content) && !item.channel?.includes(5))
      .map(item => {
        const text = (item.data.title || item.data.content)!.replace(/<\/?b>/g, "");
        const [, title, desc] = text.match(/^【([^】]*)】(.*)$/) ?? [];
        
        // 解析时间
        let pubDate = new Date();
        try {
          pubDate = new Date(item.time);
        } catch (e) {
          logger.warn(`解析金十数据时间失败: ${item.time}`, { error: e });
        }
        
        return {
          id: item.id,
          title: title ?? text,
          summary: desc,
          url: `https://flash.jin10.com/detail/${item.id}`,
          pubDate: pubDate.toISOString(),
          source: 'Jin10',
          category: '财经',
          author: '金十数据',
          imageUrl: item.data.pic,
          tags: item.tags,
          important: !!item.important
        };
      });
    
    // 分页处理
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedNews = allNews.slice(startIndex, endIndex);
    
    logger.info(`返回 ${paginatedNews.length} 条金十数据新闻`);
    
    return paginatedNews;
  } catch (error) {
    logger.error(`获取金十数据新闻列表出错: ${error}`);
    return [];
  }
}

/**
 * 获取金十数据文章详情
 * @param id 文章ID
 * @returns 金十数据文章详情
 */
export async function fetchJin10ArticleDetail(id: string): Promise<Jin10NewsItem | null> {
  try {
    const url = `https://flash.jin10.com/detail/${id}`;
    
    logger.info(`开始获取金十数据文章详情: ${url}`);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.jin10.com/',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    };

    // 获取HTML页面
    const html = await myFetch(url, { 
      headers,
      responseType: 'text'
    });
    
    if (!html) {
      logger.error(`获取金十数据文章详情失败: ${url}`);
      return null;
    }
    
    // 使用cheerio解析HTML
    const $ = load(html);
    
    // 提取文章信息
    const title = $('.flash-detail-title').text().trim();
    const content = $('.flash-detail-content').html() || '';
    const pubDateText = $('.flash-detail-time').text().trim();
    
    // 尝试解析发布时间
    let pubDate = new Date();
    try {
      // 先尝试直接解析
      const parsedDate = new Date(pubDateText);
      
      // 检查日期是否有效
      if (!Number.isNaN(parsedDate.getTime())) {
        pubDate = parsedDate;
      } else {
        // 如果直接解析失败，尝试其他格式
        logger.warn(`直接解析金十数据文章时间失败: ${pubDateText}，使用当前时间`);
      }
    } catch (e) {
      logger.warn(`解析金十数据文章时间失败: ${pubDateText}，使用当前时间`, { error: e });
    }
    
    // 提取文章中的第一张图片作为封面图
    let imageUrl = '';
    const firstImg = $('.flash-detail-content img').first();
    if (firstImg.length) {
      imageUrl = firstImg.attr('src') || '';
    }
    
    // 提取文章摘要
    let summary = '';
    const firstP = $('.flash-detail-content p').first();
    if (firstP.length) {
      summary = firstP.text().trim();
    }
    
    logger.info(`成功获取到金十数据文章详情: ${title}`);
    
    return {
      id,
      title,
      content,
      summary,
      url,
      pubDate: pubDate.toISOString(),
      source: 'Jin10',
      category: '财经',
      author: '金十数据',
      imageUrl
    };
  } catch (error) {
    logger.error(`获取金十数据文章详情出错: ${error}`);
    return null;
  }
}
