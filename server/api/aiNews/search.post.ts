/**
 * AI新闻搜索API
 * 根据关键词搜索并获取相关新闻
 * POST /api/aiNews/search
 */

import { defineEventHandler, readBody } from 'h3';
import { searchAndFetchNews } from '../../aiNews/services/newsService';
import { logger } from '../../utils/logger';

export default defineEventHandler(async (event) => {
  try {
    const { query, numResults = 5, site, fetchFullContent = true, analyzeContent = false } = await readBody(event);
    
    if (!query) {
      return {
        success: false, 
        error: '缺少搜索关键词'
      };
    }
    
    logger.info(`收到新闻搜索请求: ${query}`);
    
    // 搜索并获取新闻
    const result = await searchAndFetchNews(query, {
      numResults,
      site,
      fetchFullContent,
      analyzeContent
    });
    
    if (!result.success) {
      return { 
        success: false, 
        error: result.error || '搜索失败' 
      };
    }
    
    // 返回结果
    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    logger.error(`新闻搜索API错误: ${error.message}`);
    return { 
      success: false, 
      error: `处理失败: ${error.message}` 
    };
  }
});
