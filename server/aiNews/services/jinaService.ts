/**
 * Jina AI API 服务
 * 提供与Jina AI API交互的功能，包括内容获取、分段、嵌入和分类
 */

import axios from "axios";
import { logger } from "../../utils/logger";
import { JINA_API, JINA_BACKUP } from "../../config/jinaApi";
import { ContentFetchOptions, JinaApiResponse, NewsArticle } from "../types";

// API超时和重试配置
const API_TIMEOUT = JINA_API.TIMEOUT;
const MAX_RETRIES = JINA_API.MAX_RETRIES;

/**
 * 生成模拟数据
 * @param type 模拟数据类型
 * @returns 模拟数据
 */
function generateMockData(type: string): any {
  // 根据JINA_BACKUP配置添加延迟
  if (JINA_BACKUP.MOCK_DELAY > 0) {
    const delay = Math.random() * JINA_BACKUP.MOCK_DELAY;
    logger.info(`使用模拟数据，延迟${delay.toFixed(0)}ms`);
  }

  switch (type) {
    case 'reader':
      return {
        success: true,
        title: '模拟文章标题',
        content: '这是一篇模拟文章的内容。它包含了一些段落和信息，用于测试和开发。这篇文章没有实际意义，仅作为API调用失败时的备用数据。',
        images: { count: 0, items: [] },
        links: { count: 0, items: [] },
        metadata: { source: 'mock', timestamp: Date.now() }
      };
    case 'search':
      return {
        success: true,
        results: [
          {
            title: '模拟搜索结果1',
            url: 'https://example.com/result1',
            snippet: '这是第一个模拟搜索结果的摘要内容。'
          },
          {
            title: '模拟搜索结果2',
            url: 'https://example.com/result2',
            snippet: '这是第二个模拟搜索结果的摘要内容。'
          }
        ]
      };
    case 'segment':
      return {
        success: true,
        chunks: [
          '这是第一个模拟文本块。',
          '这是第二个模拟文本块。',
          '这是第三个模拟文本块，用于测试分段功能。'
        ],
        totalChunks: 3
      };
    case 'embeddings':
      return {
        success: true,
        embeddings: [
          { vector: Array(10).fill(0).map(() => Math.random()) },
          { vector: Array(10).fill(0).map(() => Math.random()) }
        ]
      };
    case 'classify':
      return {
        success: true,
        classifications: [
          { prediction: '技术', score: 0.85 },
          { prediction: '科学', score: 0.65 }
        ]
      };
    case 'rerank':
      return {
        success: true,
        results: [
          { index: 0, score: 0.95 },
          { index: 1, score: 0.75 }
        ]
      };
    default:
      return { success: false, error: '未知的模拟数据类型' };
  }
}

/**
 * 使用Jina Reader API获取单个URL的高质量内容
 * @param url 需要解析的URL
 * @param options 额外选项，如是否提取链接和图片
 * @returns 解析后的内容
 */
