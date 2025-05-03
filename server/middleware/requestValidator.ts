import { createError, defineEventHandler, getQuery } from 'h3';
import { logger } from '../utils/logger';

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  const requestId = event.context.traceId = crypto.randomUUID();
  
  // 记录请求信息
  logger.info(`[${requestId}] 请求开始`, {
    method: event.method,
    path: event.path,
    query: getQuery(event)
  });

  try {
    // 验证文章ID格式
    if (event.path.startsWith('/api/news/article/')) {
      const articleId = event.context.params?.id;
      if (articleId && !/^\d{6,}$/.test(articleId)) {
        throw createError({
          statusCode: 400,
          message: '无效的文章ID格式',
          data: { articleId }
        });
      }
    }

    // 继续处理请求，不返回任何内容
    // 注意：这里不应该返回event，应该返回undefined让请求继续处理
  } catch (error: any) {
    logger.error(`[${requestId}] 请求处理失败`, {
      error: error.message || String(error),
      stack: error.stack || '',
      duration: Date.now() - startTime
    });
    throw error;
  } finally {
    // 在finally块中记录请求完成信息
    event.node.res.on('finish', () => {
      logger.info(`[${requestId}] 请求完成`, {
        duration: Date.now() - startTime,
        status: event.node.res.statusCode
      });
    });
  }
});
