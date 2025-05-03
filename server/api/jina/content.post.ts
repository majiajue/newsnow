/**
 * Jina内容获取和处理API
 * 提供基于Jina AI API的内容获取、分析和处理功能
 */

import { defineEventHandler, readBody } from "h3"
import { logger } from "../../utils/logger"
import { 
  readArticleContent, 
  searchContent, 
  segmentContent, 
  classifyContent, 
  generateEmbeddings 
} from "../../utils/jinaApi"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { action, url, query, options } = body

    if (!action) {
      return {
        success: false,
        error: "缺少必要参数: action"
      }
    }

    // 根据不同的操作类型执行相应的功能
    switch (action) {
      // 读取单个URL的内容
      case "read": {
        if (!url) {
          return {
            success: false,
            error: "读取内容需要提供url参数"
          }
        }
        
        logger.info(`使用Jina Reader API读取URL: ${url}`)
        const result = await readArticleContent(url, options)
        
        // 如果成功获取内容并需要进一步处理
        if (result.success && result.content && options?.processContent) {
          // 内容分段
          if (options.segment) {
            logger.info(`对内容进行分段处理`)
            const segmentResult = await segmentContent(result.content)
            if (segmentResult.success) {
              result.segments = segmentResult.chunks
            }
          }
          
          // 内容分类
          if (options.classify) {
            logger.info(`对内容进行分类`)
            const classifyResult = await classifyContent(result.content, options.categories)
            if (classifyResult.success) {
              result.classification = classifyResult.classifications
            }
          }
          
          // 生成向量嵌入
          if (options.embed) {
            logger.info(`生成内容向量嵌入`)
            const embedResult = await generateEmbeddings(result.content)
            if (embedResult.success) {
              result.embeddings = embedResult.embeddings
            }
          }
        }
        
        return result
      }
      
      // 搜索相关内容
      case "search": {
        if (!query) {
          return {
            success: false,
            error: "搜索需要提供query参数"
          }
        }
        
        logger.info(`使用Jina Search API搜索: ${query}`)
        const searchResult = await searchContent(query, options)
        
        // 如果成功搜索并需要获取详细内容
        if (searchResult.success && searchResult.results.length > 0 && options?.fetchDetails) {
          const detailedResults = []
          const maxDetailsToFetch = Math.min(searchResult.results.length, options.maxDetailsToFetch || 3)
          
          logger.info(`获取前${maxDetailsToFetch}个搜索结果的详细内容`)
          
          // 并行获取详细内容
          const detailPromises = searchResult.results
            .slice(0, maxDetailsToFetch)
            .map(async (result: any) => {
              if (result.url) {
                const detailResult = await readArticleContent(result.url)
                if (detailResult.success) {
                  return {
                    ...result,
                    fullContent: detailResult.content,
                    title: detailResult.title || result.title
                  }
                }
              }
              return result
            })
          
          const detailedItems = await Promise.all(detailPromises)
          searchResult.detailedResults = detailedItems
        }
        
        return searchResult
      }
      
      // 内容分段
      case "segment": {
        const { content } = body
        if (!content) {
          return {
            success: false,
            error: "分段需要提供content参数"
          }
        }
        
        logger.info(`使用Jina Segmenter API进行内容分段`)
        return await segmentContent(content, options)
      }
      
      // 内容分类
      case "classify": {
        const { content, categories } = body
        if (!content) {
          return {
            success: false,
            error: "分类需要提供content参数"
          }
        }
        
        logger.info(`使用Jina Classification API进行内容分类`)
        return await classifyContent(content, categories)
      }
      
      // 生成向量嵌入
      case "embed": {
        const { content } = body
        if (!content) {
          return {
            success: false,
            error: "生成嵌入需要提供content参数"
          }
        }
        
        logger.info(`使用Jina Embeddings API生成向量嵌入`)
        return await generateEmbeddings(content)
      }
      
      // 综合处理
      case "process": {
        const { content } = body
        if (!content) {
          return {
            success: false,
            error: "内容处理需要提供content参数"
          }
        }
        
        logger.info(`对内容进行综合处理`)
        const result: any = { success: true, originalContent: content }
        
        // 内容分段
        if (options?.segment) {
          const segmentResult = await segmentContent(content, options.segmentOptions)
          if (segmentResult.success) {
            result.segments = segmentResult.chunks
          }
        }
        
        // 内容分类
        if (options?.classify) {
          const classifyResult = await classifyContent(content, options.categories)
          if (classifyResult.success) {
            result.classification = classifyResult.classifications
          }
        }
        
        // 生成向量嵌入
        if (options?.embed) {
          const textToEmbed = options.embedSegments && result.segments 
            ? result.segments 
            : content
            
          const embedResult = await generateEmbeddings(textToEmbed)
          if (embedResult.success) {
            result.embeddings = embedResult.embeddings
          }
        }
        
        return result
      }
      
      default:
        return {
          success: false,
          error: `不支持的操作类型: ${action}`
        }
    }
  } catch (error: any) {
    logger.error(`Jina内容API处理错误: ${error.message}`)
    return {
      success: false,
      error: `处理请求时出错: ${error.message}`
    }
  }
})
