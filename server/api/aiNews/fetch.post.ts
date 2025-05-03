/**
 * AI新闻获取API
 * 根据URL获取并分析新闻文章
 * POST /api/aiNews/fetch
 */

import { defineEventHandler, readBody } from 'h3';
import { fetchAndAnalyzeArticle } from '../../aiNews/services/newsService';
import { logger } from '../../utils/logger';

export default defineEventHandler(async (event) => {
  try {
    const { url, analyzeContent = true } = await readBody(event);
    
    if (!url) {
      return {
        success: false, 
        error: '缺少URL参数'
      };
    }
    
    logger.info(`收到新闻获取请求: ${url}`);
    
    // 获取并分析文章
    const result = await fetchAndAnalyzeArticle(url, {
      extractLinks: true,
      extractImages: true
    });
    
    if (!result.success) {
      return { 
        success: false, 
        error: result.error || '获取内容失败' 
      };
    }
    
    // 返回结果
    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    logger.error(`新闻获取API错误: ${error.message}`);
    return { 
      success: false, 
      error: `处理失败: ${error.message}` 
    };
  }
});
