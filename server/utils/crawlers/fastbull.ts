/**
 * FastBull新闻爬虫
 * 用于获取FastBull的新闻数据
 */

import { load } from 'cheerio';
import { logger } from '../logger';
import { myFetch } from '../fetch';

// FastBull新闻类型
export interface FastBullNewsItem {
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

/**
 * 获取FastBull新闻列表
 * @param page 页码
 * @param pageSize 每页数量
 * @returns FastBull新闻列表
 */
export async function fetchFastBullNews(page = 1, pageSize = 20): Promise<FastBullNewsItem[]> {
  try {
    const baseURL = "https://www.fastbull.com";
    const url = `${baseURL}/cn/news`;
    
    logger.info(`开始获取FastBull新闻列表: ${url}`);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.fastbull.com/',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    };

    // 获取HTML页面
    const html = await myFetch(url, { 
      headers,
      responseType: 'text'
    });
    
    if (!html) {
      logger.error(`获取FastBull新闻列表失败: 响应为空`);
      return [];
    }
    
    // 使用cheerio解析HTML
    const $ = load(html);
    const $main = $('.trending_type');
    
    logger.info(`找到 ${$main.length} 个FastBull新闻元素`);
    
    const allNews: FastBullNewsItem[] = [];
    
    $main.each((_, el) => {
      const a = $(el);
      const url = a.attr('href');
      const title = a.find('.title').text();
      const dateStr = a.find('[data-date]').attr('data-date');
      
      if (url && title && dateStr) {
        // 解析时间戳
        const timestamp = parseInt(dateStr);
        const pubDate = new Date(timestamp);
        
        allNews.push({
          id: url,
          title,
          url: baseURL + url,
          pubDate: pubDate.toISOString(),
          source: 'FastBull',
          category: '财经',
          author: 'FastBull'
        });
      }
    });
    
    // 如果没有获取到新闻，尝试获取快讯
    if (allNews.length === 0) {
      logger.info('没有获取到FastBull新闻，尝试获取快讯');
      return fetchFastBullExpress(page, pageSize);
    }
    
    // 分页处理
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedNews = allNews.slice(startIndex, endIndex);
    
    logger.info(`成功获取到 ${paginatedNews.length} 篇FastBull文章`);
    
    return paginatedNews;
  } catch (error) {
    logger.error(`获取FastBull新闻列表出错: ${error}`);
    return [];
  }
}

/**
 * 获取FastBull快讯列表
 * @param page 页码
 * @param pageSize 每页数量
 * @returns FastBull快讯列表
 */
export async function fetchFastBullExpress(page = 1, pageSize = 20): Promise<FastBullNewsItem[]> {
  try {
    const baseURL = "https://www.fastbull.com";
    const url = `${baseURL}/cn/express-news`;
    
    logger.info(`开始获取FastBull快讯列表: ${url}`);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.fastbull.com/',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    };

    // 获取HTML页面
    const html = await myFetch(url, { 
      headers,
      responseType: 'text'
    });
    
    if (!html) {
      logger.error(`获取FastBull快讯列表失败: 响应为空`);
      return [];
    }
    
    // 使用cheerio解析HTML
    const $ = load(html);
    const $main = $('.news-list');
    
    logger.info(`找到 ${$main.length} 个FastBull快讯元素`);
    
    const allNews: FastBullNewsItem[] = [];
    
    $main.each((_, el) => {
      const a = $(el).find('.title_name');
      const url = a.attr('href');
      const titleText = a.text();
      // 提取标题中的【】内容，如果没有则使用完整标题
      const title = titleText.match(/【(.+)】/)?.[1] ?? titleText;
      const date = $(el).attr('data-date');
      
      if (url && title && date) {
        // 解析时间戳
        const timestamp = parseInt(date);
        const pubDate = new Date(timestamp);
        
        allNews.push({
          id: url,
          title: title.length < 4 ? titleText : title,
          url: baseURL + url,
          pubDate: pubDate.toISOString(),
          source: 'FastBull',
          category: '财经快讯',
          author: 'FastBull'
        });
      }
    });
    
    // 分页处理
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedNews = allNews.slice(startIndex, endIndex);
    
    logger.info(`成功获取到 ${paginatedNews.length} 条FastBull快讯`);
    
    return paginatedNews;
  } catch (error) {
    logger.error(`获取FastBull快讯列表出错: ${error}`);
    return [];
  }
}

/**
 * 获取FastBull文章详情
 * @param id 文章ID
 * @returns FastBull文章详情
 */
export async function fetchFastBullArticleDetail(id: string): Promise<FastBullNewsItem | null> {
  try {
    const baseURL = "https://www.fastbull.com";
    const url = `${baseURL}${id}`;
    
    logger.info(`开始获取FastBull文章详情: ${url}`);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.fastbull.com/',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    };

    // 获取HTML页面
    const html = await myFetch(url, { 
      headers,
      responseType: 'text'
    });
    
    if (!html) {
      logger.error(`获取FastBull文章详情失败: ${url}`);
      return null;
    }
    
    // 使用cheerio解析HTML
    const $ = load(html);
    
    // 尝试获取新闻详情
    let title = $('.news-detail-title').text().trim();
    let content = $('.news-detail-content').html() || '';
    let pubDateText = $('.news-detail-time').text().trim();
    let author = $('.news-detail-source').text().trim() || 'FastBull';
    
    // 如果没有找到新闻详情，尝试获取快讯详情
    if (!title) {
      title = $('.express-detail-title').text().trim();
      content = $('.express-detail-content').html() || '';
      pubDateText = $('.express-detail-time').text().trim();
      author = $('.express-detail-source').text().trim() || 'FastBull';
    }
    
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
        logger.warn(`直接解析FastBull文章时间失败: ${pubDateText}，使用当前时间`);
      }
    } catch (e) {
      logger.warn(`解析FastBull文章时间失败: ${pubDateText}，使用当前时间`, { error: e });
    }
    
    // 提取文章中的第一张图片作为封面图
    let imageUrl = '';
    const firstImg = $('img').first();
    if (firstImg.length) {
      imageUrl = firstImg.attr('src') || '';
    }
    
    // 提取文章摘要
    let summary = '';
    const firstP = $('p').first();
    if (firstP.length) {
      summary = firstP.text().trim();
    }
    
    logger.info(`成功获取到FastBull文章详情: ${title}`);
    
    return {
      id,
      title,
      content,
      summary,
      url,
      pubDate: pubDate.toISOString(),
      source: 'FastBull',
      category: url.includes('express') ? '财经快讯' : '财经',
      author,
      imageUrl
    };
  } catch (error) {
    logger.error(`获取FastBull文章详情出错: ${error}`);
    return null;
  }
}
