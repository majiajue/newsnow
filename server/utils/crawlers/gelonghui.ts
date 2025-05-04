/**
 * 格隆汇爬虫
 * 用于获取格隆汇的新闻数据
 */

import { load } from 'cheerio';
import { logger } from '../logger';
import { myFetch } from '../fetch';

// 格隆汇新闻类型
export interface GelonghuiNewsItem {
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
 * 获取格隆汇新闻列表
 * @param page 页码
 * @param pageSize 每页数量
 * @returns 格隆汇新闻列表
 */
export async function fetchGelonghuiNews(page = 1, pageSize = 20): Promise<GelonghuiNewsItem[]> {
  try {
    const baseURL = "https://www.gelonghui.com";
    const url = `${baseURL}/news/`;
    
    logger.info(`开始获取格隆汇新闻列表: ${url}`);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.gelonghui.com/',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    };

    // 获取HTML页面
    const html = await myFetch(url, { 
      headers,
      responseType: 'text'
    });
    
    if (!html) {
      logger.error(`获取格隆汇新闻列表失败: 响应为空`);
      return [];
    }
    
    // 使用cheerio解析HTML
    const $ = load(html);
    const $main = $('.article-content');
    
    logger.info(`找到 ${$main.length} 个格隆汇新闻元素`);
    
    const allNews: GelonghuiNewsItem[] = [];
    
    $main.each((_, el) => {
      const a = $(el).find('.detail-right>a');
      const url = a.attr('href');
      const title = a.find('h2').text();
      const info = $(el).find('.time > span:nth-child(1)').text();
      const relativeTime = $(el).find('.time > span:nth-child(3)').text();
      
      if (url && title && relativeTime) {
        // 解析相对时间
        let pubDate = new Date();
        try {
          // 尝试解析相对时间，如"3小时前"、"昨天"等
          if (relativeTime.includes('分钟前')) {
            const minutes = parseInt(relativeTime);
            pubDate = new Date(Date.now() - minutes * 60 * 1000);
          } else if (relativeTime.includes('小时前')) {
            const hours = parseInt(relativeTime);
            pubDate = new Date(Date.now() - hours * 60 * 60 * 1000);
          } else if (relativeTime.includes('昨天')) {
            pubDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          } else if (relativeTime.includes('天前')) {
            const days = parseInt(relativeTime);
            pubDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
          } else {
            // 尝试直接解析时间字符串
            pubDate = new Date(relativeTime);
          }
        } catch (e) {
          logger.warn(`解析格隆汇时间失败: ${relativeTime}`, { error: e });
        }
        
        allNews.push({
          id: url,
          title,
          url: baseURL + url,
          pubDate: pubDate.toISOString(),
          source: 'Gelonghui',
          category: '财经',
          author: '格隆汇',
          summary: info
        });
      }
    });
    
    // 分页处理
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedNews = allNews.slice(startIndex, endIndex);
    
    logger.info(`成功获取到 ${paginatedNews.length} 篇格隆汇文章`);
    
    return paginatedNews;
  } catch (error) {
    logger.error(`获取格隆汇新闻列表出错: ${error}`);
    return [];
  }
}

/**
 * 获取格隆汇文章详情
 * @param id 文章ID
 * @returns 格隆汇文章详情
 */
export async function fetchGelonghuiArticleDetail(id: string): Promise<GelonghuiNewsItem | null> {
  try {
    const baseURL = "https://www.gelonghui.com";
    const url = `${baseURL}${id}`;
    
    logger.info(`开始获取格隆汇文章详情: ${url}`);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.gelonghui.com/',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    };

    // 获取HTML页面
    const html = await myFetch(url, { 
      headers,
      responseType: 'text'
    });
    
    if (!html) {
      logger.error(`获取格隆汇文章详情失败: 响应为空`);
      return null;
    }
    
    // 使用cheerio解析HTML
    const $ = load(html);
    
    // 提取文章信息
    const title = $('.article-title').text().trim();
    const content = $('.article-content').html() || '';
    const pubDateText = $('.article-time').text().trim();
    const author = $('.article-author').text().trim() || '格隆汇';
    
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
        logger.warn(`直接解析格隆汇文章时间失败: ${pubDateText}，使用当前时间`);
      }
    } catch (e) {
      logger.warn(`解析格隆汇文章时间失败: ${pubDateText}，使用当前时间`, { error: e });
    }
    
    // 提取文章中的第一张图片作为封面图
    let imageUrl = '';
    const firstImg = $('.article-content img').first();
    if (firstImg.length) {
      imageUrl = firstImg.attr('src') || '';
    }
    
    // 提取文章摘要
    let summary = '';
    const firstP = $('.article-content p').first();
    if (firstP.length) {
      summary = firstP.text().trim();
    }
    
    logger.info(`成功获取到格隆汇文章详情: ${title}`);
    
    return {
      id,
      title,
      content,
      summary,
      url,
      pubDate: pubDate.toISOString(),
      source: 'Gelonghui',
      category: '财经',
      author,
      imageUrl
    };
  } catch (error) {
    logger.error(`获取格隆汇文章详情出错: ${error}`);
    return null;
  }
}