export async function readArticleContent(url: string, options: ContentFetchOptions = {}): Promise<JinaApiResponse<NewsArticle>> {
  const { extractLinks = true, extractImages = true, timeout = API_TIMEOUT, maxRetries = MAX_RETRIES } = options;

  try {
    if (!JINA_API.API_KEY) {
      throw new Error("缺少JINA_API_KEY环境变量");
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${JINA_API.API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // 配置提取选项
    if (extractLinks) {
      headers['X-With-Links-Summary'] = 'true';
    }
    if (extractImages) {
      headers['X-With-Images-Summary'] = 'true';
    }

    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await axios.post(JINA_API.BASE_URLS.READER,
      { url },
      {
        headers,
        signal: controller.signal as any
      }
    );

    clearTimeout(timeoutId);

    if (response.status === 200 && response.data.data && response.data.data.content) {
      // 处理图片数据
      const images = response.data.data.images ? 
        response.data.data.images.items.map((img: any) => ({
          url: img.url,
          alt: img.alt || '',
          width: img.width,
          height: img.height
        })) : [];

      // 处理链接数据
      const links = response.data.data.links ?
        response.data.data.links.items.map((link: any) => ({
          url: link.url,
          text: link.text || link.url,
          isExternal: link.url.startsWith('http')
        })) : [];

      return {
        success: true,
        data: {
          url,
          title: response.data.data.title || '',
          content: response.data.data.content,
          images,
          links,
          source: response.data.data.metadata?.source || new URL(url).hostname,
          publishDate: response.data.data.metadata?.publishDate || new Date().toISOString()
        }
      };
    }

    return { success: false, error: '内容解析失败' };
  } catch (error: any) {
    logger.error(`读取内容错误: ${error.message}`);
    
    // 如果配置使用模拟数据，则返回模拟数据
    if (JINA_BACKUP.USE_MOCK) {
      logger.info(`使用模拟数据替代失败的Reader API调用: ${url}`);
      const mockData = generateMockData('reader');
      return {
        success: true,
        data: {
          url,
          title: mockData.title,
          content: mockData.content,
          images: [],
          links: [],
          source: 'mock',
          publishDate: new Date().toISOString()
        }
      };
    }
    
    return { success: false, error: `获取内容失败: ${error.message}` };
  }
}

/**
 * 使用Jina Search API搜索相关内容
 * @param query 搜索查询
 * @param options 搜索选项，如结果数量和特定网站
 * @returns 搜索结果
 */
export async function searchContent(query: string, options: {
  numResults?: number,
  site?: string,
  timeout?: number
} = {}) {
  const { numResults = 5, site, timeout = API_TIMEOUT } = options;

  try {
    if (!JINA_API.API_KEY) {
      throw new Error("缺少JINA_API_KEY环境变量");
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${JINA_API.API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-With-Links-Summary': 'true',
      'X-With-Images-Summary': 'true'
    };

    // 如果需要限制在特定网站内搜索
    if (site) {
      headers['X-Site'] = site;
    }

    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await axios.post(JINA_API.BASE_URLS.SEARCH,
      {
        q: query,
        num: numResults
      },
      {
        headers,
        signal: controller.signal as any
      }
    );

    clearTimeout(timeoutId);

    if (response.status === 200 && response.data.data) {
      return {
        success: true,
        results: response.data.data
      };
    }

    return { success: false, error: '搜索失败', results: [] };
  } catch (error: any) {
    logger.error(`搜索内容错误: ${error.message}`);
    
    // 如果配置使用模拟数据，则返回模拟数据
    if (JINA_BACKUP.USE_MOCK) {
      logger.info(`使用模拟数据替代失败的Search API调用: ${query}`);
      return generateMockData('search');
    }
    
    return { success: false, error: `搜索失败: ${error.message}`, results: [] };
  }
}

/**
 * 使用Jina Segmenter API将内容分段
 * @param content 需要分段的内容
 * @param options 分段选项
 * @returns 分段结果
 */
export async function segmentContent(content: string, options: {
  maxChunkLength?: number,
  returnChunks?: boolean,
  timeout?: number
} = {}) {
  const { maxChunkLength = 1000, returnChunks = true, timeout = API_TIMEOUT } = options;

  try {
    if (!JINA_API.API_KEY) {
      throw new Error("缺少JINA_API_KEY环境变量");
    }

    const headers = {
      'Authorization': `Bearer ${JINA_API.API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await axios.post(JINA_API.BASE_URLS.SEGMENT,
      {
        content,
        return_chunks: returnChunks,
        max_chunk_length: maxChunkLength
      },
      {
        headers,
        signal: controller.signal as any
      }
    );

    clearTimeout(timeoutId);

    if (response.status === 200) {
      return {
        success: true,
        chunks: response.data.chunks || [],
        totalChunks: response.data.chunks ? response.data.chunks.length : 0
      };
    }

    return { success: false, error: '分段失败', chunks: [] };
  } catch (error: any) {
    logger.error(`内容分段错误: ${error.message}`);
    
    // 如果配置使用模拟数据，则返回模拟数据
    if (JINA_BACKUP.USE_MOCK) {
      logger.info(`使用模拟数据替代失败的Segment API调用`);
      return generateMockData('segment');
    }
    
    return { success: false, error: `分段失败: ${error.message}`, chunks: [] };
  }
}

/**
 * 使用重试机制调用API函数
 * @param apiFunc 要调用的API函数
 * @param args 函数参数
 * @param maxRetries 最大重试次数
 * @returns API调用结果
 */
export async function callWithRetry<T>(
  apiFunc: (...args: any[]) => Promise<T>,
  args: any[] = [],
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiFunc(...args);
    } catch (error) {
      lastError = error;
      logger.warn(`API调用失败(尝试 ${attempt}/${maxRetries}): ${(error as Error).message}`);
      
      // 指数退避策略
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('API调用失败，已达到最大重试次数');
}
