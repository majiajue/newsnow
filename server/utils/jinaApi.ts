/**
 * Jina AI API 集成模块
 * 提供与Jina AI API交互的功能，包括内容获取、分段、嵌入和分类
 */

import { logger } from "./logger"
import axios from "axios"
import { JINA_API, JINA_BACKUP } from "../config/jinaApi"

// 超时和重试配置
const API_TIMEOUT = JINA_API.TIMEOUT
const MAX_RETRIES = JINA_API.MAX_RETRIES

/**
 * 生成模拟数据
 * @param type 模拟数据类型
 * @returns 模拟数据
 */
function generateMockData(type: string): any {
  // 根据JINA_BACKUP配置添加延迟
  if (JINA_BACKUP.MOCK_DELAY > 0) {
    const delay = Math.random() * JINA_BACKUP.MOCK_DELAY
    logger.info(`使用模拟数据，延迟${delay.toFixed(0)}ms`)
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
      }
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
      }
    case 'segment':
      return {
        success: true,
        chunks: [
          '这是第一个模拟文本块。',
          '这是第二个模拟文本块。',
          '这是第三个模拟文本块，用于测试分段功能。'
        ],
        totalChunks: 3
      }
    case 'embeddings':
      return {
        success: true,
        embeddings: [
          { vector: Array(10).fill(0).map(() => Math.random()) },
          { vector: Array(10).fill(0).map(() => Math.random()) }
        ]
      }
    case 'classify':
      return {
        success: true,
        classifications: [
          { prediction: '技术', score: 0.85 },
          { prediction: '科学', score: 0.65 }
        ]
      }
    case 'rerank':
      return {
        success: true,
        results: [
          { index: 0, score: 0.95 },
          { index: 1, score: 0.75 }
        ]
      }
    default:
      return { success: false, error: '未知的模拟数据类型' }
  }
}

/**
 * 使用Jina Reader API获取单个URL的高质量内容
 * @param url 需要解析的URL
 * @param options 额外选项，如是否提取链接和图片
 * @returns 解析后的内容
 */
