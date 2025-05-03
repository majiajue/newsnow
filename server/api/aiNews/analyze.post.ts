/**
 * AI新闻分析API
 * 对已有的新闻内容进行分析
 * POST /api/aiNews/analyze
 */

import { defineEventHandler, readBody } from 'h3';
import { generateArticleAnalysis } from '../../aiNews/services/analysisService';
import { logger } from '~/utils/logger';
import { createError } from 'h3';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  logger.info('收到分析请求', {
    url: event.node.req.url,
    title: body.title,
    contentLength: body.content?.length
  });

  try {
    const { title, content, language = 'zh', articleId } = body;
    
    // 在调用API前添加验证
    if (!articleId || !isValidArticleId(articleId)) {
      logger.error('无效的文章ID', { articleId });
      throw createError({
        statusCode: 400,
        message: '无效的文章ID格式'
      });
    }

    if (!title || !content) {
      return {
        success: false, 
        error: '缺少标题或内容参数'
      };
    }
    
    // 生成文章分析
    const result = await generateArticleAnalysis(title, content, {
      language,
      maxTokens: 1000,
      temperature: 0.7
    });
    
    if (!result.success) {
      return { 
        success: false, 
        error: result.error || '分析失败' 
      };
    }
    
    if (!result.data.summary) {
      logger.error('分析结果缺少摘要', {
        inputTitle: title,
        analysis: result.data
      });
      throw new Error('分析结果不完整');
    }
    
    logger.info('分析完成', {
      url: event.node.req.url,
      summaryLength: result.data.summary.length,
      keyPoints: result.data.keyPoints?.length
    });
    
    // 返回结果
    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    logger.error('分析处理失败', {
      error: error.message,
      requestBody: {
        title: body.title,
        contentLength: body.content?.length
      }
    });
    
    return { 
      success: false, 
      error: `处理失败: ${error.message}`,
      details: error.message
    };
  }
});

// 添加验证函数
function isValidArticleId(id: string): boolean {
  return /^\d+$/.test(id) && id.length >= 6;
}
