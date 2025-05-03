/**
 * AI新闻批量处理API
 * 批量获取并分析多个URL的新闻
 * POST /api/aiNews/batch
 */

import { defineEventHandler, readBody } from 'h3';
import { batchProcessArticles } from '../../aiNews/services/newsService';
import { logger } from '../../utils/logger';

export default defineEventHandler(async (event) => {
  try {
    const { urls, analyzeContent = false } = await readBody(event);
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return {
        success: false, 
        error: '缺少有效的URL数组'
      };
    }
    
    logger.info(`收到批量新闻处理请求: ${urls.length}个URL`);
    
    // 批量处理文章
    const result = await batchProcessArticles(urls, analyzeContent);
    
    if (!result.success) {
      return { 
        success: false, 
        error: result.error || '批量处理失败' 
      };
    }
    
    // 返回结果
    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    logger.error(`批量新闻处理API错误: ${error.message}`);
    return { 
      success: false, 
      error: `处理失败: ${error.message}` 
    };
  }
});
