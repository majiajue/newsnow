import axios from 'axios';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';
import type { H3Event } from 'h3';

export interface ApiCallContext {
  traceId: string;
  endpoint: string;
  startTime: number;
}

export async function callWithRetry<T>(
  event: H3Event,
  fn: (ctx: ApiCallContext) => Promise<T>,
  options: {
    retries?: number;
    timeout?: number;
    endpoint: string;
  }
): Promise<T> {
  const context: ApiCallContext = {
    traceId: event.context.traceId,
    endpoint: options.endpoint,
    startTime: Date.now()
  };

  logger.info(`[${context.traceId}] API调用开始`, {
    endpoint: context.endpoint,
    timeout: options.timeout,
    maxRetries: options.retries
  });

  const maxRetries = options.retries ?? parseInt(process.env.DEEPSEEK_API_RETRIES || '3');
  const timeout = options.timeout ?? parseInt(process.env.DEEPSEEK_API_TIMEOUT || '60000');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    logger.debug(`[${context.traceId}] API调用设置`, {
      timeout: `${timeout}ms`,
      maxRetries,
      currentAttempt: attempt
    });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const result = await fn(context);
      clearTimeout(timeoutId);
      logger.info(`[${context.traceId}] API调用成功`, {
        duration: Date.now() - context.startTime,
        endpoint: context.endpoint
      });
      return result;
      
    } catch (error) {
      logger.error(`[${context.traceId}] API调用失败`, {
        endpoint: context.endpoint,
        duration: Date.now() - context.startTime,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      logger.warn(`[${context.traceId}] API调用尝试 ${attempt}/${maxRetries} 失败`, {
        error: error.message,
        stack: error.stack,
        ...(error.response && {
          status: error.response.status,
          data: error.response.data
        })
      });

      if (attempt >= maxRetries) {
        logger.error(`[${context.traceId}] 所有重试尝试失败`);
        throw error;
      }

      // 指数退避
      await new Promise(resolve => 
        setTimeout(resolve, 1000 * Math.pow(2, attempt))
      );
    }
  }
  throw new Error('无法完成API调用');
}

export function createApiClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    timeout: parseInt(process.env.DEEPSEEK_API_TIMEOUT || '60000'),
  });

  client.interceptors.request.use(config => {
    logger.debug(`发起API请求`, {
      url: config.url,
      method: config.method,
      timeout: config.timeout
    });
    return config;
  });

  client.interceptors.response.use(
    response => {
      logger.debug(`API响应成功`, {
        url: response.config.url,
        status: response.status
      });
      return response;
    },
    error => {
      logger.error(`API响应错误`, {
        url: error.config?.url,
        code: error.code,
        message: error.message,
        ...(error.response && {
          status: error.response.status,
          data: error.response.data
        })
      });
      return Promise.reject(error);
    }
  );

  return client;
}
