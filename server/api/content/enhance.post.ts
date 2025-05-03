/**
 * 内容增强API
 * 提供基于Jina AI API的内容丰富和优化功能
 */

import { defineEventHandler, readBody } from "h3"
import { logger } from "../../utils/logger"
import { enhanceContent } from "../../utils/contentEnhancer"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { content, title, options } = body

    if (!content) {
      return {
        success: false,
        error: "缺少必要参数: content"
      }
    }

    logger.info(`开始增强内容${title ? `: ${title}` : ''}`)
    
    // 设置增强选项
    const enhanceOptions = {
      title,
      addSummary: options?.addSummary !== false,
      addRelatedInfo: options?.addRelatedInfo !== false,
      translateTo: options?.translateTo || undefined
    }
    
    // 增强内容
    const result = await enhanceContent(content, enhanceOptions)
    
    // 如果增强成功，添加额外信息
    if (result.success) {
      return {
        ...result,
        title,
        timestamp: Date.now()
      }
    }
    
    return result
  } catch (error: any) {
    logger.error(`内容增强API处理错误: ${error.message}`)
    return {
      success: false,
      error: `处理请求时出错: ${error.message}`
    }
  }
})