export async function readArticleContent(url: string, options: {
  extractLinks?: boolean,
  extractImages?: boolean
} = {}) {
  logger.info(`调用Jina Reader API`, { url });
  
  const { extractLinks = true, extractImages = true } = options

  try {
    if (!JINA_API.API_KEY) {
      throw new Error("缺少JINA_API_KEY环境变量")
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${JINA_API.API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    // 配置提取选项
    if (extractLinks) {
      headers['X-With-Links-Summary'] = 'true'
    }
    if (extractImages) {
      headers['X-With-Images-Summary'] = 'true'
    }

    // 创建AbortController用于超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    const response = await axios.post(JINA_API.BASE_URLS.READER,
      { url },
      {
        headers,
        signal: controller.signal as any
      }
    )

    clearTimeout(timeoutId)

    logger.info(`Jina API调用成功`, {
      url,
      contentLength: response.data.data?.content?.length || 0,
      status: response.status
    });

    if (response.status === 200 && response.data.data && response.data.data.content) {
      return {
        success: true,
        title: response.data.data.title || '',
        content: response.data.data.content,
        images: response.data.data.images || {},
        links: response.data.data.links || {},
        metadata: response.data.data.metadata || {}
      }
    }

    return { success: false, error: '内容解析失败' }
  } catch (error: any) {
    logger.error(`Jina API调用失败`, {
      url,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    
    // 如果配置使用模拟数据，则返回模拟数据
    if (JINA_BACKUP.USE_MOCK) {
      logger.info(`使用模拟数据替代失败的Reader API调用: ${url}`)
      return generateMockData('reader')
    }
    
    return { success: false, error: `获取内容失败: ${error.message}` }
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
  site?: string
} = {}) {
  logger.info(`调用Jina Search API`, { query });
  
  const { numResults = 5, site } = options

  try {
    if (!JINA_API.API_KEY) {
      throw new Error("缺少JINA_API_KEY环境变量")
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${JINA_API.API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-With-Links-Summary': 'true',
      'X-With-Images-Summary': 'true'
    }

    // 如果需要限制在特定网站内搜索
    if (site) {
      headers['X-Site'] = site
    }

    // 创建AbortController用于超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    const response = await axios.post(JINA_API.BASE_URLS.SEARCH,
      {
        q: query,
        num: numResults
      },
      {
        headers,
        signal: controller.signal as any
      }
    )

    clearTimeout(timeoutId)

    logger.info(`Jina API调用成功`, {
      query,
      resultsCount: response.data.data?.length || 0,
      status: response.status
    });

    if (response.status === 200 && response.data.data) {
      return {
        success: true,
        results: response.data.data
      }
    }

    return { success: false, error: '搜索失败', results: [] }
  } catch (error: any) {
    logger.error(`Jina API调用失败`, {
      query,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    
    // 如果配置使用模拟数据，则返回模拟数据
    if (JINA_BACKUP.USE_MOCK) {
      logger.info(`使用模拟数据替代失败的Search API调用: ${query}`)
      return generateMockData('search')
    }
    
    return { success: false, error: `搜索失败: ${error.message}`, results: [] }
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
  returnChunks?: boolean
} = {}) {
  logger.info(`调用Jina Segmenter API`, { content });
  
  const { maxChunkLength = 1000, returnChunks = true } = options

  try {
    if (!JINA_API.API_KEY) {
      throw new Error("缺少JINA_API_KEY环境变量")
    }

    const headers = {
      'Authorization': `Bearer ${JINA_API.API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    // 创建AbortController用于超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

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
    )

    clearTimeout(timeoutId)

    logger.info(`Jina API调用成功`, {
      content,
      chunksCount: response.data.chunks?.length || 0,
      status: response.status
    });

    if (response.status === 200) {
      return {
        success: true,
        chunks: response.data.chunks || [],
        totalChunks: response.data.chunks ? response.data.chunks.length : 0
      }
    }

    return { success: false, error: '分段失败', chunks: [] }
  } catch (error: any) {
    logger.error(`Jina API调用失败`, {
      content,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    
    // 如果配置使用模拟数据，则返回模拟数据
    if (JINA_BACKUP.USE_MOCK) {
      logger.info(`使用模拟数据替代失败的Segment API调用`)
      return generateMockData('segment')
    }
    
    return { success: false, error: `分段失败: ${error.message}`, chunks: [] }
  }
}

/**
 * 使用Jina Embeddings API生成文本的向量表示
 * @param texts 需要生成向量的文本，可以是单个文本或文本数组
 * @returns 向量嵌入结果
 */
export async function generateEmbeddings(texts: string | string[]) {
  logger.info(`调用Jina Embeddings API`, { texts });
  
  try {
    if (!JINA_API.API_KEY) {
      throw new Error("缺少JINA_API_KEY环境变量")
    }

    const textArray = Array.isArray(texts) ? texts : [texts]

    // 如果文本数组为空，直接返回
    if (textArray.length === 0) {
      return { success: true, embeddings: [] }
    }

    const headers = {
      'Authorization': `Bearer ${JINA_API.API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    // 创建AbortController用于超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    const response = await axios.post(JINA_API.BASE_URLS.EMBEDDINGS,
      {
        model: JINA_API.MODELS.EMBEDDINGS,
        input: textArray
      },
      {
        headers,
        signal: controller.signal as any
      }
    )

    clearTimeout(timeoutId)

    logger.info(`Jina API调用成功`, {
      texts,
      embeddingsCount: response.data.data?.length || 0,
      status: response.status
    });

    if (response.status === 200) {
      return {
        success: true,
        embeddings: response.data.data || []
      }
    }

    return { success: false, error: '生成嵌入失败', embeddings: [] }
  } catch (error: any) {
    logger.error(`Jina API调用失败`, {
      texts,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    
    // 如果配置使用模拟数据，则返回模拟数据
    if (JINA_BACKUP.USE_MOCK) {
      logger.info(`使用模拟数据替代失败的Embeddings API调用`)
      return generateMockData('embeddings')
    }
    
    return { success: false, error: `生成嵌入失败: ${error.message}`, embeddings: [] }
  }
}

/**
 * 使用Jina Classification API对内容进行分类
 * @param texts 需要分类的文本，可以是单个文本或文本数组
 * @param categories 分类类别列表
 * @returns 分类结果
 */
export async function classifyContent(texts: string | string[], categories: string[] = []) {
  logger.info(`调用Jina Classification API`, { texts });
  
  try {
    if (!JINA_API.API_KEY) {
      throw new Error("缺少JINA_API_KEY环境变量")
    }

    // 如果没有提供分类类别，使用默认类别
    if (!categories || categories.length === 0) {
      categories = ["技术", "商业", "科学", "政治", "娱乐", "健康", "体育", "教育"]
    }

    const textArray = Array.isArray(texts) ? texts : [texts]

    // 如果文本数组为空，直接返回
    if (textArray.length === 0) {
      return { success: true, classifications: [] }
    }

    const headers = {
      'Authorization': `Bearer ${JINA_API.API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    // 创建AbortController用于超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    const response = await axios.post(JINA_API.BASE_URLS.CLASSIFY,
      {
        model: JINA_API.MODELS.EMBEDDINGS,
        input: textArray,
        labels: categories
      },
      {
        headers,
        signal: controller.signal as any
      }
    )

    clearTimeout(timeoutId)

    logger.info(`Jina API调用成功`, {
      texts,
      classificationsCount: response.data.data?.length || 0,
      status: response.status
    });

    if (response.status === 200) {
      return {
        success: true,
        classifications: response.data.data || []
      }
    }

    return { success: false, error: '分类失败', classifications: [] }
  } catch (error: any) {
    logger.error(`Jina API调用失败`, {
      texts,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    
    // 如果配置使用模拟数据，则返回模拟数据
    if (JINA_BACKUP.USE_MOCK) {
      logger.info(`使用模拟数据替代失败的Classification API调用`)
      return generateMockData('classify')
    }
    
    return { success: false, error: `分类失败: ${error.message}`, classifications: [] }
  }
}

/**
 * 使用Jina Reranker API重新排序搜索结果
 * @param query 搜索查询
 * @param documents 文档列表
 * @returns 重新排序的结果
 */
export async function rerankResults(query: string, documents: string[]) {
  logger.info(`调用Jina Reranker API`, { query });
  
  try {
    if (!JINA_API.API_KEY) {
      throw new Error("缺少JINA_API_KEY环境变量")
    }

    // 如果文档列表为空，直接返回
    if (!documents || documents.length === 0) {
      return { success: true, results: [] }
    }

    const headers = {
      'Authorization': `Bearer ${JINA_API.API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    // 创建AbortController用于超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    const response = await axios.post(JINA_API.BASE_URLS.RERANK,
      {
        model: JINA_API.MODELS.RERANKER,
        query,
        documents
      },
      {
        headers,
        signal: controller.signal as any
      }
    )

    clearTimeout(timeoutId)

    logger.info(`Jina API调用成功`, {
      query,
      resultsCount: response.data.data?.length || 0,
      status: response.status
    });

    if (response.status === 200) {
      return {
        success: true,
        results: response.data.data || []
      }
    }

    return { success: false, error: '重排序失败', results: [] }
  } catch (error: any) {
    logger.error(`Jina API调用失败`, {
      query,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    
    // 如果配置使用模拟数据，则返回模拟数据
    if (JINA_BACKUP.USE_MOCK) {
      logger.info(`使用模拟数据替代失败的Reranker API调用`)
      return generateMockData('rerank')
    }
    
    return { success: false, error: `重排序失败: ${error.message}`, results: [] }
  }
}

/**
 * 使用重试机制调用API函数
 * @param apiFunc API函数
 * @param args 函数参数
 * @returns API调用结果
 */
export async function callWithRetry<T>(apiFunc: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
  let retries = 0
  let lastError: any

  while (retries < MAX_RETRIES) {
    try {
      return await apiFunc(...args)
    } catch (error) {
      lastError = error
      retries++
      logger.warn(`API调用失败，尝试第${retries}次重试...`)
      
      // 指数退避策略
      const waitTime = 1000 * Math.pow(2, retries)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  logger.error(`API调用在${MAX_RETRIES}次尝试后失败`)
  throw lastError
}
